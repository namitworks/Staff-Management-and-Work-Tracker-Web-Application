const http = require('http');

async function testAPI() {
  try {
    console.log('Testing GET /api/staff...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/staff',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('✅ Success! Status:', res.statusCode);
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2).substring(0, 500));
        } catch (e) {
          console.log('Response:', data.substring(0, 500));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
    });

    req.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();