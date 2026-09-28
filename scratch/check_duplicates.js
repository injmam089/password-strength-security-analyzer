const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../web/index.html'), 'utf8');

const idRegex = /id="([^"]+)"/g;
let match;
const seen = new Map();
while ((match = idRegex.exec(html)) !== null) {
  const id = match[1];
  seen.set(id, (seen.get(id) || 0) + 1);
}

let dups = 0;
for (const [id, count] of seen.entries()) {
  if (count > 1) {
    console.log('DUPLICATE ID:', id, 'COUNT:', count);
    dups++;
  }
}
if (dups === 0) {
  console.log('No duplicate IDs found!');
}
