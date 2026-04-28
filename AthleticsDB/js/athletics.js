// Function to switch between tabs
function openTab(tabId, element) {
    // Hide all tab content
    var tabContents = document.getElementsByClassName('tab-content');
    for (var i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }

    // Deactivate all tab buttons
    var tabButtons = document.getElementsByClassName('tab-button');
    for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    // Show the selected tab content and activate its button
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');

    if (tabId === 'progression') {
        initializeProgressionCharts();
    }
}

// Function to filter results by year
function filterResults() {
    var selectedYear = document.getElementById('year-select').value;
    var tableRows = document.querySelectorAll('#results .data-table tbody tr');

    tableRows.forEach(row => {
        if (selectedYear === 'all' || row.getAttribute('data-year') === selectedYear) {
            row.style.display = ''; // Show the row
        } else {
            row.style.display = 'none'; // Hide the row
        }
    });
}

let progressionChartsInitialized = false;
let progression10kChart = null;
let progressionHalfChart = null;

function parseDateFromResults(value) {
    const parsed = new Date(value + ' UTC');
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTimeToSeconds(value) {
    const clean = (value || '').trim();
    if (!clean || clean === '--') {
        return null;
    }

    // Supports: hh:mm:ss(.ms), mm:ss(.ms), ss(.ms)
    const parts = clean.split(':');
    if (parts.length === 3) {
        const h = Number(parts[0]);
        const m = Number(parts[1]);
        const s = Number(parts[2]);
        if ([h, m, s].some(Number.isNaN)) {
            return null;
        }
        return h * 3600 + m * 60 + s;
    }

    if (parts.length === 2) {
        const m = Number(parts[0]);
        const s = Number(parts[1]);
        if ([m, s].some(Number.isNaN)) {
            return null;
        }
        return m * 60 + s;
    }

    const onlySeconds = Number(clean);
    return Number.isNaN(onlySeconds) ? null : onlySeconds;
}

function formatSecondsForLabel(totalSeconds) {
    if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds)) {
        return '--';
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds - hours * 3600 - minutes * 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0').replace(/\.000$/, '')}`;
    }

    return `${minutes}:${seconds.toFixed(3).padStart(6, '0').replace(/\.000$/, '')}`;
}

function formatDurationReadable(totalSeconds) {
    if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds)) {
        return '--';
    }

    const rounded = Math.round(totalSeconds);
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.floor((rounded % 3600) / 60);
    const seconds = rounded % 60;

    if (hours > 0) {
        return `${hours}h${minutes}m${seconds}s`;
    }

    return `${minutes}m${seconds}s`;
}

function readProgressionSeriesFromResults(disciplineMatcher) {
    const rows = document.querySelectorAll('#results .data-table tbody tr');
    const series = [];

    rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) {
            return;
        }

        const dateText = cells[0].textContent.trim();
        const disciplineText = cells[1].textContent.trim();
        const performanceText = cells[2].textContent.trim();
        const competitionText = cells[3].textContent.trim();

        if (!disciplineMatcher(disciplineText)) {
            return;
        }

        const date = parseDateFromResults(dateText);
        const seconds = parseTimeToSeconds(performanceText);
        if (!date || seconds === null) {
            return;
        }

        series.push({
            date,
            dateText,
            seconds,
            competitionText
        });
    });

    return series.sort((a, b) => a.date - b.date);
}

