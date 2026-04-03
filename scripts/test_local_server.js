const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const cookies = res.headers['set-cookie'];
    if (!cookies) {
        console.log('No cookies, login failed:', data);
        process.exit(1);
    }
    const tokenCookie = cookies[0].split(';')[0];
    
    // Test finance summary
    const req2 = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/finance/summary',
        method: 'GET',
        headers: { 'Cookie': tokenCookie }
    }, res2 => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
            console.log('Finance Summary Response:', res2.statusCode, data2.substring(0, 100));
            process.exit(0);
        });
    });
    req2.end();
  });
});

req.write(JSON.stringify({ email: 'admin@gmail.com', password: '12345', role: 'admin' }));
req.end();
