const fs = require('fs');
const htmlDocx = require('html-docx-js');
const { marked } = require('marked');

let html = marked.parse(fs.readFileSync('full_system_manual_arabic_with_base64.md', 'utf8'));
html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body dir="rtl" style="font-family: Arial, sans-serif;">' + html + '</body></html>';

const docx = htmlDocx.asBlob(html);
async function save() {
  let buf;
  if (docx.arrayBuffer) {
    buf = Buffer.from(await docx.arrayBuffer());
  } else {
    buf = docx; // it's already a buffer
  }
  fs.writeFileSync('full_system_manual_arabic.docx', buf);
  console.log('Docx generated successfully');
}
save();
