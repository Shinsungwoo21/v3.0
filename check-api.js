const http = require('http');

const url = 'http://localhost:3001/api/performances/perf-jeong-o-byeol-jeom';

http.get(url, (res) => {
    let data = '';
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body:', data);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
