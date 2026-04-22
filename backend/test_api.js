const http = require('http');

const test = (path) => {
  http.get(`http://localhost:5000/api${path}`, (res) => {
    console.log(`Path: /api${path} | Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`Error pinging ${path}:`, err.message);
  });
};

test('/health');
test('/auth/me'); // Should be 401
test('/salary/1'); // Should be 401 or 404
test('/leaves'); // Should be 401 or 404
