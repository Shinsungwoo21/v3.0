const https = require('https');

const url = 'https://megaticket.click/posters/exhibition-1.png';

console.log(`Testing Public Image: ${url}`);

const req = https.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`Content-Length: ${res.headers['content-length']}`);
});

req.on("error", (err) => {
    console.log("Error: " + err.message);
});
