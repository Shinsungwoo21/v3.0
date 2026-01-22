const https = require('https');

const url = 'https://megaticket.click/api/performances/perf-free-fall?region=ap-northeast-2';

console.log(`Testing Public API for: ${url}`);

const req = https.get(url, (res) => {
    let data = '';
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body length:', data.length);
        if (data.length > 0) {
            try {
                const json = JSON.parse(data);
                console.log('Title:', json.title);
            } catch (e) {
                console.log('Body preview:', data.substring(0, 200));
            }
        }
    });

});

req.on("error", (err) => {
    console.log("Error: " + err.message);
});