function setTrendStats(series, statsPrefix) {
    const bestEl = document.getElementById(`${statsPrefix}-stat-best`);
    const avgEl = document.getElementById(`${statsPrefix}-stat-avg`);
    const deltaEl = document.getElementById(`${statsPrefix}-stat-delta`);
    if (!bestEl || !avgEl || !deltaEl) {
        return;
    }

    if (series.length === 0) {
        bestEl.textContent = '--';
        avgEl.textContent = '--';
        deltaEl.textContent = '--';
        return;
    }

    const bestSeconds = Math.min(...series.map((item) => item.seconds));
    bestEl.textContent = formatDurationReadable(bestSeconds);

    const lastThree = series.slice(-3);
    const avgLastThree = lastThree.reduce((sum, item) => sum + item.seconds, 0) / lastThree.length;
    avgEl.textContent = formatDurationReadable(avgLastThree);

    if (series.length < 2) {
        deltaEl.textContent = '--';
        return;
    }

    const first = series[0].seconds;
    const latest = series[series.length - 1].seconds;
    const delta = first - latest;
    const deltaAbs = Math.abs(delta);

    if (deltaAbs < 0.05) {
        deltaEl.textContent = 'No change';
    } else if (delta > 0) {
        deltaEl.textContent = `${formatDurationReadable(deltaAbs)} faster`;
    } else {
        deltaEl.textContent = `${formatDurationReadable(deltaAbs)} slower`;
    }
}

function setChartFallbackVisibility(visible) {
    const fallback = document.getElementById('progression-chart-fallback');
    if (!fallback) {
        return;
    }
    fallback.hidden = !visible;
}

function setChartOrEmptyState(series, canvasId, emptyId, chartRefName, chartTitle, statsPrefix, chartAvailable) {
    const canvas = document.getElementById(canvasId);
    const emptyState = document.getElementById(emptyId);
    if (!canvas || !emptyState) {
        return;
    }

    setTrendStats(series, statsPrefix);

    if (!chartAvailable) {
        canvas.style.display = 'none';
        emptyState.hidden = true;
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    if (series.length < 2 || typeof Chart === 'undefined') {
        canvas.style.display = 'none';
        emptyState.hidden = false;
        return;
    }

    canvas.style.display = '';
    emptyState.hidden = true;

    const labels = series.map((item) => item.dateText);
    const values = series.map((item) => item.seconds);

    if (chartRefName === '10k' && progression10kChart) {
        progression10kChart.destroy();
    }
    if (chartRefName === 'half' && progressionHalfChart) {
        progressionHalfChart.destroy();
    }

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: chartTitle,
                data: values,
                borderColor: '#111111',
                backgroundColor: 'rgba(17, 17, 17, 0.12)',
                pointBackgroundColor: '#111111',
                pointBorderColor: '#111111',
                pointRadius: 4,
                pointHoverRadius: 5,
                tension: 0.25,
                fill: 'start'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return formatSecondsForLabel(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    grid: {
                        color: '#ececec'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 40,
                        minRotation: 0
                    },
                    grid: {
                        color: '#f3f3f3'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const seconds = context.parsed.y;
                            const item = series[context.dataIndex];
                            return `${formatSecondsForLabel(seconds)} - ${item.competitionText}`;
                        }
                    }
                }
            }
        }
    });

    if (chartRefName === '10k') {
        progression10kChart = chart;
    }
    if (chartRefName === 'half') {
        progressionHalfChart = chart;
    }
}

function initializeProgressionCharts() {
    if (progressionChartsInitialized) {
        return;
    }
    progressionChartsInitialized = true;

    const chartAvailable = typeof Chart !== 'undefined';
    setChartFallbackVisibility(!chartAvailable);

    const tenKSeries = readProgressionSeriesFromResults(function(discipline) {
        return discipline === '10K (Road)';
    });

    const halfSeries = readProgressionSeriesFromResults(function(discipline) {
        return discipline === 'Half Marathon';
    });

    setChartOrEmptyState(tenKSeries, 'progression-10k-chart', 'progression-10k-empty', '10k', '10K (Road)', 'progression-10k', chartAvailable);
    setChartOrEmptyState(halfSeries, 'progression-half-chart', 'progression-half-empty', 'half', 'Half Marathon', 'progression-half', chartAvailable);
}

// Set the initial active tab on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if a tab is specified in the URL or default to the first one
    const initialTabButton = document.querySelector('.tab-navigation .tab-button.active');
    const initialTabContent = document.getElementById(initialTabButton.getAttribute('onclick').match(/'([^']*)'/)[1]);

    if (initialTabButton && initialTabContent) {
        openTab(initialTabContent.id, initialTabButton);
    }

    // Pre-compute progression once after DOM is ready.
    initializeProgressionCharts();
});