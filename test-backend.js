/**
 * Script para diagnosticar problemas con el backend
 * Ejecutar: node test-backend.js
 */

const BASE_URL = 'https://mapshub.onrender.com';

async function testEndpoint(endpoint, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 URL: ${BASE_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    console.log(`📝 Response (first 200 chars):`);
    console.log(text.substring(0, 200));
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log(`✅ Valid JSON`);
      console.log(`📦 Data:`, JSON.stringify(json, null, 2).substring(0, 300));
    } catch (e) {
      console.log(`❌ Invalid JSON: ${e.message}`);
      console.log(`🔍 First character code:`, text.charCodeAt(0));
      console.log(`🔍 First few characters:`, text.substring(0, 50));
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('─'.repeat(80));
}

async function runTests() {
  console.log('🚀 Backend Diagnostic Tool');
  console.log('=' .repeat(80));
  
  await testEndpoint('/', 'Root endpoint');
  await testEndpoint('/api/health', 'Health check');
  await testEndpoint('/api/places?category=coffee&limit=3', 'Places API');
  await testEndpoint('/api/events?location=Guatemala&limit=3', 'Events API');
  
  console.log('\n✅ Diagnostic complete!');
}

runTests();
