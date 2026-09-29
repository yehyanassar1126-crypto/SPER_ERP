const fs = require('fs');
const https = require('https');
const mdPdf = require('markdown-pdf');

let content = fs.readFileSync('full_system_manual_arabic.md', 'utf8');
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
            content = content.replace(m[0], '<img src="' + dataUri + '" style="width:100%; max-width:800px; display:block; margin:20px auto;" />');
            completed++;
            
            if (completed === matches.length) {
                fs.writeFileSync('full_system_manual_arabic_with_base64.md', content);
                console.log('All images downloaded as base64. Generating PDF...');
                
                mdPdf({cssPath: '../../frontend/shared/css/pdf-style.css', paperFormat: 'A4', remarkable: {html: true}}).from('full_system_manual_arabic_with_base64.md').to('full_system_manual_arabic.pdf', function() {
                    console.log('PDF generated successfully with base64 images.');
                });
            }
        });
    }).on('error', (err) => {
        console.error('Error downloading image', err);
    });
});
