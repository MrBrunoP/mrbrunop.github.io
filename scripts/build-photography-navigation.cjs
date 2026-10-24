const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const order = ['index.html', 'Portfolio.html', 'Projects.html', 'Analog.html', 'Motion.html', 'Research.html', 'AthleticsDB.html', 'Blog.html'];
const startsGroup = file => ['Research.html', 'Blog.html'].includes(file);
const route = html => path.posix.basename(html.match(/href="([^"]+)"/)[1].split(/[?#]/)[0]);
const groupClass = (html, grouped) => html.replace(/class="([^"]*)"/, (_, classes) =>
    `class="${classes.split(/\s+/).filter(name => name && name !== 'nav-group-start').concat(grouped ? ['nav-group-start'] : []).join(' ')}"`);
function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
        ['.git', 'node_modules', 'archive_pages'].includes(entry.name) ? [] : entry.isDirectory()
            ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}
let count = 0;
for (const file of walk(root).filter(file => file.endsWith('.html') && !file.endsWith('Analog copy.html'))) {
    const original = fs.readFileSync(file, 'utf8');
    if (!original.includes('class="menu-nav')) continue;
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    let html = original.replace(/\r\n/g, '\n');
    let desktop;
    html = html.replace(/(<ul class="menu-nav[^>]*>)([\s\S]*?)(<\/ul>)/, (_, open, body, close) => {
        desktop = new Map([...body.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/g)].map(match => [route(match[0]), match[0]]));
        for (const page of order) if (!desktop.has(page)) throw new Error(`Missing ${page} in ${file}`);
        return open + '\n' + order.map(page => '        ' + groupClass(desktop.get(page), startsGroup(page))).join('\n') + '\n' + close;
    });
    html = html.replace(/(<div class="mobile-menu-links">)([\s\S]*?)(<\/div>)/, (_, open, body, close) => {
        const mobile = new Map([...body.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match => [route(match[0]), match[0]]));
        return open + '\n' + order.map(page => {
            const fallback = desktop.get(page).match(/<a\b[^>]*>[\s\S]*?<\/a>/)[0]
                .replace(/ class="[^"]*"/, '').replace('<a ', '<a class="item needsclick" ');
            return '          ' + groupClass(mobile.get(page) || fallback, startsGroup(page));
        }).join('\n') + '\n' + close;
    });
    if (!html.includes('assets/navigation.css')) {
        const prefix = path.relative(path.dirname(file), root).replaceAll('\\', '/') || '.';
        html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}/assets/navigation.css">\n</head>`);
    }
    fs.writeFileSync(file, html.replace(/\n/g, eol));
    count++;
}
console.log(`Ordered and grouped navigation on ${count} photography pages.`);
require('./build-athletics-layout.cjs');
