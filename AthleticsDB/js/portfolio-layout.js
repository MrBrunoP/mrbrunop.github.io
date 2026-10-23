(() => {
    const sidebar = document.querySelector('.athlete-sidebar');
    const toggle = sidebar?.querySelector('.athlete-menu-toggle');
    if (toggle) {
        toggle.hidden = false;
        sidebar.classList.add('menu-ready');
        const closeMenu = () => {
            sidebar.classList.remove('menu-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.textContent = 'Menu ☰';
        };
        toggle.addEventListener('click', () => {
            const open = sidebar.classList.toggle('menu-open');
            toggle.setAttribute('aria-expanded', String(open));
            toggle.textContent = open ? 'Close ×' : 'Menu ☰';
        });
        sidebar.addEventListener('keydown', event => {
            if (event.key === 'Escape' && sidebar.classList.contains('menu-open')) {
                closeMenu();
                toggle.focus();
            }
        });
        sidebar.querySelectorAll('nav a').forEach(link => link.addEventListener('click', closeMenu));
        window.matchMedia('(max-width: 768px)').addEventListener('change', closeMenu);
    }
    document.querySelectorAll('.section table').forEach(table => {
        const headers = Array.from(table.querySelectorAll('thead th'), th => th.textContent.trim());
        if (!headers.length) return;
        Array.from(table.tBodies).forEach(body => {
            const occupied = [];
            Array.from(body.rows).forEach((row, rowIndex) => {
                let column = 0;
                Array.from(row.cells).forEach(cell => {
                    while (occupied[column] > rowIndex) column++;
                    if (cell.colSpan === 1 && headers[column]) cell.dataset.label = headers[column];
                    for (let offset = 0; offset < cell.colSpan; offset++) {
                        occupied[column + offset] = cell.rowSpan === 0 ? body.rows.length : rowIndex + cell.rowSpan;
                    }
                    column += cell.colSpan;
                });
            });
        });
        const wrapper = document.createElement('div');
        wrapper.className = 'athletics-table-scroll';
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', table.closest('.section').querySelector('h2, summary')?.textContent.trim() || 'Results');
        table.before(wrapper);
        wrapper.append(table);
    });
})();
