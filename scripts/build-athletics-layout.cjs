// Update the shared sidebar on content pages. Photography pages are read-only references.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const targets = ['AthleticsDB.html', 'TiagoSilva.html', 'AthleticsReferences.html', 'AthleticsDB/AthleticsDetails.html', 'Research.html',
    ...fs.readdirSync(path.join(root, 'shoes')).filter(name => name.endsWith('.html')).map(name => `shoes/${name}`)];
const photo = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const menu = photo.match(/<ul class="menu-nav[\s\S]*?<\/ul>/)[0];
const links = [...menu.matchAll(/<a href="\.\/([^"]+)"[^>]*>([^<]+)<\/a>/g)];
const social = photo.match(/<div id="social"[\s\S]*?<\/ul>/)[0];
const socialLinks = [...social.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
for (const target of targets) {
    const prefix = target.includes('/') ? '../' : './';
    const activeSection = target === 'Research.html' ? 'Research.html' : 'AthleticsDB.html';
    const nav = `<!-- athletics:navigation -->
<a class="athlete-skip" href="#athlete-content">Skip to content</a>
<header class="athlete-sidebar">
    <a class="athlete-brand" href="${prefix}index.html">Bruno Yamazaky</a>
    <button class="athlete-menu-toggle" type="button" aria-controls="athlete-menu-panel" aria-expanded="false" hidden>Menu ☰</button>
    <div class="athlete-menu-panel" id="athlete-menu-panel">
        <nav class="athlete-navigation" aria-label="Main navigation">
${links.map(([, url, label]) => `            <a href="${prefix}${url}"${['Research.html', 'Blog.html'].includes(url) ? ' class="nav-group-start"' : ''}${url === activeSection ? ' aria-current="' + (target === url ? 'page' : 'location') + '"' : ''}>${label}</a>`).join('\n')}
        </nav>
        <footer class="athlete-footer">
            <div class="athlete-social">
${socialLinks.map(([, url, svg]) => `                <a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${url.includes('instagram') ? 'Instagram' : url.includes('youtube') ? 'YouTube' : 'Behance'}">${svg.trim().replace('<svg ', '<svg aria-hidden="true" ')}</a>`).join('\n')}
            </div>
            <p>Bruno Yamazaky © All rights reserved</p>
        </footer>
    </div>
</header>
<!-- /athletics:navigation -->`;
    const file = path.join(root, target);
    const original = fs.readFileSync(file, 'utf8');
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    let html = original.replace(/\r\n/g, '\n');
    const assets = `<!-- athletics:assets -->
<link rel="stylesheet" href="${prefix}Overview/webtype_fonts.min-51d9b9edb8f956fb39da113609d790ba607fa4fbda053af8e378bb9233ef4a39.css">
<link rel="stylesheet" href="${prefix}AthleticsDB/css/portfolio-layout.css">
<link rel="stylesheet" href="${prefix}assets/navigation.css">
<script src="${prefix}AthleticsDB/js/portfolio-layout.js" defer></script>
<!-- /athletics:assets -->`;
    if (html.includes('<!-- athletics:navigation -->')) {
        html = html.replace(/<!-- athletics:navigation -->[\s\S]*?<!-- \/athletics:navigation -->/, nav)
            .replace(/<!-- athletics:assets -->[\s\S]*?<!-- \/athletics:assets -->/, assets);
    } else if (html.includes('id="athlete-content"')) {
        html = html.replace('</head>', `${assets}\n</head>`)
            .replace(/<body([^>]*)>/, `<body$1>\n${nav}`);
    } else {
        html = html.replace(/<nav class="site-nav"[\s\S]*?<\/nav>/, '')
            .replace('</head>', `${assets}\n</head>`)
            .replace(/<body([^>]*)>/, (_, attrs) => {
                const classes = `athletics-page${target.startsWith('shoes/') ? ' athletics-reviews' : ''}`;
                attrs = /class="/.test(attrs) ? attrs.replace('class="', `class="${classes} `) : `${attrs} class="${classes}"`;
                return `<body${attrs}>\n${nav}\n<div class="athlete-content" id="athlete-content"${target.startsWith('shoes/') ? '' : ' role="main"'} tabindex="-1">`;
            }).replace('</body>', '</div><!-- /athlete-content -->\n</body>');
    }
    html = html.replace(/(id="athlete-content"[^>]*>)\s+(?=<div class="(?:container|athletics-profile-container))/, '$1\n\n');
    fs.writeFileSync(file, html.replace(/\n/g, eol));
}
console.log(`Updated navigation on ${targets.length} content pages. Photography unchanged.`);
