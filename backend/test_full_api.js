const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  try {
    console.log('🔐 Testing login endpoint...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'sarah@ddinfoways.co.nz',
      password: 'test123'
    });
    
    console.log('Status:', loginResponse.status);
    console.log('Response:', loginResponse.body);

    if (loginResponse.status === 200 && loginResponse.body.data?.accessToken) {
      const token = loginResponse.body.data.accessToken;
      console.log('\n✅ Login successful! Token:', token.substring(0, 20) + '...');

      console.log('\n📊 Testing GET /api/staff with auth...');
      
      const staffOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/staff',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const staffRes = await new Promise((resolve) => {
        const req = http.request(staffOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        });
        req.on('error', (e) => resolve({ status: 500, body: e.message }));
        req.end();
      });

      console.log('Status:', staffRes.status);
      if (staffRes.status === 200) {
        console.log('✅ Staff endpoint working!');
        console.log('Staff count:', staffRes.body.data?.length || 0);
        console.log('First staff:', JSON.stringify(staffRes.body.data?.[0], null, 2).substring(0, 300));
      } else {
        console.log('❌ Error:', staffRes.body);
      }
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

test();