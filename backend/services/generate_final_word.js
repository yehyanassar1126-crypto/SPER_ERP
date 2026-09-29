const fs = require('fs');
const https = require('https');
const { marked } = require('marked');

let content = fs.readFileSync('Final_ERP_Proposal.md', 'utf8');
const regex = /```mermaid\n([\s\S]*?)```/g;
let matches = [];
let match;
while ((match = regex.exec(content)) !== null) {
    matches.push(match);
}

if (matches.length === 0) {
    console.log('No mermaid blocks found');
    process.exit(0);
}

let completed = 0;
matches.forEach((m, i) => {
    const encoded = Buffer.from(m[1].trim()).toString('base64');
    const url = 'https://mermaid.ink/img/' + encoded;
    
    https.get(url, (res) => {
        let data = [];
        res.on('data', (chunk) => {
            data.push(chunk);
        });
        res.on('end', () => {
            const buffer = Buffer.concat(data);
            const base64data = buffer.toString('base64');
            const dataUri = 'data:image/png;base64,' + base64data;
            content = content.replace(m[0], '<div style="text-align:center;"><img src="' + dataUri + '" style="max-width:100%; border:1px solid #ccc; margin:10px 0;" /></div>');
            completed++;
            
            if (completed === matches.length) {
                // Convert Markdown to HTML
                let html = marked.parse(content);
                
                // Wrap in Word-compatible HTML
                let wordHtml = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <title>Final ERP Proposal</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; font-size: 14pt; direction: rtl; }
                        h1 { color: #1e1b4b; font-size: 24pt; border-bottom: 2pt solid #4f46e5; }
                        h2 { color: #4f46e5; font-size: 18pt; margin-top: 20pt; }
                        h3 { color: #3b82f6; font-size: 16pt; }
                        table { border-collapse: collapse; width: 100%; margin-top: 15pt; }
                        th, td { border: 1pt solid #ccc; padding: 10pt; text-align: right; }
                        th { background-color: #f3f4f6; }
                        img { max-width: 600px; }
                        blockquote { background-color: #fef3c7; padding: 10pt; border-right: 4pt solid #f59e0b; }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
                `;
                
                // Save as .doc which Word will open flawlessly and render images
                fs.writeFileSync('Final_ERP_Proposal.doc', wordHtml);
                console.log('Word Document generated successfully as Final_ERP_Proposal.doc');
            }
        });
    }).on('error', (err) => {
        console.error('Error downloading image', err);
    });
});
