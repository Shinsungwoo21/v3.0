import json
import codecs

with codecs.open('output.json', 'r', 'utf-16') as f:
    data = json.load(f)

with open('clean_output.json', 'w', 'utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)
