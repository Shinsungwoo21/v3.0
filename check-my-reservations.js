const http = require('http');

// mock-user-01의 예약 내역 조회
const url = 'http://localhost:3001/api/reservations?userId=mock-user-01';

console.log(`Testing API for: ${url}`);

const req = http.get(url, (res) => {
    let data = '';
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body length:', data.length);
        try {
            const json = JSON.parse(data);
            console.log('Result count:', Array.isArray(json) ? json.length : 'Not array');
            if (Array.isArray(json) && json.length > 0) {
                console.log('First item:', JSON.stringify(json[0], null, 2));
            }
        } catch (e) {
            console.log('Response is not JSON:', data.substring(0, 200));
        }
    });
});

req.on("error", (err) => {
    console.log("Error: " + err.message);
});
