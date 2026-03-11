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
    // Handled by Google Maps JS API in index.html
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
        userDropdown.classList.toggle('panel-closed');
        toolDropdown.classList.toggle('panel-closed');

        if (panel.classList.contains('closed')) {
            btn.style.right = '-5px';
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

// --- Waterway Layer (Google Maps Data Layer) ---
let waterwayDataLayer = null;
let waterwayLoaded = false;

function loadWaterwayLayer() {
    if (waterwayLoaded) return; // Only fetch once
    waterwayLoaded = true;

    fetch('./js/Waterline.geojson')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load Waterline.geojson');
            return response.json();
        })
        .then(geojsonData => {
            waterwayDataLayer = new google.maps.Data({ map: gMap });

            waterwayDataLayer.addGeoJson(geojsonData);

            // Style the waterway lines
            waterwayDataLayer.setStyle({
                strokeColor: '#1a6faf',
                strokeWeight: 1.8,
                strokeOpacity: 0.85
            });

            // Popup on click
            waterwayDataLayer.addListener('click', function (event) {
                const name = event.feature.getProperty('name');
                const type = event.feature.getProperty('waterway');

                const infoWindow = new google.maps.InfoWindow({
                    content: `<div style="font-family:sans-serif; padding:4px;">
                                <b>${name || 'Unnamed Waterway'}</b><br/>
                                <span style="color:#555;">Type: ${type || 'N/A'}</span>
                              </div>`,
                    position: event.latLng
                });
                infoWindow.open(gMap);
            });

            console.log('Waterway layer loaded successfully.');
        })
        .catch(err => {
            console.error('Waterway layer error:', err);
            waterwayLoaded = false; // Allow retry on error
        });
}

function toggleWaterwayLayer(isVisible) {
    if (isVisible) {
        if (!waterwayLoaded) {
            loadWaterwayLayer(); // First time: fetch and display
        } else if (waterwayDataLayer) {
            waterwayDataLayer.setMap(gMap); // Re-show
        }
    } else {
        if (waterwayDataLayer) {
            waterwayDataLayer.setMap(null); // Hide without deleting
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const layerCheckboxes = document.querySelectorAll('.layer-checkbox');

    layerCheckboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            const layer = this.getAttribute('data-layer');
            const isChecked = this.checked;

            console.log('Layer "' + layer + '" is now ' + (isChecked ? 'ON' : 'OFF'));

            // Route each layer to its toggle function
            if (layer === 'infra-drainage') {
    toggleWaterwayLayer(isChecked);
}   
            // Add more layers here as needed:
            // if (layer === 'roads') toggleRoadsLayer(isChecked);
        });
    });
});