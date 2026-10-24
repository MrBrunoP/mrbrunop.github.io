const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'site/publications.json'), 'utf8'));
const typeLabels = { journal: 'Journal article', conference: 'Conference paper', poster: 'Poster', chapter: 'Book chapter contribution' };
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const years = [...new Set(data.publications.map(publication => publication.year))].sort((a, b) => b - a);
const updatedLabel = new Date(`${data.updated}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const seen = new Set();
for (const publication of data.publications) {
    const key = publication.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!publication.title || !Number.isInteger(publication.year) || !typeLabels[publication.type] || seen.has(key)) throw new Error('Missing or duplicated publication: ' + publication.title);
    seen.add(key);
    if (!['https:'].includes(new URL(publication.url).protocol)) throw new Error('Publication links must use HTTPS');
}
const sections = years.map(year => `    <section class="publication-year" id="year-${year}" aria-labelledby="heading-${year}">
      <h3 id="heading-${year}">${year}</h3>
      <ol class="publication-list">
${data.publications.filter(publication => publication.year === year).map(publication => `        <li class="publication" data-type="${publication.type}">
          <article>
            <p class="publication-type">${typeLabels[publication.type]}${publication.date ? ` · <time datetime="${escape(publication.date)}">${new Date(publication.date + '-01T12:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</time>` : ''}</p>
            <h4><a href="${escape(publication.url)}" target="_blank" rel="noopener noreferrer">${escape(publication.title)}</a></h4>
            <p class="publication-authors">${escape(publication.authors)}${publication.contribution ? ` · ${escape(publication.contribution)}` : ''}</p>
            ${publication.book ? `<p class="publication-book">In <cite>${escape(publication.book)}</cite></p>` : ''}
            ${publication.venue ? `<p class="publication-venue">${escape(publication.venue)}</p>` : ''}
            ${publication.bookAuthors ? `<p class="publication-venue">Book authors: ${escape(publication.bookAuthors)}</p>` : ''}
            ${publication.isbn ? `<p class="publication-venue">ISBN ${escape(publication.isbn)}</p>` : ''}
          </article>
        </li>`).join('\n')}
      </ol>
    </section>`).join('\n');
const file = path.join(root, 'Research.html');
const previousFile = fs.existsSync(file) ? file : path.join(root, 'Publications.html');
const previous = fs.existsSync(previousFile) ? fs.readFileSync(previousFile, 'utf8') : '';
const navigation = previous.match(/<!-- athletics:navigation -->[\s\S]*?<!-- \/athletics:navigation -->/)?.[0] || '';
const assets = previous.match(/<!-- athletics:assets -->[\s\S]*?<!-- \/athletics:assets -->/)?.[0] || '';
fs.writeFileSync(file, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Bruno Peixoto, PhD in Informatics and researcher at INESC TEC. Research, publications, posters and chapter contributions in virtual reality for education.">
  <title>Bruno Peixoto — Research</title>
${assets}
  <link rel="stylesheet" href="./assets/publications.css">
  <script src="./assets/publications.js" defer></script>
</head>
<body class="athletics-page publications-page">
${navigation}
<div class="athlete-content" id="athlete-content" role="main" tabindex="-1">
  <header class="publications-header">
    <p class="publications-name">Research</p>
    <h1>${escape(data.name)}</h1>
    <ul class="research-facts">
      <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5ZM7 12v5c3 3 7 3 10 0v-5M21 9v7"></path></svg><span>${escape(data.profile.degree)} · ${escape(data.profile.university)}</span></li>
      <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V3h12v18M16 9h4v12M8 7h4M8 11h4M8 15h4M9 21v-2h2v2M2 21h20"></path></svg><span>${escape(data.profile.role)} at <abbr title="${escape(data.profile.organizationFull)}">${escape(data.profile.organization)}</abbr></span></li>
      <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg><span>${escape(data.profile.country)}</span></li>
    </ul>
    <p class="publications-intro">${escape(data.profile.summary)}</p>
    <div class="academic-links" aria-label="Academic profiles">
      <a href="${escape(data.profiles.scholar)}" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5ZM7 12v5c3 3 7 3 10 0v-5M21 9v7"></path></svg>
        Google Scholar
      </a>
      <a href="${escape(data.profiles.cienciavitae)}" target="_blank" rel="noopener noreferrer" title="Full academic CV on Ciência Vitae">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H5v18h14V8l-5-5ZM14 3v5h5M9 13h6M9 17h6"></path></svg>
        Ciência Vitae
      </a>
    </div>
  </header>
  <section class="research-publications" aria-labelledby="publications-heading">
    <h2 id="publications-heading">Publications</h2>
    <div class="publication-filters" role="group" aria-label="Filter publications by type" hidden>
      <button type="button" data-type="all" aria-pressed="true">All</button>
      <button type="button" data-type="journal" aria-pressed="false">Articles</button>
      <button type="button" data-type="conference" aria-pressed="false">Conference papers</button>
      <button type="button" data-type="poster" aria-pressed="false">Posters</button>
      <button type="button" data-type="chapter" aria-pressed="false">Book chapters</button>
    </div>
    <p class="publication-count" role="status"></p>
    <nav class="publication-years" aria-label="Publications by year">
${years.map(year => `      <a href="#year-${year}">${year}</a>`).join('\n')}
    </nav>
  <div class="publications-list">
${sections}
  </div>
  </section>
  <footer class="publication-source">Research outputs listed on <a href="${escape(data.profiles.scholar)}" target="_blank" rel="noopener noreferrer">Google Scholar</a> and <a href="${escape(data.profiles.cienciavitae)}" target="_blank" rel="noopener noreferrer">Ciência Vitae</a>. Updated <time datetime="${escape(data.updated)}">${updatedLabel}</time>.</footer>
</div>
</body>
</html>
`);
fs.writeFileSync(path.join(root, 'Publications.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Research — Bruno Peixoto</title><link rel="canonical" href="./Research.html"><meta http-equiv="refresh" content="0; url=./Research.html"><script>location.replace('./Research.html' + location.search + location.hash);</script></head><body><p>This page is now <a href="./Research.html">Research</a>.</p></body></html>\n`);
console.log(`Built Research.html with ${data.publications.length} research outputs across ${years.length} years.`);
require('./build-athletics-layout.cjs');
