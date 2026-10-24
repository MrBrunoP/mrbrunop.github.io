(() => {
    const filters = document.querySelector('.publication-filters');
    if (!filters) return;
    const buttons = Array.from(filters.querySelectorAll('button'));
    const items = Array.from(document.querySelectorAll('.publication'));
    const years = Array.from(document.querySelectorAll('.publication-year'));
    const status = document.querySelector('.publication-count');
    filters.hidden = false;
    function select(type) {
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.type === type)));
        let count = 0;
        items.forEach(item => {
            item.hidden = type !== 'all' && item.dataset.type !== type;
            if (!item.hidden) count++;
        });
        years.forEach(year => {
            year.hidden = !Array.from(year.querySelectorAll('.publication')).some(item => !item.hidden);
            document.querySelector(`.publication-years a[href="#${year.id}"]`).hidden = year.hidden;
        });
        status.textContent = `${count} ${type === 'all' ? 'research outputs' : buttons.find(button => button.dataset.type === type).textContent.toLowerCase()}`;
    }
    buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.type)));
    select('all');
})();
