const fs = require('fs');
const { marked } = require('marked');
const HTMLToDOCX = require('html-to-docx');

const mdContent = fs.readFileSync('full_system_manual_arabic_with_base64.md', 'utf8');
let htmlContent = marked.parse(mdContent);

htmlContent = '<html dir="rtl"><head><meta charset="UTF-8"></head><body style="font-family: Arial; font-size: 16px;">' + htmlContent + '</body></html>';

(async () => {
    try {
        const fileBuffer = await HTMLToDOCX(htmlContent, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true
        });
        fs.writeFileSync('full_system_manual_arabic.docx', fileBuffer);
        console.log('Docx generated successfully');
    } catch (err) {
        console.error('Error generating docx:', err);
    }
})();
