(function (root) {
    const labels = { all: 'All', road: 'Road', trail: 'Trail', track: 'Track & field', mixed: 'Mixed', other: 'Other' };
    const controllers = new WeakMap();

    function classifyDiscipline(discipline, explicitSurface) {
        if (Object.hasOwn(labels, explicitSurface) && explicitSurface !== 'all') return explicitSurface;
        const value = String(discipline || '').toLowerCase().trim();
        if (/road\s*\/\s*trail/.test(value)) return 'mixed';
        if (/trail|trilho/.test(value)) return 'trail';
        if (/jump|shot put|javelin|hurdles|discus|\b\d+\s*(?:m|metres|meters)\b/.test(value)) return 'track';
        if (/road|half marathon|\b\d+(?:[.,]\d+)?\s*k(?:m)?\b|\bmiles?\b/.test(value)) return 'road';
        return 'other';
    }

    // Resolve shared cells without changing the original table or chart data.
    function readTable(table) {
        const fields = Array.from(table.tHead.rows[0].cells, cell => cell.dataset.resultField || '');
        const records = [], groups = [];
        let group = null;
        Array.from(table.tBodies).forEach(body => {
            const carried = [];
            Array.from(body.rows).forEach((row, index) => {
                if (row.cells.length === 1 && row.cells[0].colSpan >= fields.length) {
                    group = { row, records: [] };
                    groups.push(group);
                    return;
                }
                const resolved = carried.map(entry => entry && entry.until > index ? entry.cell : null);
                let column = 0;
                Array.from(row.cells).forEach(cell => {
                    while (resolved[column]) column++;
                    for (let offset = 0; offset < cell.colSpan; offset++) {
                        resolved[column + offset] = cell;
                        carried[column + offset] = { cell, until: cell.rowSpan === 0 ? body.rows.length : index + cell.rowSpan };
                    }
                    column += cell.colSpan;
                });
                const data = Object.fromEntries(fields.map((field, i) => [field, resolved[i]?.textContent.trim() || '']));
                const record = { row, ...data, surface: classifyDiscipline(data.discipline, row.dataset.surface) };
                records.push(record);
                group?.records.push(record);
            });
        });
        return { records, groups };
    }

    function createButtons(options, label, onSelect) {
        const controls = document.createElement('div');
        controls.className = 'race-filter-buttons';
        controls.setAttribute('role', 'group');
        controls.setAttribute('aria-label', label);
        options.forEach((value, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'race-filter-button';
            button.textContent = labels[value];
            button.dataset.surface = value;
            button.setAttribute('aria-pressed', String(index === 0));
            button.addEventListener('click', () => {
                controls.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
                onSelect(value);
            });
            controls.append(button);
        });
        return controls;
    }

    function initializeResults(table) {
        const model = readTable(table);
        let selectedSurface = 'all';
        const status = document.createElement('p');
        status.className = 'race-filter-status';
        status.setAttribute('role', 'status');
        const empty = document.createElement('p');
        empty.className = 'race-filter-empty';
        empty.textContent = 'No results match these filters.';
        empty.hidden = true;
        const yearSelect = table.closest('#results')?.querySelector('#year-select');
        function apply() {
            const year = yearSelect?.value || 'all';
            let shown = 0;
            model.records.forEach(record => {
                const visible = (selectedSurface === 'all' || record.surface === selectedSurface)
                    && (year === 'all' || record.row.dataset.year === year);
                record.row.hidden = !visible;
                // Also clear the previous year-only filter's inline display.
                record.row.style.display = visible ? '' : 'none';
                if (visible) shown++;
            });
            model.groups.forEach(group => {
                group.row.hidden = !group.records.some(record => !record.row.hidden);
            });
            status.textContent = `${shown} of ${model.records.length} results`;
            empty.hidden = shown !== 0;
            table.hidden = shown === 0;
        }
        const options = Object.keys(labels).filter(value => value === 'all' || model.records.some(record => record.surface === value));
        const filters = document.createElement('div');
        filters.className = 'race-filters';
        filters.append(createButtons(options, 'Filter results by surface', value => { selectedSurface = value; apply(); }), status);
        const wrapper = table.closest('.athletics-table-scroll') || table;
        wrapper.before(filters);
        wrapper.after(empty);
        yearSelect?.addEventListener('change', apply);
        controllers.set(table, apply);
        apply();
        return model;
    }

    function initializeProgression(model) {
        const roadPanel = document.querySelector('[data-progression-surface="road"]');
        if (!roadPanel || !model.records.some(record => record.surface === 'trail')) return;
        const trailPanel = document.createElement('section');
        trailPanel.className = 'trail-progression';
        trailPanel.hidden = true;
        const heading = document.createElement('h3');
        heading.textContent = 'Trail results';
        const note = document.createElement('p');
        note.className = 'progression-intro';
        note.textContent = 'Trail times depend on distance, elevation and terrain. Each race is shown separately, without a time comparison between different courses.';
        const list = document.createElement('ul');
        list.className = 'trail-results-list';
        model.records.filter(record => record.surface === 'trail').forEach(record => {
            const item = document.createElement('li');
            const title = document.createElement('strong');
            title.textContent = record.competition;
            const detail = document.createElement('span');
            detail.textContent = [record.date, record.discipline, record.performance].filter(Boolean).join(' · ');
            item.append(title, detail);
            list.append(item);
        });
        trailPanel.append(heading, note, list);
        const controls = createButtons(['road', 'trail'], 'Progression by surface', value => {
            roadPanel.hidden = value !== 'road';
            trailPanel.hidden = value !== 'trail';
        });
        roadPanel.before(controls);
        roadPanel.after(trailPanel);
    }

    function initialize() {
        document.querySelectorAll('table[data-race-results]').forEach(table => {
            const model = initializeResults(table);
            initializeProgression(model);
        });
    }

    const api = { classifyDiscipline, readTable, refresh: table => controllers.get(table)?.() };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root && typeof document !== 'undefined') {
        root.AthleticsRaces = api;
        initialize();
    }
})(typeof window === 'undefined' ? null : window);
