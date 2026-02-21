const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://dyvchjqtwhadgybwmbjl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dmNoanF0d2hhZGd5YndtYmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwMjAyMiwiZXhwIjoyMDg0NDc4MDIyfQ.A3c5yPGtO6ry9CdSKLMwVrYHEJHH8p9UdAeWTcRj3ZY';
const BUCKET = 'event-images';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function isExternal(url) { return url && !url.includes('supabase.co/storage'); }

function download(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const parts = [];
      res.on('data', d => parts.push(d));
      res.on('end', () => resolve({ buf: Buffer.concat(parts), ct: res.headers['content-type'] || 'image/jpeg' }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function upload(buf, ct, path) {
  const ext = (ct.split('/')[1] || 'jpg').split(';')[0];
  const full = path + '.' + ext;
  const { error } = await sb.storage.from(BUCKET).upload(full, buf, { contentType: ct, upsert: true });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(full).data.publicUrl;
}

async function ensureBucket() {
  const { data } = await sb.storage.listBuckets();
  if (!(data || []).some(b => b.name === BUCKET)) {
    await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10485760 });
  }
  console.log('Bucket listo: ' + BUCKET);
}

async function migrateEvents() {
  console.log('\n--- EVENTOS ---');
  const { data, error } = await sb.from('events').select('id, title, image').not('image', 'is', null);
  if (error) throw error;
  const list = data.filter(e => isExternal(e.image));
  console.log('A migrar: ' + list.length);
  let ok = 0, fail = 0;
  for (const ev of list) {
    try {
      const { buf, ct } = await download(ev.image);
      const url = await upload(buf, ct, 'events/ev_' + ev.id);
      await sb.from('events').update({ image: url }).eq('id', ev.id);
      console.log('OK ' + ev.title);
      ok++;
    } catch (e) {
      console.log('FAIL ' + ev.title + ': ' + e.message);
      fail++;
    }
    await sleep(400);
  }
  return { ok, fail };
}

async function migrateProcessions() {
  console.log('\n--- PROCESIONES ---');
  const { data, error } = await sb.from('procesiones').select('id, nombre, imagenes_procesion, imagenes_recorrido');
  if (error) throw error;
  let ok = 0, fail = 0;
  for (const p of data) {
    console.log('Procesion: ' + p.nombre);
    const pro = p.imagenes_procesion || [];
    const rec = p.imagenes_recorrido || [];
    const newPro = [];
    const newRec = [];
    for (let i = 0; i < pro.length; i++) {
      if (!isExternal(pro[i])) { newPro.push(pro[i]); continue; }
      try {
        const { buf, ct } = await download(pro[i]);
        newPro.push(await upload(buf, ct, 'procesiones/' + p.id + '_pro_' + i));
        console.log('  pro[' + i + '] OK'); ok++;
      } catch (e) { newPro.push(pro[i]); console.log('  pro[' + i + '] FAIL: ' + e.message); fail++; }
      await sleep(400);
    }
    for (let i = 0; i < rec.length; i++) {
      if (!isExternal(rec[i])) { newRec.push(rec[i]); continue; }
      try {
        const { buf, ct } = await download(rec[i]);
        newRec.push(await upload(buf, ct, 'procesiones/' + p.id + '_rec_' + i));
        console.log('  rec[' + i + '] OK'); ok++;
      } catch (e) { newRec.push(rec[i]); console.log('  rec[' + i + '] FAIL: ' + e.message); fail++; }
      await sleep(400);
    }
    await sb.from('procesiones').update({ imagenes_procesion: newPro, imagenes_recorrido: newRec }).eq('id', p.id);
  }
  return { ok, fail };
}

async function main() {
  console.log('INICIO: ' + new Date().toISOString());
  await ensureBucket();
  const ev = await migrateEvents();
  const pr = await migrateProcessions();
  const total = ev.ok + pr.ok;
  const totalFail = ev.fail + pr.fail;
  console.log('\nRESUMEN: ' + total + ' migradas, ' + totalFail + ' fallidas');
  console.log('FIN: ' + new Date().toISOString());
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
