// JavaScript for the dropdown menus and campus map
const userDropdown = document.getElementById('userDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');

let hoverTimeout;

userDropdown.addEventListener('mouseenter', () => {
    clearTimeout(hoverTimeout);
    dropdownMenu.classList.add('show');
});

userDropdown.addEventListener('mouseleave', () => {
    hoverTimeout = setTimeout(() => {
        dropdownMenu.classList.remove('show');
    }, 300);
});

const toolDropdown = document.getElementById('toolDropdown');
const toolMenu = document.getElementById('toolDropdownMenu');

let toolTimeout;

toolDropdown.addEventListener('mouseenter', () => {
    clearTimeout(toolTimeout);
    toolMenu.classList.add('show');
});

toolDropdown.addEventListener('mouseleave', () => {
    toolTimeout = setTimeout(() => {
        toolMenu.classList.remove('show');
    }, 300);
});


const campusMap = document.getElementById("campusMap");

const campusLocations = {
    main: "14.1120879,121.5614933",
    lucena: "13.9486066,121.6295241",
    gumaca: "13.9228116,122.1012285",
    alabat: "14.0991669,122.0129519",
    catanauan: "13.568023,122.3430143",
    polillo: "14.7216832,121.9383093",
    infanta: "14.7136875,121.6207669",
    tagkawayan: "13.9571693,122.5436085",
    tiaong: "13.9470652,121.3695996"
};

function goToCampus(campus) {
    const coords = campusLocations[campus];
    const url = `https://www.google.com/maps?q=${coords}&output=embed`;
    campusMap.src = url;
}

function logoutUser() {
    sessionStorage.clear(); 
    alert("You have been logged out.");
    window.location.href = "login-form.html";
}

const toggleButton = document.getElementById('conditionsToggle');
const content = document.getElementById('conditionsContent');
const arrowIcon = document.getElementById('arrowIcon');

toggleButton.addEventListener('click', () => {
    content.classList.toggle('show');
    arrowIcon.classList.toggle('rotate');
});

// Menu Toggle Button (replaces hamburger)
const menuToggleBtn = document.getElementById('menuToggleBtn');
const menuCheckbox = document.getElementById('menuToggle');
const slideMenu = document.querySelector('.slide');

if (menuToggleBtn && menuCheckbox && slideMenu) {
    menuToggleBtn.addEventListener('click', () => {
        menuCheckbox.checked = !menuCheckbox.checked;
        
        // Update button position and text based on menu state
        if (menuCheckbox.checked) {
            const slideWidth = slideMenu.offsetWidth;
            menuToggleBtn.style.left = slideWidth + 'px';
            menuToggleBtn.textContent = '✖ Close Menu';
        } else {
            menuToggleBtn.style.left = '0px';
            menuToggleBtn.textContent = '☰ Open Menu';
        }
    });
}

// Side Panel Toggle functionality with Icon Movement
const btn = document.getElementById('toggleSidePanelBtn');
const panel = document.querySelector('.side-panel');
const mapContainer = document.querySelector('.map-container');

if (btn && panel && mapContainer) {
    btn.addEventListener('click', () => {
        panel.classList.toggle('closed');

        // Also toggle the 'panel-closed' class on user and tool dropdowns
        userDropdown.classList.toggle('panel-closed');
        toolDropdown.classList.toggle('panel-closed');

        if (panel.classList.contains('closed')) {
            btn.style.right = '10px';
            btn.textContent = '☰ Open Panel';
            
            mapContainer.style.width = '100%';
            mapContainer.style.right = '0';
        } else {
            const panelWidth = panel.offsetWidth;
            btn.style.right = panelWidth + 'px';
            btn.textContent = '✖ Close Panel';
            
            mapContainer.style.width = `calc(100% - ${panelWidth}px)`;
            mapContainer.style.right = panelWidth + 'px';
        }
        
        setTimeout(() => {
            const iframe = campusMap;
            if (iframe) {
                iframe.style.display = 'none';
                iframe.offsetHeight;
                iframe.style.display = 'block';
            }
        }, 300);
    });
}
// ===========================
// CHECKLIST LAYER TOGGLES
// ===========================
document.addEventListener('DOMContentLoaded', function () {
    const layerCheckboxes = document.querySelectorAll('.layer-checkbox');

    layerCheckboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            const layer = this.getAttribute('data-layer');
            const isChecked = this.checked;

            // Hook: toggle map layer visibility here when layers are connected
            // Example: toggleMapLayer(layer, isChecked);
            console.log('Layer "' + layer + '" is now ' + (isChecked ? 'ON' : 'OFF'));
        });
    });
});
