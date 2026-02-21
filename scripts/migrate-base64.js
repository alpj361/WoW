const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dyvchjqtwhadgybwmbjl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dmNoanF0d2hhZGd5YndtYmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwMjAyMiwiZXhwIjoyMDg0NDc4MDIyfQ.A3c5yPGtO6ry9CdSKLMwVrYHEJHH8p9UdAeWTcRj3ZY';
const BUCKET = 'event-images';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log('Migrando imágenes base64...');
  const { data, error } = await sb.from('events').select('id, title, image').like('image', 'data:%');
  if (error) throw error;

  // Deduplicate by id
  const seen = new Set();
  const unique = data.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });
  console.log('Total base64 a migrar: ' + unique.length);

  let ok = 0, fail = 0;
  for (const ev of unique) {
    try {
      const match = ev.image.match(/^data:([^;]+);base64,(.+)$/s);
      if (!match) throw new Error('formato data: invalido');
      const ct = match[1];
      const buf = Buffer.from(match[2], 'base64');
      const ext = (ct.split('/')[1] || 'jpg').split(';')[0];
      const path = 'events/ev_' + ev.id + '.' + ext;
      const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: ct, upsert: true });
      if (upErr) throw upErr;
      const url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      await sb.from('events').update({ image: url }).eq('id', ev.id);
      console.log('OK ' + ev.title + ' -> ' + url.substring(0, 60) + '...');
      ok++;
    } catch (e) {
      console.log('FAIL ' + ev.title + ': ' + e.message);
      fail++;
    }
  }
  console.log('\nRESUMEN: ' + ok + ' OK, ' + fail + ' fallidas');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
