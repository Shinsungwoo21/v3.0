const fs = require('fs');
try {
    const data = JSON.parse(fs.readFileSync('node_output.json', 'utf8'));
    const item = data.Item;
    const structure = {};
    for (const key in item) {
        structure[key] = JSON.stringify(item[key]);
    }
    fs.writeFileSync('structure.txt', JSON.stringify(structure, null, 2));
} catch (e) {
    console.error(e);
}
