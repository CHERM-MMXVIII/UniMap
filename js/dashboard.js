function goToMainPage() {
    window.location.href = "../index.html";
}

function updateCloseButtonIcon() {
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.querySelector('.close-btn');
    if (!closeBtn || !sidebar) return;
    closeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    `;
}

/* ── Avatar rendering using canvas (matches acc-settings.html approach) ── */
function drawAvatarCanvas(canvas, src) {
    const ctx = canvas.getContext("2d");
    const s   = canvas.width;

    function drawFallback() {
        ctx.clearRect(0, 0, s, s);
        ctx.save();
        ctx.beginPath();
        ctx.arc(s/2, s/2, s/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "#085C76";
        ctx.fillRect(0, 0, s, s);
        ctx.fillStyle = "#ffffff";
        // Head
        ctx.beginPath();
        ctx.arc(s/2, s * 0.36, s * 0.20, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.beginPath();
        ctx.arc(s/2, s * 0.88, s * 0.30, Math.PI, 0);
        ctx.fill();
        ctx.restore();
    }

    if (!src) { drawFallback(); return; }

    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, s, s);
        ctx.save();
        ctx.beginPath();
        ctx.arc(s/2, s/2, s/2, 0, Math.PI * 2);
        ctx.clip();
        const scale = Math.max(s / img.width, s / img.height);
        const w = img.width  * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
        ctx.restore();
    };
    img.onerror = drawFallback;
    img.src = src;
}

function renderAvatar(src) {
    // Ensure the avatar elements exist as canvas; create them if they are plain divs
    function ensureCanvas(id, size) {
        let el = document.getElementById(id);
        if (!el) return null;
        // If it's not already a canvas, replace its contents with a canvas
        let canvas = el.querySelector("canvas");
        if (!canvas) {
            el.innerHTML = "";
            canvas = document.createElement("canvas");
            canvas.width  = size;
            canvas.height = size;
            canvas.style.cssText = `display:block;border-radius:50%;width:${size}px;height:${size}px;`;
            el.appendChild(canvas);
        }
        return canvas;
    }

    const headerCanvas   = ensureCanvas("headerAvatar", 60);
    const dropdownCanvas = ensureCanvas("dropdownAvatar", 40);

    if (headerCanvas)   drawAvatarCanvas(headerCanvas,   src);
    if (dropdownCanvas) drawAvatarCanvas(dropdownCanvas, src);
}

// Re-render avatar whenever localStorage is updated from another tab (e.g. Account Settings)
window.addEventListener("storage", function(e) {
    if (e.key === "profilePictureCache" || e.key === "profilePicture") {
        const src = localStorage.getItem("profilePictureCache") || localStorage.getItem("profilePicture");
        renderAvatar(src || null);
    }
});

async function populateUserName() {
    const fullname = localStorage.getItem("fullname");
    const username = localStorage.getItem("username");
    const displayName = fullname || "Guest";

    const headerUserName = document.getElementById("headerUserName");
    if (headerUserName) headerUserName.textContent = displayName;

    const welcomeUserName = document.getElementById("welcomeUserName");
    if (welcomeUserName) welcomeUserName.textContent = displayName;

    const userFullnameEl = document.getElementById("userFullname");
    if (userFullnameEl) userFullnameEl.textContent = displayName;

    // Show cached picture immediately while server responds
    const cached = localStorage.getItem("profilePictureCache") || localStorage.getItem("profilePicture");
    renderAvatar(cached || null);

    // Then fetch latest from server (same as account settings page)
    if (username) {
        try {
            const res  = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
            const data = await res.json();
            if (data.success && data.user.profile_picture) {
                const src = data.user.profile_picture + "?t=" + Date.now();
                localStorage.setItem("profilePicture", data.user.profile_picture);
                renderAvatar(src);
            } else if (!cached) {
                renderAvatar(null);
            }
        } catch (e) {
            // Server unreachable — keep cached picture already shown
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth > 768) {
        sidebar.classList.toggle('collapsed');
        updateCloseButtonIcon();
    }
}

function expandSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('collapsed') && window.innerWidth > 768) {
        sidebar.classList.remove('collapsed');
        updateCloseButtonIcon();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing responsive menu...');

    populateUserName();

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const desktopMenuBtn = document.getElementById('avatarBtn');
    const closeBtn = document.querySelector('.close-btn');
    const logoutBtn = document.querySelector('.action-link.logout');

    const sidebar = document.querySelector('.sidebar');
    const body = document.body;

    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    function toggleMobileSidebar() {
        if (sidebar) sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        body.classList.toggle('sidebar-open');
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileSidebar();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function() {
            if (window.innerWidth <= 768) toggleMobileSidebar();
        });
    }

    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                toggleMobileSidebar();
            }
        });
    });

    if (desktopMenuBtn) {
        desktopMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                toggleMobileSidebar();
            } else if (window.innerWidth > 768) {
                toggleSidebar();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }

    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768 && sidebar && sidebar.classList.contains('active')) {
                toggleMobileSidebar();
            }
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
            }
            updateCloseButtonIcon();
        }, 250);
    });

    updateCloseButtonIcon();
    initializeCharts();
});

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) selectedPage.classList.add('active');
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
}

function initializeCharts() {
    const yearlyPopulationCtx = document.getElementById('yearlyPopulationChart');
    if (yearlyPopulationCtx) {
        new Chart(yearlyPopulationCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
                datasets: [{
                    label: 'Student Population',
                    data: [10500, 11200, 12000, 12800, 13500, 14200],
                    backgroundColor: 'rgba(22, 163, 74, 0.2)',
                    borderColor: '#16a34a',
                    borderWidth: 3,
                    pointBackgroundColor: '#16a34a',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            callback: function(value) { return value.toLocaleString(); },
                            font: { size: window.innerWidth < 768 ? 10 : 12 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: window.innerWidth < 768 ? 10 : 12 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#16a34a',
                        titleFont: { size: 16, weight: 'bold' },
                        bodyColor: '#333',
                        bodyFont: { size: 14 },
                        padding: 12,
                        borderColor: '#16a34a',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) { return 'Year: ' + context[0].label; },
                            label: function(context) { return 'Population: ' + context.raw.toLocaleString() + ' students'; }
                        }
                    }
                }
            }
        });
    }

    const departmentCtx = document.getElementById('departmentChart');
    if (departmentCtx) {
        new Chart(departmentCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['CABHA', 'CIT', 'CEN', 'CAM', 'GAG', 'CAS', 'CTE'],
                datasets: [{
                    label: 'Number of Students',
                    data: [1000, 500, 1000, 300, 200, 1000, 1000],
                    backgroundColor: ['#16a34a', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
                    borderColor: ['#15803d', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777', '#0891b2'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { font: { size: window.innerWidth < 768 ? 10 : 12 } } },
                    x: { grid: { display: false }, ticks: { font: { size: window.innerWidth < 768 ? 9 : 12 } } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    const campusData = [
        { campus: 'Lucban', population: 5000 }, { campus: 'Lucena', population: 1000 },
        { campus: 'Gumaca', population: 2000 }, { campus: 'Alabat', population: 3000 },
        { campus: 'Catanauan', population: 3000 }, { campus: 'Polillo', population: 1000 },
        { campus: 'Infanta', population: 2000 }, { campus: 'Tagkawayan', population: 1000 },
        { campus: 'Tiaong', population: 2000 }
    ];
    campusData.sort((a, b) => b.population - a.population);
    const campusLabels = campusData.map(item => item.campus);
    const campusPopulations = campusData.map(item => item.population);
    const maxPopulation = Math.max(...campusPopulations);
    const campusBackgroundColors = campusPopulations.map(pop => pop === maxPopulation ? '#16a34a' : '#64748b');

    const campusCtx = document.getElementById('campusChart');
    if (campusCtx) {
        new Chart(campusCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: campusLabels,
                datasets: [{
                    label: 'Student Population',
                    data: campusPopulations,
                    backgroundColor: campusBackgroundColors,
                    borderColor: campusBackgroundColors.map(color => color === '#16a34a' ? '#15803d' : '#475569'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { font: { size: window.innerWidth < 768 ? 10 : 12 } } },
                    x: { grid: { display: false }, ticks: { font: { size: window.innerWidth < 768 ? 9 : 12 }, maxRotation: window.innerWidth < 768 ? 45 : 0, minRotation: window.innerWidth < 768 ? 45 : 0 } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: function(context) { return `Population: ${context.raw.toLocaleString()}`; } } }
                }
            }
        });
    }

    const buildingCtx = document.getElementById('buildingChart');
    if (buildingCtx) {
        new Chart(buildingCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Academic', 'Dormitories', 'Laboratories', 'Admin/Services'],
                datasets: [{ data: [35, 3, 10, 7], backgroundColor: ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6'], borderColor: '#ffffff', borderWidth: 2 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: window.innerWidth < 768 ? 'bottom' : 'right', labels: { boxWidth: 15, padding: window.innerWidth < 768 ? 10 : 15, font: { size: window.innerWidth < 768 ? 10 : 12 } } },
                    tooltip: { callbacks: { label: function(context) { const label = context.label || ''; const value = context.raw || 0; const total = context.dataset.data.reduce((a, b) => a + b, 0); const percentage = Math.round((value / total) * 100); return `${label}: ${value} (${percentage}%)`; } } }
                }
            }
        });
    }
}

function logoutUser() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
}

window.addEventListener('resize', function() {});

function openAccountSettings() {
    window.location.href = "/accountsettings";
}

document.addEventListener('DOMContentLoaded', function() {
    const userDropdown = document.getElementById('userDropdown');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    if (!userDropdown || !userDropdownMenu) return;
    userDropdown.addEventListener('click', function(e) { e.stopPropagation(); userDropdownMenu.classList.toggle('show'); });
    document.addEventListener('click', function() { userDropdownMenu.classList.remove('show'); });
    userDropdownMenu.addEventListener('click', function(e) { e.stopPropagation(); });
});

/* ===== QUICK ACCESS MODAL FUNCTIONS ===== */

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeModalOnOverlay(event, id) {
    if (event.target === event.currentTarget) closeModal(id);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('qaToast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'qa-toast active qa-toast-' + type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.classList.remove('active'); }, 3500);
}

function submitAddProject() {
    const name = document.getElementById('proj-name').value.trim();
    const campus = document.getElementById('proj-campus').value;
    const start = document.getElementById('proj-start').value;
    const end = document.getElementById('proj-end').value;
    if (!name) { showToast('Please enter a project name.', 'error'); return; }
    if (!campus) { showToast('Please select a campus.', 'error'); return; }
    if (!start) { showToast('Please select a start date.', 'error'); return; }
    // Reset form
    ['proj-name', 'proj-desc'].forEach(id => document.getElementById(id).value = '');
    ['proj-campus'].forEach(id => document.getElementById(id).selectedIndex = 0);
    ['proj-start', 'proj-end'].forEach(id => document.getElementById(id).value = '');
    closeModal('addProjectModal');
    showToast('Project "' + name + '" added successfully!');
}

function submitUpdateMap() {
    const campus = document.getElementById('map-campus').value;
    const type = document.getElementById('map-type').value;
    if (!campus) { showToast('Please select a campus.', 'error'); return; }
    if (!type) { showToast('Please select an update type.', 'error'); return; }
    document.getElementById('map-notes').value = '';
    document.getElementById('map-campus').selectedIndex = 0;
    document.getElementById('map-type').selectedIndex = 0;
    document.getElementById('mapFileLabel').textContent = 'Click to upload or drag and drop';
    closeModal('updateMapModal');
    showToast('Map update submitted for ' + campus + '!');
}

function exportReport() {
    const type = document.getElementById('report-type').value;
    const period = document.getElementById('report-period').value;
    showToast('Exporting ' + (type === 'all' ? 'all reports' : type + ' report') + ' for ' + period + '...');
}

function generateReport() {
    closeModal('viewReportsModal');
    showToast('Generating new report... it will appear shortly.');
}

function submitScheduleEvent() {
    const title = document.getElementById('evt-title').value.trim();
    const type = document.getElementById('evt-type').value;
    const date = document.getElementById('evt-date').value;
    const time = document.getElementById('evt-time').value;
    const location = document.getElementById('evt-location').value;
    if (!title) { showToast('Please enter an event title.', 'error'); return; }
    if (!date) { showToast('Please select a date.', 'error'); return; }
    if (!location) { showToast('Please select a location.', 'error'); return; }
    const formatted = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    ['evt-title', 'evt-desc'].forEach(id => document.getElementById(id).value = '');
    ['evt-type', 'evt-location'].forEach(id => document.getElementById(id).selectedIndex = 0);
    ['evt-date', 'evt-time'].forEach(id => document.getElementById(id).value = '');
    closeModal('scheduleEventModal');
    showToast('Event "' + title + '" scheduled for ' + formatted + '!');
}

function handlePhotoUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const count = files.length;
    showToast(count + ' photo' + (count > 1 ? 's' : '') + ' uploaded successfully!');
    event.target.value = '';
}
// Search functionality
(function() {
    const searchData = {
        departments: [
            { name: 'CABHA', students: 1000, faculty: 45, location: 'North Campus' },
            { name: 'CIT', students: 500, faculty: 22, location: 'East Campus' },
            { name: 'CEN', students: 1000, faculty: 38, location: 'South Campus' },
            { name: 'CAM', students: 300, faculty: 15, location: 'West Campus' },
            { name: 'GAG', students: 200, faculty: 12, location: 'North Campus' },
            { name: 'CAS', students: 1000, faculty: 50, location: 'Central Campus' },
            { name: 'CTE', students: 1000, faculty: 42, location: 'East Campus' }
        ],
        campuses: [
            { name: 'Lucban', population: 5000 },
            { name: 'Lucena', population: 1000 },
            { name: 'Gumaca', population: 2000 },
            { name: 'Alabat', population: 3000 },
            { name: 'Catanauan', population: 3000 },
            { name: 'Polillo', population: 1000 },
            { name: 'Infanta', population: 2000 },
            { name: 'Tagkawayan', population: 1000 },
            { name: 'Tiaong', population: 2000 }
        ]
    };

    function search(query) {
        query = query.toLowerCase();
        const results = [];
        
        searchData.departments.forEach(d => {
            if (d.name.toLowerCase().includes(query) || d.location.toLowerCase().includes(query)) {
                results.push({ type: 'Department', name: d.name, info: d.location, page: 'departments' });
            }
        });
        
        searchData.campuses.forEach(c => {
            if (c.name.toLowerCase().includes(query)) {
                results.push({ type: 'Campus', name: c.name, info: c.population + ' students', page: 'campuses' });
            }
        });
        
        return results;
    }

    document.addEventListener('DOMContentLoaded', function() {
        const input = document.getElementById('searchInput');
        const results = document.getElementById('searchResults');
        
        if (!input || !results) return;
        
        input.addEventListener('input', function() {
            const query = input.value.trim();
            
            if (query.length < 2) {
                results.style.display = 'none';
                return;
            }
            
            const matches = search(query);
            
            if (matches.length === 0) {
                results.innerHTML = '<div style="padding:16px;text-align:center;color:#6b7280;">No results</div>';
                results.style.display = 'block';
                return;
            }
            
            results.innerHTML = matches.map(m => 
                `<div style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #f3f4f6;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'" onclick="showPage('${m.page}');document.getElementById('searchResults').style.display='none';document.getElementById('searchInput').value='';">
                    <div style="font-size:10px;text-transform:uppercase;color:#16a34a;font-weight:600;">${m.type}</div>
                    <div style="font-size:14px;font-weight:600;color:#1f2937;">${m.name}</div>
                    <div style="font-size:12px;color:#6b7280;">${m.info}</div>
                </div>`
            ).join('');
            
            results.style.display = 'block';
        });
        
        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                results.style.display = 'none';
            }
        });
    });
})();

// Refresh Dashboard functionality
function refreshDashboard(page) {
    const btn = event.currentTarget;
    const svg = btn.querySelector('svg');
    
    // Add spinning animation
    svg.style.transition = 'transform 0.6s ease';
    svg.style.transform = 'rotate(360deg)';
    
    // Get current time
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Update the timestamp
    const updateElement = document.getElementById('lastUpdated' + page.charAt(0).toUpperCase() + page.slice(1));
    if (updateElement) {
        updateElement.textContent = `Last updated: Today, ${timeString}`;
    }
    
    // Reset rotation after animation
    setTimeout(() => {
        svg.style.transition = 'none';
        svg.style.transform = 'rotate(0deg)';
    }, 600);
    
    // Optional: You can add actual data refresh logic here
    // For example: fetchLatestData(page);
}