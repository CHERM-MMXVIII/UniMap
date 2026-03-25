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

// ===========================
// CAMPUS POLYGON HELPERS
// ===========================
window.campusLayer = null;

window.CAMPUS_NAME_FIELD = "campus_nam";

window.CAMPUS_KEY_TO_NAME = {
    main: "SLSU Lucban",
    lucena: "SLSU Lucena",
    gumaca: "SLSU Gumaca",
    alabat: "SLSU Alabat",
    catanauan: "SLSU Catanauan",
    polillo: "SLSU Polillo",
    infanta: "SLSU Infanta",
    tagkawayan: "SLSU Tagkawayan",
    tiaong: "SLSU Tiaong"
};

window.loadCampusLayer = function () {
    if (typeof google === "undefined" || typeof gMap === "undefined" || !gMap) return;
    if (window.campusLayer) return;

    window.campusLayer = new google.maps.Data();
    window.campusLayer.setMap(gMap);

    fetch('./data/geojson/slsu_campus.geojson')
        .then(res => {
            if (!res.ok) {
                throw new Error('slsu_campus.geojson not found');
            }
            return res.json();
        })
        .then(data => {
            window.campusLayer.addGeoJson(data);

            window.campusLayer.setStyle({
                fillColor: '#6b8e23',
                fillOpacity: 0.20,
                strokeColor: '#2f4f2f',
                strokeWeight: 2
            });
        })
        .catch(err => console.error('Campus layer loading error:', err));
};

window.zoomToCampusPolygon = function (campusKey) {
    if (!window.campusLayer || typeof google === "undefined" || typeof gMap === "undefined" || !gMap) return;

    const targetName = window.CAMPUS_KEY_TO_NAME[campusKey];
    if (!targetName) return;

    const bounds = new google.maps.LatLngBounds();
    let found = false;

    window.campusLayer.forEach(feature => {
        if (feature.getProperty(window.CAMPUS_NAME_FIELD) === targetName) {
            found = true;

            feature.getGeometry().forEachLatLng(latlng => {
                bounds.extend(latlng);
            });
        }
    });

    if (found) {
        gMap.fitBounds(bounds);

        window.campusLayer.setStyle(feature => {
            const isSelected = feature.getProperty(window.CAMPUS_NAME_FIELD) === targetName;

            return {
                fillColor: isSelected ? '#2e8b57' : '#6b8e23',
                fillOpacity: isSelected ? 0.40 : 0.20,
                strokeColor: isSelected ? '#145a32' : '#2f4f2f',
                strokeWeight: isSelected ? 3 : 2
            };
        });
    }
};

// handled by Google Maps JS API in index.html
function goToCampus(campus) {
    if (typeof window.goToCampus === "function") {
        window.goToCampus(campus);
    }
}

const toggleButton = document.getElementById('conditionsToggle');
const content = document.getElementById('conditionsContent');
const arrowIcon = document.getElementById('arrowIcon');

if (toggleButton && content && arrowIcon) {
    toggleButton.addEventListener('click', () => {
        content.classList.toggle('show');
        arrowIcon.classList.toggle('rotate');
    });
}

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
            menuToggleBtn.textContent = 'Close Menu';
        } else {
            menuToggleBtn.style.left = '0px';
            menuToggleBtn.textContent = 'Open Menu';
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
        if (userDropdown) userDropdown.classList.toggle('panel-closed');
        if (toolDropdown) toolDropdown.classList.toggle('panel-closed');

        if (panel.classList.contains('closed')) {
            btn.style.right = '10px';
            btn.textContent = 'Open Panel';
            
            mapContainer.style.width = '100%';
            mapContainer.style.right = '0';
        } else {
            const panelWidth = panel.offsetWidth;
            btn.style.right = panelWidth + 'px';
            btn.textContent = 'Close Panel';
            
            mapContainer.style.width = `calc(100% - ${panelWidth}px)`;
            mapContainer.style.right = panelWidth + 'px';
        }
        
        setTimeout(() => {
            if (typeof google !== 'undefined' && typeof gMap !== 'undefined') {
                google.maps.event.trigger(gMap, 'resize');
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

            console.log('Layer "' + layer + '" is now ' + (isChecked ? 'ON' : 'OFF'));
        });
    });
});