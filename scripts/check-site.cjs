const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
// Reproduce navigating immediately after Overview loads, while delayed refreshes are pending.
const overviewHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const overviewFallback = [...overviewHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .find(match => match[1].includes('function applyMobileGalleryFallback()'))[1];
function checkOverviewNavigation(startAtSecond) {
    let activeIndex = startAtSecond ? 1 : 0;
    const pending = [], events = {};
    const images = ['./Overview/IMG_5881-Pano-Edit.jpg', './Overview/bruno-yamazaky-efcO0fw396I-unsplash.jpg']
        .map((src, index) => ({
            attributes: { src, 'data-src': src }, style: {},
            classList: { add() {}, remove() {} },
            getAttribute(name) { return this.attributes[name] || null; },
            setAttribute(name, value) { this.attributes[name] = value; },
            removeAttribute(name) { delete this.attributes[name]; },
            closest() { return { classList: { contains: () => activeIndex === index } }; },
        }));
    const secondSource = images[1].attributes.src;
    vm.runInNewContext(overviewFallback, {
        document: {
            body: { classList: { contains: () => true } },
            querySelector: selector => selector.includes('flex-active-slide') ? images[activeIndex] : images[0],
            querySelectorAll: () => images,
        },
        window: {
            matchMedia: () => ({ matches: false }),
            setTimeout: callback => pending.push(callback),
            addEventListener: (name, callback) => { events[name] = callback; },
        },
    });
    activeIndex = 1;
    events.load?.();
    events.pageshow?.();
    pending.forEach(callback => callback());
    assert.equal(images[1].attributes.src, secondSource, 'Delayed Overview refresh must not replace the second photograph');
    assert.equal(images[1].attributes['data-src'], secondSource);
}
checkOverviewNavigation(false);
checkOverviewNavigation(true);
const raceFilters = require('../AthleticsDB/js/race-filters.js');
for (const [discipline, surface] of [
    ['10K', 'road'], ['Half Marathon', 'road'], ['2 Mile', 'road'],
    ['10K Mini Trail', 'trail'], ['15K Trail (842 D+)', 'trail'],
    ['10K (Road/Trail)', 'mixed'], ['1000 metres', 'track'],
    ['110m hurdles', 'track'], ['Shot put (5kg)', 'track'], ['', 'other'],
]) assert.equal(raceFilters.classifyDiscipline(discipline), surface);
assert.equal(raceFilters.classifyDiscipline('10K', 'mixed'), 'mixed');
// Shared competition/year cells must survive surface filtering in the profile tables.
const cell = (textContent, rowSpan = 1, colSpan = 1) => ({ textContent, rowSpan, colSpan });
const syntheticRows = [
    { cells: [cell('Track club', 1, 6)], dataset: {} },
    { cells: [cell('2011', 2), cell('Track meeting', 2), cell('Guimarães', 2), cell('5th'), cell('100 metres'), cell('14.17')], dataset: {} },
    { cells: [cell('10th'), cell('Long jump'), cell('4.25 m')], dataset: {} },
    { cells: [cell('NAVR', 1, 6)], dataset: {} },
    { cells: ['2026', 'Trail race', 'Tresminas', '6th', '15K Trail', '02:51:53'].map(text => cell(text)), dataset: {} },
];
const raceModel = raceFilters.readTable({
    tHead: { rows: [{ cells: ['date', 'competition', 'venue', 'position', 'discipline', 'performance'].map(resultField => ({ dataset: { resultField } })) }] },
    tBodies: [{ rows: syntheticRows }],
});
assert.equal(raceModel.records.length, 3);
assert.equal(raceModel.records[1].competition, 'Track meeting');
assert.equal(raceModel.records[1].date, '2011');
assert.equal(raceModel.records[1].surface, 'track');
assert.equal(raceModel.groups[0].records.length, 2);
assert.equal(raceModel.groups[1].records[0].surface, 'trail');
function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
        ['.git', 'node_modules'].includes(entry.name) ? [] : entry.isDirectory()
            ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
const files = walk(root);
const relativeFiles = new Set(files.map(file => path.relative(root, file).replaceAll('\\', '/')));
const errors = [];
let pages = 0, links = 0;
for (const file of files.filter(file => file.endsWith('.html'))) {
    pages++;
    const html = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const match of html.matchAll(/<(a|img|script|link|iframe|source)\b[^>]*?\b(href|src)=["']([^"']+)["']/gi)) {
        const url = match[3];
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) continue;
        const resource = decodeURIComponent(url.split(/[?#]/)[0]);
        if (!resource) continue;
        const target = path.resolve(resource.startsWith('/') ? root : path.dirname(file), resource.replace(/^\//, ''));
        const relative = path.relative(root, target).replaceAll('\\', '/');
        links++;
        if (!relativeFiles.has(relative) && !relativeFiles.has(relative.replace(/\/$/, '') + '/index.html')) {
            errors.push(`${path.relative(root, file)}: missing resource or wrong case: ${url}`);
        }
    }
    for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (/\bsrc=|type=["'](?:application\/ld\+json|text\/template)/i.test(script[1]) || !script[2].trim()) continue;
        try { new vm.Script(script[2], { filename: path.relative(root, file) }); }
        catch (error) { errors.push(error.message + ' in ' + path.relative(root, file)); }
    }
}
const callbacks = [];
const document = {
    addEventListener: (name, callback) => callbacks.push(callback),
    querySelector: () => null, querySelectorAll: () => [],
    getElementById: () => null,
};
const context = vm.createContext({ document, window: { location: { hash: '' } } });
vm.runInContext(fs.readFileSync(path.join(root, 'AthleticsDB/js/athletics.js'), 'utf8'), context);
assert.equal(context.parseDateFromResults('29 Feb 2024').toISOString(), '2024-02-29T00:00:00.000Z');
for (const date of ['29 Feb 2025', '31 Apr 2026', 'invalid', '0 Jan 2026']) assert.equal(context.parseDateFromResults(date), null);
assert.equal(context.parseTimeToSeconds('1:23:45'), 5025);
assert.equal(context.parseTimeToSeconds('34:12.5'), 2052.5);
for (const time of ['-1', '1:60', '1::2', 'Infinity', '--']) assert.equal(context.parseTimeToSeconds(time), null);
assert.doesNotThrow(() => callbacks.forEach(callback => callback()));
// Moving table columns must not change the interpreted result.
document.querySelectorAll = selector => selector.endsWith('thead th')
    ? ['performance', 'competition', 'date', 'discipline'].map(resultField => ({ dataset: { resultField } }))
    : [{ querySelectorAll: () => ['34:12.5', 'Test race', '29 Feb 2024', '10K (Road)'].map(textContent => ({ textContent })) }];
const reorderedSeries = context.readProgressionSeriesFromResults(name => name === '10K (Road)');
assert.equal(reorderedSeries.length, 1);
assert.equal(reorderedSeries[0].seconds, 2052.5);
assert.equal(reorderedSeries[0].competitionText, 'Test race');
// The public data must never contain financial values or embedded credentials.
const gearSource = fs.readFileSync(path.join(root, 'AthleticsDB/js/gear.js'), 'utf8');
const gearData = vm.runInNewContext(gearSource.match(/const gearSampleData = (\[[\s\S]*?\]);/)[1]);
assert(gearData.length > 0);
for (const row of gearData) {
    for (const field of ['price', 'buy_price', 'sell_price', 'price_per_km']) assert.equal(row[field], undefined);
}
assert(!/gearAccessPassword|gearSyncAccessKey/.test(gearSource));
new vm.Script(gearSource);
async function checkGearInteractions() {
    const nodes = new Map(), storage = new Map();
    const node = id => {
        if (!nodes.has(id)) nodes.set(id, {
            handlers: {}, children: [], hidden: false, value: '', files: [],
            addEventListener(event, callback) { this.handlers[event] = callback; },
            appendChild(child) { this.children.push(child); },
            setAttribute() {}, focus() {},
        });
        return nodes.get(id);
    };
    const gearContext = vm.createContext({
        document: { getElementById: node, querySelectorAll: () => [], createElement: () => ({}) },
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    });
    vm.runInContext(gearSource, gearContext);
    gearContext.initializeGearDashboard();
    assert.equal(node('gear-chart-fallback').hidden, false, 'Tables must survive a missing chart library');
    assert.match(node('gear-totalSpend').innerHTML, /Private/);
    const synthetic = gearData.map(row => ({ shoe: row.shoe, price: 10 }));
    assert.throws(() => gearContext.gearValidateFinances(synthetic.slice(1)), /every shoe/);
    assert.throws(() => gearContext.gearValidateFinances([{ ...synthetic[0], price: -1 }, ...synthetic.slice(1)]), /non-negative/);
    node('gear-lock-input').files = [{ size: 5000, text: async () => JSON.stringify(synthetic) }];
    await node('gear-lock-form').handlers.submit({ preventDefault() {} });
    assert.equal(node('gear-totalSpend').innerHTML, `${(gearData.length * 10).toFixed(2)} EUR`);
    assert.equal(storage.size, 0, 'Import must not persist financial values');
    node('gear-sync-fab').handlers.click();
    node('gear-sync-input').value = gearData[0].shoe + ' 321.5 km';
    node('gear-sync-backend').handlers.click();
    const saved = JSON.parse(storage.get('gear-mileage-v1'));
    assert.equal(saved[gearData[0].shoe], 321.5);
    assert(Object.values(saved).every(value => typeof value === 'number'));
    assert.equal(gearContext.gearLoadMileage()[0].mileage, 321.5);
    gearContext.gearClearFinances();
    assert.match(node('gear-totalSpend').innerHTML, /Private/);
    assert.equal(vm.runInContext('gearAccessUnlocked', gearContext), false);
    assert(vm.runInContext('gearCurrentData.every(row => row.price === 0 && row.buy_price === undefined && row.sell_price === undefined)', gearContext));
    assert.equal(gearContext.gearLoadMileage()[0].mileage, 321.5, 'Clearing finances must preserve mileage');
    gearContext.localStorage.getItem = () => { throw new Error('Storage blocked'); };
    gearContext.localStorage.setItem = () => { throw new Error('Storage blocked'); };
    assert.doesNotThrow(() => gearContext.gearLoadMileage());
    assert.equal(gearContext.gearSaveMileage(), false);
}
checkGearInteractions().then(() => {
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
    else console.log(`Passed: ${pages} HTML pages, ${links} local references, inline script syntax, athletics parsing, missing-tab handling, private import/clear and mileage persistence.`);
}).catch(error => { console.error(error); process.exitCode = 1; });
