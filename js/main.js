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
    main: "Lucban",
    lucena: "Lucena",
    gumaca: "Gumaca",
    alabat: "Alabat",
    catanauan: "Catanauan",
    polillo: "Polillo",
    infanta: "Infanta",
    tagkawayan: "Tagkawayan",
    tiaong: "Tiaong"
};

window.loadCampusLayer = function () {
    if (typeof google === "undefined" || typeof gMap === "undefined" || !gMap) return;
    if (window.campusLayer) return;

    window.campusLayer = new google.maps.Data();
    window.campusLayer.setMap(gMap);

    fetch('./data/geojson/SLSU_municipalities.geojson')
        .then(res => {
            if (!res.ok) {
                throw new Error('SLSU_municipalities.geojson not found');
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
        // Don't open About panel while building info panel is visible
        const buildingInfoPanel = document.getElementById('buildingInfoPanel');
        if (buildingInfoPanel && buildingInfoPanel.classList.contains('open') && panel.classList.contains('closed')) {
            return;
        }

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
// WATERWAY LAYER
// ===========================
window.waterwayLayer = null;
window.waterwayLoaded = false;

window.toggleWaterwayLayer = function (show) {
    // Wait until the Google Maps API and gMap are ready
    if (typeof google === "undefined" || typeof gMap === "undefined" || !gMap) {
        console.warn("Map not ready yet — retrying waterway toggle in 500ms");
        setTimeout(() => window.toggleWaterwayLayer(show), 500);
        return;
    }

    if (!show) {
        if (window.waterwayLayer) {
            window.waterwayLayer.setMap(null);
        }
        return;
    }

    // If already loaded, just re-attach to map
    if (window.waterwayLayer && window.waterwayLoaded) {
        window.waterwayLayer.setMap(gMap);
        return;
    }

    // First load: fetch the GeoJSON
    window.waterwayLayer = new google.maps.Data();

    fetch('./data/geojson/Waterway4326.geojson')
        .then(res => {
            if (!res.ok) throw new Error('Waterway4326.geojson not found');
            return res.json();
        })
        .then(data => {
            window.waterwayLayer.addGeoJson(data);

            window.waterwayLayer.setStyle({
                strokeColor: '#1a6fa8',
                strokeWeight: 2,
                strokeOpacity: 0.85,
                fillColor: '#4da6e8',
                fillOpacity: 0.35
            });

            window.waterwayLayer.setMap(gMap);
            window.waterwayLoaded = true;
        })
        .catch(err => {
            console.error('Waterway layer error:', err);
            alert('Waterway GeoJSON file not found. Make sure "Waterway4326.geojson" is placed at: ./data/geojson/Waterway4326.geojson');
        });
};

// ===========================
// FLOOD LAYERS (5yr, 25yr, 100yr)
// ===========================

// All available color themes (High / Medium / Low per depth level)
const FLOOD_THEMES = {
    red:    { 3:{fill:'#b71c1c',stroke:'#7f0000'}, 2:{fill:'#ef5350',stroke:'#c62828'}, 1:{fill:'#ffcdd2',stroke:'#e57373'} },
    purple: { 3:{fill:'#7b1fa2',stroke:'#4a148c'}, 2:{fill:'#ab47bc',stroke:'#6a1b9a'}, 1:{fill:'#ce93d8',stroke:'#8e24aa'} },
    blue:   { 3:{fill:'#0d47a1',stroke:'#002171'}, 2:{fill:'#1e88e5',stroke:'#1565c0'}, 1:{fill:'#90caf9',stroke:'#1976d2'} },
    green:  { 3:{fill:'#2e7d32',stroke:'#1a3a1a'}, 2:{fill:'#43a047',stroke:'#1b5e20'}, 1:{fill:'#a5d6a7',stroke:'#388e3c'} },
    teal:   { 3:{fill:'#00695c',stroke:'#002b25'}, 2:{fill:'#00897b',stroke:'#004d40'}, 1:{fill:'#80cbc4',stroke:'#00897b'} },
    orange: { 3:{fill:'#e65100',stroke:'#9e3500'}, 2:{fill:'#ff9800',stroke:'#e65100'}, 1:{fill:'#ffe0b2',stroke:'#fb8c00'} },
    dark:   { 3:{fill:'#212121',stroke:'#000000'}, 2:{fill:'#757575',stroke:'#424242'}, 1:{fill:'#e0e0e0',stroke:'#9e9e9e'} }
};

// Default theme per period
const FLOOD_DEFAULT_THEME = { '5yr': 'red', '25yr': 'purple', '100yr': 'blue' };

// Active settings per period
window.floodSettings = {
    '5yr':   { theme: 'red',    opacity: 0.85 },
    '25yr':  { theme: 'purple', opacity: 0.85 },
    '100yr': { theme: 'blue',   opacity: 0.85 }
};

// Map period key → filename
const FLOOD_FILE_MAP = {
    '5yr':   '5yr',
    '25yr':  '25_yr',
    '100yr': '100_yr'
};

window.floodLayers  = { '5yr': null,  '25yr': null,  '100yr': null  };
window.floodLoaded  = { '5yr': false, '25yr': false, '100yr': false };
window.floodVisible = { '5yr': false, '25yr': false, '100yr': false };

// ── Apply style to a loaded layer ──
window.applyFloodStyle = function(period) {
    const layer = window.floodLayers[period];
    if (!layer) return;
    const { theme, opacity } = window.floodSettings[period];
    const palette = FLOOD_THEMES[theme];
    layer.setStyle(function(feature) {
        const varVal = Math.round(feature.getProperty('Var')) || 1;
        const s = palette[varVal] || palette[1];
        return {
            fillColor:     s.fill,
            fillOpacity:   opacity,
            strokeColor:   s.stroke,
            strokeWeight:  1.5,
            strokeOpacity: 0.9
        };
    });
    updateSwatches(period);
    window.updateFloodLegend();
};

// ── Update legend swatches in the sidebar panel ──
function updateSwatches(period) {
    const palette = FLOOD_THEMES[window.floodSettings[period].theme];
    [1, 2, 3].forEach(depth => {
        const el = document.getElementById('swatch-' + period + '-' + depth);
        if (el) {
            el.style.background = palette[depth].fill;
            el.style.borderColor = palette[depth].stroke;
        }
    });
}

// ── Map-overlay legend box ──
// Map overlay legend removed — legend is shown in the sidebar panel only.
window.updateFloodLegend = function() {
    const existing = document.getElementById('floodLegend');
    if (existing) existing.remove();
};

// ── Toggle a flood layer on/off ──
window.toggleFloodLayer = function(period, show) {
    if (typeof google === "undefined" || typeof gMap === "undefined" || !gMap) {
        setTimeout(() => window.toggleFloodLayer(period, show), 500);
        return;
    }
    if (!show) {
        if (window.floodLayers[period]) window.floodLayers[period].setMap(null);
        window.floodVisible[period] = false;
        window.updateFloodLegend();
        return;
    }
    if (window.floodLayers[period] && window.floodLoaded[period]) {
        window.floodLayers[period].setMap(gMap);
        window.floodVisible[period] = true;
        window.applyFloodStyle(period);
        return;
    }
    // First load
    window.floodLayers[period] = new google.maps.Data();
    const fileName = FLOOD_FILE_MAP[period];
    fetch('./data/geojson/flood/' + fileName + '.geojson')
        .then(res => { if (!res.ok) throw new Error(fileName + '.geojson not found'); return res.json(); })
        .then(data => {
            window.floodLayers[period].addGeoJson(data);
            window.floodLoaded[period]  = true;
            window.floodVisible[period] = true;
            window.floodLayers[period].setMap(gMap);
            window.applyFloodStyle(period);
        })
        .catch(err => {
            console.error('Flood layer (' + period + ') error:', err);
            alert('Flood GeoJSON not found.\nExpected: ./data/geojson/flood/' + fileName + '.geojson');
        });
};

// ===========================
// LANDSLIDE LAYER
// ===========================

const LANDSLIDE_THEMES = FLOOD_THEMES; // reuse same color ramps; LH 1=Low, 2=Medium, 3=High

window.landslideSettings = { theme: 'green', opacity: 0.85 };
window.landslideLayer    = null;
window.landslideLoaded   = false;
window.landslideVisible  = false;

function updateLandslideSwatches() {
    const palette = LANDSLIDE_THEMES[window.landslideSettings.theme];
    [1, 2, 3].forEach(lh => {
        const el = document.getElementById('swatch-landslide-' + lh);
        if (el) {
            el.style.background  = palette[lh].fill;
            el.style.borderColor = palette[lh].stroke;
        }
    });
}

window.applyLandslideStyle = function() {
    const layer = window.landslideLayer;
    if (!layer) return;
    const { theme, opacity } = window.landslideSettings;
    const palette = LANDSLIDE_THEMES[theme];
    layer.setStyle(function(feature) {
        const lh = Math.round(feature.getProperty('LH')) || 1;
        const s  = palette[lh] || palette[1];
        return {
            fillColor:     s.fill,
            fillOpacity:   opacity,
            strokeColor:   s.stroke,
            strokeWeight:  1.5,
            strokeOpacity: 0.9
        };
    });
    updateLandslideSwatches();
};

window.toggleLandslideLayer = function(show) {
    if (typeof google === 'undefined' || typeof gMap === 'undefined' || !gMap) {
        setTimeout(() => window.toggleLandslideLayer(show), 500);
        return;
    }
    if (!show) {
        if (window.landslideLayer) window.landslideLayer.setMap(null);
        window.landslideVisible = false;
        return;
    }
    if (window.landslideLayer && window.landslideLoaded) {
        window.landslideLayer.setMap(gMap);
        window.landslideVisible = true;
        window.applyLandslideStyle();
        return;
    }
    window.landslideLayer = new google.maps.Data();
    fetch('./data/geojson/Landslide.geojson')
        .then(res => { if (!res.ok) throw new Error('not found'); return res.json(); })
        .then(data => {
            window.landslideLayer.addGeoJson(data);
            window.landslideLoaded  = true;
            window.landslideVisible = true;
            window.landslideLayer.setMap(gMap);
            window.applyLandslideStyle();
        })
        .catch(err => {
            console.error('Landslide layer error:', err);
            alert('Landslide GeoJSON not found.\nExpected: ./data/geojson/Landslide.geojson');
        });
};

// ===========================
// DEBRIS FLOW & ALLUVIAL FAN LAYER
// ===========================

window.debrisFlowSettings = { theme: 'purple', opacity: 0.85 };
window.debrisFlowLayer    = null;
window.debrisFlowLoaded   = false;
window.debrisFlowVisible  = false;

function updateDebrisFlowSwatches() {
    const palette = FLOOD_THEMES[window.debrisFlowSettings.theme];
    [1, 2, 3].forEach(lh => {
        const el = document.getElementById('swatch-debrisflow-' + lh);
        if (el) {
            el.style.background  = palette[lh].fill;
            el.style.borderColor = palette[lh].stroke;
        }
    });
}

window.applyDebrisFlowStyle = function() {
    const layer = window.debrisFlowLayer;
    if (!layer) return;
    const { theme, opacity } = window.debrisFlowSettings;
    const palette = FLOOD_THEMES[theme];
    layer.setStyle(function(feature) {
        const type = feature.getProperty('type');
        const lh   = Math.round(feature.getProperty('LH')) || 1;
        const clampedLH = lh > 3 ? 2 : (lh < 1 ? 1 : lh);
        const s = palette[clampedLH];

        // Alluvial Fan = outline only, no fill
        if (type === 'AlluvialFan') {
            return {
                fillColor:     s.fill,
                fillOpacity:   0,
                strokeColor:   s.stroke,
                strokeWeight:  2,
                strokeOpacity: opacity
            };
        }

        // Debris Flow = filled polygon
        return {
            fillColor:     s.fill,
            fillOpacity:   opacity,
            strokeColor:   s.stroke,
            strokeWeight:  1.5,
            strokeOpacity: 0.9
        };
    });
    updateDebrisFlowSwatches();
};

window.toggleDebrisFlowLayer = function(show) {
    if (typeof google === 'undefined' || typeof gMap === 'undefined' || !gMap) {
        setTimeout(() => window.toggleDebrisFlowLayer(show), 500);
        return;
    }
    if (!show) {
        if (window.debrisFlowLayer) window.debrisFlowLayer.setMap(null);
        window.debrisFlowVisible = false;
        return;
    }
    if (window.debrisFlowLayer && window.debrisFlowLoaded) {
        window.debrisFlowLayer.setMap(gMap);
        window.debrisFlowVisible = true;
        window.applyDebrisFlowStyle();
        return;
    }
    window.debrisFlowLayer = new google.maps.Data();
    fetch('./data/geojson/DebrisFlow_AlluvialFan.geojson')
        .then(res => { if (!res.ok) throw new Error('not found'); return res.json(); })
        .then(data => {
            window.debrisFlowLayer.addGeoJson(data);
            window.debrisFlowLoaded  = true;
            window.debrisFlowVisible = true;
            window.debrisFlowLayer.setMap(gMap);
            window.applyDebrisFlowStyle();
        })
        .catch(err => {
            console.error('Debris Flow layer error:', err);
            alert('Debris Flow GeoJSON not found.\nExpected: ./data/geojson/DebrisFlow_AlluvialFan.geojson');
        });
};

// ── Wire up opacity sliders + color buttons on DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', function() {

    // Initialize sidebar swatches to defaults
    ['5yr','25yr','100yr'].forEach(p => updateSwatches(p));
    updateLandslideSwatches();
    updateDebrisFlowSwatches();

    // Expand/collapse chevrons
    document.querySelectorAll('.flood-expand-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const panel = document.getElementById(targetId);
            if (!panel) return;
            panel.classList.toggle('open');
            this.classList.toggle('open');
        });
    });

    // Opacity sliders
    document.querySelectorAll('.flood-opacity-slider').forEach(slider => {
        slider.addEventListener('input', function() {
            const period = this.getAttribute('data-period');
            const val = parseInt(this.value);
            // Update display value
            const display = document.getElementById('opval-' + period);
            if (display) display.textContent = val;
            // Update slider fill
            this.style.background = `linear-gradient(to right, #4caf50 0%, #4caf50 ${val}%, #d0d0d0 ${val}%)`;
            // Save & re-apply
            window.floodSettings[period].opacity = val / 100;
            if (window.floodLoaded[period]) window.applyFloodStyle(period);
        });
    });

    // Color theme buttons — flood
    document.querySelectorAll('.flood-color-palette').forEach(palette => {
        palette.querySelectorAll('.flood-color-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const period  = palette.getAttribute('data-period');
                const theme   = this.getAttribute('data-theme');
                palette.querySelectorAll('.flood-color-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                window.floodSettings[period].theme = theme;
                updateSwatches(period);
                if (window.floodLoaded[period]) window.applyFloodStyle(period);
            });
        });
    });

    // ── Landslide: opacity slider ──
    const landslideSlider = document.getElementById('opacity-landslide');
    if (landslideSlider) {
        landslideSlider.addEventListener('input', function() {
            const val = parseInt(this.value);
            const display = document.getElementById('opval-landslide');
            if (display) display.textContent = val;
            this.style.background = `linear-gradient(to right, #4caf50 0%, #4caf50 ${val}%, #d0d0d0 ${val}%)`;
            window.landslideSettings.opacity = val / 100;
            if (window.landslideLoaded) window.applyLandslideStyle();
        });
    }

    // ── Landslide: color theme buttons ──
    const landslidePalette = document.querySelector('.landslide-color-palette');
    if (landslidePalette) {
        landslidePalette.querySelectorAll('.flood-color-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const theme = this.getAttribute('data-theme');
                landslidePalette.querySelectorAll('.flood-color-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                window.landslideSettings.theme = theme;
                updateLandslideSwatches();
                if (window.landslideLoaded) window.applyLandslideStyle();
            });
        });
    }

    // ── Debris Flow: opacity slider ──
    const debrisFlowSlider = document.getElementById('opacity-debrisflow');
    if (debrisFlowSlider) {
        debrisFlowSlider.addEventListener('input', function() {
            const val = parseInt(this.value);
            const display = document.getElementById('opval-debrisflow');
            if (display) display.textContent = val;
            this.style.background = `linear-gradient(to right, #4caf50 0%, #4caf50 ${val}%, #d0d0d0 ${val}%)`;
            window.debrisFlowSettings.opacity = val / 100;
            if (window.debrisFlowLoaded) window.applyDebrisFlowStyle();
        });
    }

    // ── Debris Flow: color theme buttons ──
    const debrisFlowPalette = document.querySelector('.debrisflow-color-palette');
    if (debrisFlowPalette) {
        debrisFlowPalette.querySelectorAll('.flood-color-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const theme = this.getAttribute('data-theme');
                debrisFlowPalette.querySelectorAll('.flood-color-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                window.debrisFlowSettings.theme = theme;
                updateDebrisFlowSwatches();
                if (window.debrisFlowLoaded) window.applyDebrisFlowStyle();
            });
        });
    }

    // Init alluvial fan swatches
    updateAlluvialFanSwatches();
});

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

            // Waterway / Drainage toggle
            if (layer === 'infra-drainage') {
                window.toggleWaterwayLayer(isChecked);
            }

            // Flood-Prone Areas — 3 return periods
            if (layer === 'haz-flood-5yr')   window.toggleFloodLayer('5yr',   isChecked);
            if (layer === 'haz-flood-25yr')  window.toggleFloodLayer('25yr',  isChecked);
            if (layer === 'haz-flood-100yr') window.toggleFloodLayer('100yr', isChecked);

            // Landslide Hazard
            if (layer === 'haz-landslide') window.toggleLandslideLayer(isChecked);

            // Debris Flow
            if (layer === 'haz-debrisflow') window.toggleDebrisFlowLayer(isChecked);

            // Hazard Heatmaps toggle
            if (layer === 'haz-heatmaps') {
                if (isChecked) {
                    if (typeof window.showHeatmaps === 'function') window.showHeatmaps();
                } else {
                    if (typeof window.hideHeatmaps === 'function') window.hideHeatmaps();
                }
            }
        });
    });
});