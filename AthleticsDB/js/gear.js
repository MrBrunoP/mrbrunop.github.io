const gearSampleData = [
    {
        "shoe": "Adidas Adizero Evo SL",
        "brand": "Adidas",
        "status": "In Rotation",
        "type": "Running",
        "mileage": 285.6
    },
    {
        "shoe": "ASICS Trabuco Max 3",
        "brand": "ASICS",
        "status": "In Rotation",
        "type": "Trail",
        "mileage": 127.9
    },
    {
        "shoe": "Nike Vomero Plus",
        "brand": "Nike",
        "status": "In Rotation",
        "type": "Running",
        "mileage": 99.6
    },
    {
        "shoe": "Nike Fly 6",
        "brand": "Nike",
        "status": "In Rotation",
        "type": "Running",
        "mileage": 44.9
    },
    {
        "shoe": "Anta C202 Zone 2",
        "brand": "Anta",
        "status": "In Rotation",
        "type": "Running",
        "mileage": 63
    },
    {
        "shoe": "PUMA Nitro Elite 4",
        "brand": "PUMA",
        "status": "In Rotation",
        "type": "Running",
        "mileage": 18.5
    },
    {
        "shoe": "PUMA MagMax Nitro 2",
        "brand": "PUMA",
        "status": "In Rotation",
        "type": "Running",
        "mileage": 30.2
    },
    {
        "shoe": "Kiprun TR2",
        "brand": "Kiprun",
        "status": "In Rotation",
        "type": "Trail",
        "mileage": 16.5
    },
    {
        "shoe": "ASICS Gel Nimbus 27 TR",
        "brand": "ASICS",
        "status": "To Sell",
        "type": "Trail",
        "mileage": 200.5
    },
    {
        "shoe": "Adidas Equipment Adios Pro",
        "brand": "Adidas",
        "status": "To Sell",
        "type": "Running",
        "mileage": 17.4
    },
    {
        "shoe": "Adidas Adizero Adios 9",
        "brand": "Adidas",
        "status": "To Sell",
        "type": "Running",
        "mileage": 4.3
    },
    {
        "shoe": "Nike Pegasus Trail 4",
        "brand": "Nike",
        "status": "Retired",
        "type": "Trail",
        "mileage": 466.3
    },
    {
        "shoe": "Asics Novablast 4",
        "brand": "ASICS",
        "status": "Retired",
        "type": "Running",
        "mileage": 385.8
    },
    {
        "shoe": "Kiprun KD900X LD",
        "brand": "Kiprun",
        "status": "Retired",
        "type": "Running",
        "mileage": 115.1
    },
    {
        "shoe": "Nike ZoomX Streakfly",
        "brand": "Nike",
        "status": "Retired",
        "type": "Running",
        "mileage": 95.3
    },
    {
        "shoe": "Salomon Aero Glide 3",
        "brand": "Salomon",
        "status": "Retired",
        "type": "Running",
        "mileage": 87.6
    },
    {
        "shoe": "Adidas Adizero Boston 13",
        "brand": "Adidas",
        "status": "Retired",
        "type": "Running",
        "mileage": 68.2
    },
    {
        "shoe": "Adidas Takumi Sen 10",
        "brand": "Adidas",
        "status": "Retired",
        "type": "Running",
        "mileage": 56.8
    },
    {
        "shoe": "Adidas Adizero Boston 12",
        "brand": "Adidas",
        "status": "Retired",
        "type": "Running",
        "mileage": 53.3
    }
];

    let gearDashboardInitialized = false;
    let gearAccessUnlocked = false;
    let gearCurrentData = [];
    const gearSortState = { key: null, direction: 'asc' };
    const gearFinanceSortState = { key: null, direction: 'asc' };
    let gearScope = 'overall';
    const gearChartRef = { mileageChart: null, ppkChart: null, brandChart: null };
    let gearSyncUnlocked = false;

    function initializeGearDashboard() {
        if (!gearDashboardInitialized) {
            gearCurrentData = gearLoadMileage().map(gearWithDerivedCosts);
            gearSetupSorting();
            gearSetupFinanceSorting();
            gearSetupScopeToggle();
            gearSetupSectionToggles();
            gearSetupLockModalTriggers();
            gearSetupQuickSecurityControl();
            gearSetupSyncFab();
            gearSetupBackendSync();
            gearDashboardInitialized = true;
        }
        gearUpdateAccessState();
        gearRenderTable(gearCurrentData);
        gearRenderFinanceTable(gearCurrentData);
        gearRenderMetrics(gearScopedData(gearCurrentData));
        gearDestroyCharts();
        gearRenderCharts(gearCurrentData);
    }

    function gearSetupAccessGate() {
        const modal = document.getElementById('gear-lock-modal');
        const input = document.getElementById('gear-lock-input');
        const message = document.getElementById('gear-lock-message');
        document.getElementById('gear-lock-form').addEventListener('submit', async function(event) {
            event.preventDefault();
            const file = input.files[0];
            if (!file) { message.textContent = 'Choose your private JSON file.'; return; }
            if (file.size > 1000000) { message.textContent = 'Please choose a file smaller than 1 MB.'; return; }
            try {
                const imported = gearValidateFinances(JSON.parse(await file.text()));
                gearCurrentData = gearCurrentData.map(row => gearWithDerivedCosts(Object.assign({}, gearPublicRow(row), imported.get(row.shoe))));
                gearAccessUnlocked = true;
                input.value = '';
                message.textContent = 'Imported locally. Values are cleared when this page closes or reloads.';
                modal.hidden = true;
                initializeGearDashboard();
            } catch (error) { message.textContent = 'Import failed: ' + error.message; }
        });
        document.getElementById('gear-relock-button').addEventListener('click', gearClearFinances);
        document.getElementById('gear-lock-close').addEventListener('click', () => { modal.hidden = true; });
        modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
    }

    function gearPublicRow(row) {
        const { shoe, brand, status, type, mileage } = row;
        return { shoe, brand, status, type, mileage };
    }

    function gearValidateFinances(rows) {
        if (!Array.isArray(rows)) throw new Error('Expected a list of shoes and costs.');
        const known = new Set(gearSampleData.map(row => row.shoe));
        const result = new Map();
        for (const row of rows) {
            if (!row || !known.has(row.shoe) || result.has(row.shoe)) throw new Error('Unknown or duplicate shoe.');
            const values = {};
            for (const key of ['price', 'buy_price', 'sell_price']) {
                if (row[key] !== undefined) {
                    if (typeof row[key] !== 'number' || !Number.isFinite(row[key]) || row[key] < 0) throw new Error('Costs must be non-negative numbers.');
                    values[key] = row[key];
                }
            }
            if (values.price === undefined && values.buy_price === undefined) throw new Error('Each shoe needs price or buy_price.');
            result.set(row.shoe, values);
        }
        if (result.size !== known.size) throw new Error('Include every shoe so totals remain accurate.');
        return result;
    }

    function gearClearFinances() {
        gearAccessUnlocked = false;
        gearCurrentData = gearCurrentData.map(row => gearWithDerivedCosts(gearPublicRow(row)));
        document.getElementById('gear-lock-input').value = '';
        document.getElementById('gear-lock-message').textContent = 'Private values cleared.';
        initializeGearDashboard();
    }

    function gearSetupLockModalTriggers() {
        const gearRoot = document.getElementById('gear');
        const modal = document.getElementById('gear-lock-modal');
        if (!gearRoot || !modal) return;
        gearRoot.addEventListener('click', function(event) {
            if (!event.target.closest('.gear-lock-trigger')) return;
            if (gearAccessUnlocked) return;
            modal.hidden = false;
            const input = document.getElementById('gear-lock-input');
            if (input && !input.hidden) input.focus();
        });
    }

    function gearSetupSyncFab() {
        const fab = document.getElementById('gear-sync-fab');
        const panel = document.getElementById('gear-sync-panel');
        fab.addEventListener('click', function() { gearSyncUnlocked = true; panel.hidden = !panel.hidden; });
    }

    function gearUpdateAccessState() {
        const input = document.getElementById('gear-lock-input');
        const relockButton = document.getElementById('gear-relock-button');
        const securityButton = document.getElementById('gear-security-button');
        if (!input || !relockButton) {
            return;
        }

        input.hidden = gearAccessUnlocked;
        input.disabled = gearAccessUnlocked;
        relockButton.hidden = !gearAccessUnlocked;
        if (securityButton) {
            securityButton.textContent = gearAccessUnlocked ? 'Clear private costs' : 'Import private costs';
            securityButton.setAttribute('aria-label', gearAccessUnlocked ? 'Clear private costs' : 'Import private costs');
        }
    }

    function gearSetupQuickSecurityControl() {
        const button = document.getElementById('gear-security-button');
        const modal = document.getElementById('gear-lock-modal');
        if (!button || !modal) return;
        button.addEventListener('click', function() {
            if (gearAccessUnlocked) {
                gearClearFinances();
                return;
            }
            modal.hidden = false;
            const input = document.getElementById('gear-lock-input');
            if (input && !input.hidden) input.focus();
        });
    }

    function gearScopedData(data) {
        if (gearScope === 'in_rotation') return data.filter(d => String(d.status || '').toLowerCase() === 'in rotation');
        if (gearScope === 'retired') return data.filter(d => String(d.status || '').toLowerCase() === 'retired');
        return data;
    }

    function gearRenderMetrics(data) {
        const pairs = data.length;
        const totalMileage = gearSum(data.map(d => d.mileage));
        const totalSpend = gearSum(data.map(d => d.price));
        const weightedPpk = totalMileage > 0 ? totalSpend / totalMileage : gearSum(data.map(d => d.price_per_km)) / Math.max(1, pairs);
        document.getElementById('gear-pairsCount').textContent = String(pairs);
        document.getElementById('gear-totalMileage').textContent = gearFmtNum(totalMileage) + ' km';
        document.getElementById('gear-totalSpend').innerHTML = gearAccessUnlocked ? (gearFmtCur(totalSpend) + ' EUR') : gearLockToken('Private');
        document.getElementById('gear-avgPpk').innerHTML = gearAccessUnlocked ? (gearFmtCur(weightedPpk) + ' EUR') : gearLockToken('Locked');
    }

    function gearRenderTable(data) {
        const scoped = gearScopedData(data);
        const body = document.getElementById('gear-gearRows');
        body.innerHTML = '';
        scoped.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = gearStatusRowClass(row.status);
            tr.innerHTML =
                '<td>' + gearEscape(row.shoe) + '</td>' +
                '<td>' + gearEscape(row.brand) + '</td>' +
                '<td>' + gearEscape(row.status || 'In Rotation') + '</td>' +
                '<td>' + gearEscape(row.type || 'Running') + '</td>' +
                '<td>' + gearMaskedCurrency(row.price) + '</td>' +
                '<td>' + gearFmtNum(row.mileage) + ' km</td>' +
                '<td>' + gearMaskedCurrency(row.price_per_km) + '</td>';
            body.appendChild(tr);
        });
    }

    function gearRenderFinanceTable(data) {
        const body = document.getElementById('gear-financeRows');
        body.innerHTML = '';
        gearApplyFinanceSort(data).forEach(row => {
            const hasBuy = typeof row.buy_price === 'number' && Number.isFinite(row.buy_price);
            const hasSell = typeof row.sell_price === 'number' && Number.isFinite(row.sell_price);
            const buyDisplay = hasBuy ? gearMaskedCurrency(row.buy_price) : gearMaskedCurrency(row.price);
            const soldDisplay = hasSell ? gearMaskedCurrency(row.sell_price) : null;
            const recovery = (hasBuy && hasSell && row.buy_price > 0) ? ((row.sell_price / row.buy_price) * 100).toFixed(1) + '%' : null;
            const tr = document.createElement('tr');
            tr.className = gearStatusRowClass(row.status);
            tr.innerHTML =
                '<td>' + gearEscape(row.shoe) + '</td>' +
                '<td>' + gearEscape(row.status || 'In Rotation') + '</td>' +
                '<td>' + buyDisplay + '</td>' +
                '<td class="' + (soldDisplay ? '' : 'g-cell-na') + '">' + (soldDisplay || '\u2014') + '</td>' +
                '<td>' + gearMaskedCurrency(row.price) + '</td>' +
                '<td class="g-cell-recovery ' + (recovery ? '' : 'g-cell-na') + '">' + (recovery ? gearMaskedPercent(recovery) : '\u2014') + '</td>' +
                '<td>' + gearMaskedCurrency(row.price_per_km) + '</td>';
            body.appendChild(tr);
        });
    }

    function gearApplyFinanceSort(data) {
        const key = gearFinanceSortState.key;
        if (!key) return data;
        const dir = gearFinanceSortState.direction === 'asc' ? 1 : -1;
        const rows = data.slice();
        const numeric = new Set(['buy_price', 'sell_price', 'price', 'recovery', 'price_per_km']);
        rows.sort(function(a, b) {
            const av = gearGetFinanceSortValue(a, key);
            const bv = gearGetFinanceSortValue(b, key);
            const aMissing = av === null || typeof av === 'undefined';
            const bMissing = bv === null || typeof bv === 'undefined';
            if (aMissing && bMissing) return 0;
            if (aMissing) return 1;
            if (bMissing) return -1;
            if (numeric.has(key)) return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
            return String(av || '').localeCompare(String(bv || '')) * dir;
        });
        return rows;
    }

    function gearGetFinanceSortValue(row, key) {
        if (key === 'shoe' || key === 'status') return row[key] || '';
        if (key === 'buy_price') {
            if (typeof row.buy_price === 'number' && Number.isFinite(row.buy_price)) return row.buy_price;
            return row.price;
        }
        if (key === 'sell_price') {
            if (typeof row.sell_price === 'number' && Number.isFinite(row.sell_price)) return row.sell_price;
            return null;
        }
        if (key === 'recovery') {
            if (typeof row.buy_price === 'number' && Number.isFinite(row.buy_price) && row.buy_price > 0 && typeof row.sell_price === 'number' && Number.isFinite(row.sell_price)) {
                return (row.sell_price / row.buy_price) * 100;
            }
            return null;
        }
        return row[key];
    }

    function gearWithDerivedCosts(row) {
        const hasBuy = typeof row.buy_price === 'number' && Number.isFinite(row.buy_price);
        const hasSell = typeof row.sell_price === 'number' && Number.isFinite(row.sell_price);
        let netCost = Number(row.price) || 0;
        if (hasBuy || hasSell) netCost = (row.buy_price || 0) - (row.sell_price || 0);
        const mileage = Number(row.mileage) || 0;
        const ppk = mileage > 0 ? netCost / mileage : (Number(row.price_per_km) || 0);
        return Object.assign({}, row, { price: gearRound2(netCost), price_per_km: gearRound2(ppk) });
    }

    function gearStatusRowClass(status) {
        const k = String(status || '').toLowerCase();
        if (k === 'in rotation') return 'gear-status-row-in-rotation';
        if (k === 'to sell') return 'gear-status-row-to-sell';
        if (k === 'sold') return 'gear-status-row-sold';
        if (k === 'retired') return 'gear-status-row-retired';
        return '';
    }

    function gearRenderCharts(data) {
        const available = typeof Chart !== 'undefined';
        document.getElementById('gear-chart-fallback').hidden = available;
        if (!available) return;
        const cd = gearScopedData(data);
        const labels = cd.map(d => d.shoe);
        gearChartRef.mileageChart = new Chart(document.getElementById('gear-mileageChart'), {
            type: 'bar',
            data: { labels: labels, datasets: [{ label: 'KM', data: cd.map(d => gearRound2(d.mileage)), backgroundColor: 'rgba(219,91,33,0.75)', borderColor: 'rgba(159,61,21,1)', borderWidth: 1, borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Kilometers' } } } }
        });
        if (gearAccessUnlocked) {
            gearChartRef.ppkChart = new Chart(document.getElementById('gear-ppkChart'), {
                type: 'bar',
                data: { labels: labels, datasets: [{ label: 'Net EUR / KM', data: cd.map(d => gearRound2(d.price_per_km)), backgroundColor: 'rgba(38,121,196,0.72)', borderColor: 'rgba(19,76,127,1)', borderWidth: 1, borderRadius: 6 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Net EUR per km' } } } }
            });
        } else {
            gearRenderLockedPpkChart();
        }
        const bd = gearAggregateByBrand(cd);
        gearChartRef.brandChart = new Chart(document.getElementById('gear-brandChart'), {
            type: 'doughnut',
            data: { labels: bd.labels, datasets: [{ data: bd.values, backgroundColor: ['#db5b21','#2679c4','#0f8a5f','#9f3d15','#e1a838','#5c4d7d'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    function gearDestroyCharts() {
        Object.keys(gearChartRef).forEach(function(k) { if (gearChartRef[k]) { gearChartRef[k].destroy(); gearChartRef[k] = null; } });
    }

    function gearAggregateByBrand(data) {
        const map = new Map();
        data.forEach(function(row) { const b = row.brand || 'Unknown'; map.set(b, (map.get(b) || 0) + 1); });
        const entries = Array.from(map.entries()).sort(function(a, b) { return b[1] - a[1]; });
        return { labels: entries.map(function(x) { return x[0]; }), values: entries.map(function(x) { return x[1]; }) };
    }

    function gearRenderLockedPpkChart() {
        const canvas = document.getElementById('gear-ppkChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.fillStyle = '#f7f7f7';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#666';
        ctx.font = '600 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\ud83d\udd12 Import private costs to view this chart', w / 2, h / 2);
        ctx.restore();
    }

    function gearSetupSorting() {
        document.querySelectorAll('.gear-sort-btn').forEach(function(btn) {
            if (btn.hasAttribute('data-gear-finance-sort')) return;
            btn.addEventListener('click', function() {
                const key = btn.getAttribute('data-gear-sort');
                if (!key) return;
                if (gearSortState.key === key) {
                    gearSortState.direction = gearSortState.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    gearSortState.key = key;
                    gearSortState.direction = 'asc';
                }
                gearSortData();
                gearRenderTable(gearCurrentData);
                gearRenderFinanceTable(gearCurrentData);
                gearUpdateSortIndicators();
            });
        });
    }

    function gearSetupFinanceSorting() {
        document.querySelectorAll('[data-gear-finance-sort]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const key = btn.getAttribute('data-gear-finance-sort');
                if (!key) return;
                if (gearFinanceSortState.key === key) {
                    gearFinanceSortState.direction = gearFinanceSortState.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    gearFinanceSortState.key = key;
                    gearFinanceSortState.direction = 'asc';
                }
                gearRenderFinanceTable(gearCurrentData);
                gearUpdateFinanceSortIndicators();
            });
        });
    }

    function gearSetupSectionToggles() {
        document.querySelectorAll('.gear-section-toggle').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const targetId = btn.getAttribute('data-gear-toggle');
                if (!targetId) return;
                const body = document.getElementById(targetId);
                if (!body) return;
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                body.hidden = expanded;
                const icon = btn.querySelector('.gear-section-toggle-caret');
                if (icon) icon.textContent = expanded ? '▸' : '▾';
            });
        });
    }

    function gearSetupBackendSync() {
        const syncBtn = document.getElementById('gear-sync-backend');
        const lockBtn = document.getElementById('gear-sync-lock');
        const input = document.getElementById('gear-sync-input');
        const message = document.getElementById('gear-sync-message');
        const panel = document.getElementById('gear-sync-panel');
        if (!syncBtn || !lockBtn || !message || !input || !panel) return;

        lockBtn.addEventListener('click', function() {
            gearSyncUnlocked = false;
            panel.hidden = true;
            message.textContent = 'Mileage update panel closed.';
        });

        syncBtn.addEventListener('click', function() {
            if (!gearSyncUnlocked) {
                message.textContent = 'Open the mileage update panel first.';
                return;
            }
            const entries = gearParseManualSyncInput(input.value);
            if (!entries.length) {
                message.textContent = 'No valid lines found. Include shoe name and mileage, e.g. "Nike Vomero Plus 99.6 km".';
                return;
            }

            const applied = gearApplyMileageSync(entries);
            if (!applied.length) {
                message.textContent = 'No matching shoe names found in your Gear table.';
                return;
            }

            gearCurrentData = gearCurrentData.map(gearWithDerivedCosts);
            initializeGearDashboard();
            const saved = gearSaveMileage();
            message.textContent = 'Updated ' + applied.length + ' shoes. ' + (saved ? 'Saved in this browser only.' : 'Browser storage unavailable; changes last until reload.');
        });
    }

    function gearParseManualSyncInput(text) {
        return String(text || '').split(/\r?\n/).map(function(line) {
            const clean = line.replace(/\s+/g, ' ').trim();
            if (!clean) return null;
            const match = clean.match(/^(.*?)[\s\t]+(\d+(?:[\.,]\d+)?)\s*(?:km)?\s*$/i);
            if (!match) return null;
            const name = String(match[1] || '').trim();
            const mileage = Number(String(match[2] || '').replace(',', '.'));
            if (!name || !Number.isFinite(mileage)) return null;
            return { name: name, mileage: mileage };
        }).filter(Boolean);
    }

    function gearApplyMileageSync(entries) {
        const updated = [];
        const usedRowIndexes = new Set();

        entries.forEach(function(item) {
            const idx = gearFindBestShoeMatchIndex(item.name, usedRowIndexes);
            if (idx < 0) return;
            gearCurrentData[idx].mileage = gearRound2(item.mileage);
            usedRowIndexes.add(idx);
            updated.push(gearCurrentData[idx].shoe);
        });

        return updated;
    }

    function gearFindBestShoeMatchIndex(sourceName, usedRowIndexes) {
        const sourceNorm = gearNormalizeName(sourceName);
        const sourceSimple = gearSimplifyName(sourceName);
        const sourceBrand = gearGetBrandToken(sourceNorm);

        let bestIndex = -1;
        let bestScore = 0;

        for (let i = 0; i < gearCurrentData.length; i += 1) {
            if (usedRowIndexes.has(i)) continue;

            const targetName = gearCurrentData[i].shoe;
            const targetNorm = gearNormalizeName(targetName);
            const targetSimple = gearSimplifyName(targetName);
            const targetBrand = gearGetBrandToken(targetNorm);

            if (sourceNorm === targetNorm || sourceSimple === targetSimple) {
                return i;
            }

            let score = gearNameSimilarity(sourceSimple, targetSimple);

            if (sourceBrand && targetBrand && sourceBrand !== targetBrand) {
                score = score * 0.6;
            }

            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }

        return bestScore >= 0.58 ? bestIndex : -1;
    }

    function gearNameSimilarity(a, b) {
        const ta = new Set(String(a || '').split(' ').filter(Boolean));
        const tb = new Set(String(b || '').split(' ').filter(Boolean));
        if (!ta.size || !tb.size) return 0;

        let intersection = 0;
        ta.forEach(function(token) { if (tb.has(token)) intersection += 1; });

        const denom = Math.max(ta.size, tb.size);
        return intersection / denom;
    }

    function gearSimplifyName(v) {
        const ignore = new Set(['zoom', 'nitro']);
        return gearNormalizeName(v).split(' ').filter(function(token) {
            return token && !ignore.has(token);
        }).join(' ');
    }

    function gearGetBrandToken(v) {
        return String(v || '').split(' ').filter(Boolean)[0] || '';
    }

    function gearNormalizeName(v) {
        return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }

    function gearSetupScopeToggle() {
        document.querySelectorAll('.gear-scope-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const scope = btn.getAttribute('data-gear-scope');
                if (!scope || scope === gearScope) return;
                gearScope = scope;
                gearUpdateScopeButtons();
                gearRenderTable(gearCurrentData);
                gearRenderMetrics(gearScopedData(gearCurrentData));
                gearDestroyCharts();
                gearRenderCharts(gearCurrentData);
            });
        });
    }

    function gearUpdateScopeButtons() {
        document.querySelectorAll('.gear-scope-btn').forEach(function(btn) {
            btn.classList.toggle('gear-scope-active', btn.getAttribute('data-gear-scope') === gearScope);
        });
    }

    function gearSortData() {
        const key = gearSortState.key;
        if (!key) return;
        const dir = gearSortState.direction === 'asc' ? 1 : -1;
        const numeric = new Set(['price', 'mileage', 'price_per_km']);
        gearCurrentData.sort(function(a, b) {
            const av = a[key], bv = b[key];
            if (numeric.has(key)) return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
            return String(av || '').localeCompare(String(bv || '')) * dir;
        });
    }

    function gearUpdateSortIndicators() {
        document.querySelectorAll('.gear-sort-indicator').forEach(function(n) { n.textContent = '-'; });
        if (!gearSortState.key) return;
        const icon = gearSortState.direction === 'asc' ? '\u25b2' : '\u25bc';
        const node = document.getElementById('gear-sort-' + gearSortState.key);
        if (node) node.textContent = icon;
    }

    function gearUpdateFinanceSortIndicators() {
        document.querySelectorAll('.gear-finance-sort-indicator').forEach(function(n) { n.textContent = '-'; });
        if (!gearFinanceSortState.key) return;
        const icon = gearFinanceSortState.direction === 'asc' ? '\u25b2' : '\u25bc';
        const node = document.getElementById('gear-finance-sort-' + gearFinanceSortState.key);
        if (node) node.textContent = icon;
    }

    function gearFmtCur(v) { return gearRound2(v).toFixed(2); }
    function gearFmtNum(v) { return gearRound2(v).toLocaleString(); }
    function gearRound2(v) { return Math.round((Number(v) || 0) * 100) / 100; }
    function gearSum(arr) { return arr.reduce(function(a, c) { return a + (Number(c) || 0); }, 0); }
    function gearLockToken(label) {
        return '<button type="button" class="gear-lock-trigger" aria-label="Import private costs"><span class="gear-lock-inline"><span class="gear-lock-icon" aria-hidden="true">&#128274;</span><span>' + gearEscape(label) + '</span></span></button>';
    }
    function gearMaskedCurrency(v) {
        if (!gearAccessUnlocked) return gearLockToken('Locked');
        return gearFmtCur(v) + ' EUR';
    }
    function gearMaskedPercent(v) {
        if (!gearAccessUnlocked) return gearLockToken('Locked');
        return gearEscape(v);
    }
    function gearEscape(v) {
        return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    gearSetupAccessGate();

function gearLoadMileage() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('gear-mileage-v1') || '{}') || {}; } catch (_) {}
    return gearSampleData.map(row => Object.assign({}, row, {
        mileage: typeof saved[row.shoe] === 'number' && Number.isFinite(saved[row.shoe]) && saved[row.shoe] >= 0 ? saved[row.shoe] : row.mileage
    }));
}
function gearSaveMileage() {
    const values = Object.fromEntries(gearCurrentData.map(row => [row.shoe, row.mileage]));
    try { localStorage.setItem('gear-mileage-v1', JSON.stringify(values)); return true; } catch (_) { return false; }
}
