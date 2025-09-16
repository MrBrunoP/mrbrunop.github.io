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

// Set the initial active tab on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if a tab is specified in the URL or default to the first one
    const initialTabButton = document.querySelector('.tab-navigation .tab-button.active');
    const initialTabContent = document.getElementById(initialTabButton.getAttribute('onclick').match(/'([^']*)'/)[1]);

    if (initialTabButton && initialTabContent) {
        openTab(initialTabContent.id, initialTabButton);
    }
});