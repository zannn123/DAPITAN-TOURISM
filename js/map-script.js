/**
 * DAPITAN INTERACTIVE MAP - UNIFIED ENGINE
 * Handles: SVG Artistic View, Google Maps API, Sidebar Sync, and Filtering
 */

const locationData = [
    { 
        id: 'rizal-shrine', 
        title: 'Rizal Shrine', 
        cat: 'historic', 
        lat: 8.6586, lng: 123.4241, 
        color: '#ff6b6b',
        desc: "Dr. José Rizal's exile home. The national hero lived here from 1892-1896.",
        photos: ['assets/spots/shrine.jpg', 'assets/spots/punto.jpg'] 
    },
    { 
        id: 'dakak-beach', 
        title: 'Dakak Resort', 
        cat: 'nature', 
        lat: 8.6942, lng: 123.3931, 
        color: '#4ecdc4',
        desc: 'World-class white sand beach with crystal waters and luxury amenities.',
        photos: ['assets/spots/dakak.jpg', 'assets/spots/beach2.jpg'] 
    },
    { 
        id: 'sumlog-falls', 
        title: 'Sumlog Falls', 
        cat: 'nature', 
        lat: 8.6120, lng: 123.4650, 
        color: '#3498db',
        desc: 'Hidden jungle waterfalls with natural swimming pools and lush greenery.',
        photos: ['assets/spots/falls.jpg'] 
    }
];

class DapitanMapManager {
    constructor() {
        // Elements
        this.svgMap = document.getElementById('dapitanMap');
        this.tooltip = document.getElementById('mapTooltip');
        this.googleMapContainer = document.getElementById('google-map-container');
        this.svgContainer = document.getElementById('svg-view-container');
        
        // Google Maps Variables
        this.gMap = null;
        this.infoWindow = null;
        this.markers = [];

        this.init();
    }

    init() {
        this.setupToggles();
        this.setupSVGInteractions();
        this.renderSidebar('all');
        this.animateSVGMarkers();
    }

    // --- VIEW TOGGLE LOGIC ---
    setupToggles() {
        const btnGoogle = document.getElementById('btn-google');
        const btnSvg = document.getElementById('btn-svg');

        btnGoogle.onclick = () => {
            this.svgContainer.style.display = 'none';
            this.googleMapContainer.style.display = 'block';
            btnGoogle.classList.add('active-toggle');
            btnSvg.classList.remove('active-toggle');
        };

        btnSvg.onclick = () => {
            this.googleMapContainer.style.display = 'none';
            this.svgContainer.style.display = 'block';
            btnSvg.classList.add('active-toggle');
            btnGoogle.classList.remove('active-toggle');
        };

        // Filter Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderSidebar(btn.dataset.category);
                if (this.gMap) this.refreshGoogleMarkers(btn.dataset.category);
            };
        });
    }

    // --- SVG ARTISTIC LOGIC (Your Original Work) ---
    setupSVGInteractions() {
        const markers = document.querySelectorAll('.map-marker');
        markers.forEach(marker => {
            const locId = marker.dataset.location;
            marker.addEventListener('mouseenter', (e) => this.showSVGTooltip(e, locId));
            marker.addEventListener('mouseleave', () => this.hideSVGTooltip());
            marker.addEventListener('click', () => window.location.href = 'explore.html');
        });

        // Parallax Effect
        document.addEventListener('mousemove', (e) => {
            if (this.svgContainer.style.display === 'none') return;
            const x = (window.innerWidth / 2 - e.pageX) / 50;
            const y = (window.innerHeight / 2 - e.pageY) / 50;
            this.svgMap.style.transform = `translate(${x}px, ${y}px) scale(1.005)`;
        });
    }

    showSVGTooltip(e, id) {
        const data = locationData.find(l => l.id === id);
        if (!data) return;

        const rect = e.currentTarget.getBoundingClientRect();
        this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
        this.tooltip.style.top = `${rect.top - 10}px`;
        this.tooltip.style.opacity = '1';
        this.tooltip.style.visibility = 'visible';
        this.tooltip.style.transform = 'translate(-50%, -100%) scale(1)';

        const content = this.tooltip.querySelector('.tooltip-content');
        content.innerHTML = `
            <h4 style="color:${data.color}">${data.title}</h4>
            <p>${data.desc}</p>
            <a href="explore.html" class="btn tooltip-btn" style="background:${data.color}">Explore</a>
        `;
    }

    hideSVGTooltip() {
        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'translate(-50%, -100%) scale(0.9)';
    }

    animateSVGMarkers() {
        document.querySelectorAll('.map-marker circle').forEach((circle, i) => {
            circle.animate([
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(1.3)', opacity: 0.7 },
                { transform: 'scale(1)', opacity: 1 }
            ], { duration: 2000 + (i * 200), iterations: Infinity });
        });
    }

    // --- SIDEBAR & GOOGLE MAPS SYNC ---
    renderSidebar(filter) {
        const list = document.getElementById('locationList');
        list.innerHTML = '';

        locationData.forEach(loc => {
            if (filter !== 'all' && loc.cat !== filter) return;

            const li = document.createElement('li');
            li.className = 'location-item glass';
            li.innerHTML = `<strong>${loc.title}</strong><p>${loc.cat}</p>`;
            li.onclick = () => this.focusLocation(loc, li);
            list.appendChild(li);
        });
    }

    focusLocation(loc, element) {
        // Switch to Google view if user clicks sidebar
        document.getElementById('btn-google').click();
        
        if (this.gMap) {
            this.gMap.panTo({ lat: loc.lat, lng: loc.lng });
            this.gMap.setZoom(16);
            this.openGoogleInfoWindow(loc);
        }

        document.querySelectorAll('.location-item').forEach(i => i.classList.remove('active-item'));
        element.classList.add('active-item');
    }

    openGoogleInfoWindow(loc) {
        const photoHtml = loc.photos.map(p => `<img src="${p}" style="width:120px; border-radius:8px;">`).join('');
        this.infoWindow.setContent(`
            <div class="google-info-card" style="color:#333; width:220px;">
                <h3>${loc.title}</h3>
                <div class="map-photo-carousel" style="display:flex; overflow-x:auto; gap:5px;">${photoHtml}</div>
                <p style="font-size:12px; margin:8px 0;">${loc.desc}</p>
                <a href="explore.html" class="btn" style="display:block; text-align:center;">Visit Site</a>
            </div>
        `);
        this.infoWindow.setPosition({ lat: loc.lat, lng: loc.lng });
        this.infoWindow.open(this.gMap);
    }

    refreshGoogleMarkers(filter) {
        this.markers.forEach(m => {
            const data = locationData.find(l => l.title === m.getTitle());
            m.setVisible(filter === 'all' || data.cat === filter);
        });
    }
}

// Global Google Maps Callback
function initMap() {
    const manager = window.mapInstance = new DapitanMapManager();
    const center = { lat: 8.6541, lng: 123.4208 };
    
    manager.gMap = new google.maps.Map(document.getElementById("googleMap"), {
        center: center,
        zoom: 13,
        disableDefaultUI: true,
        styles: [{ "featureType": "all", "elementType": "geometry", "stylers": [{"color": "#242f3e"}] }] // Dark theme example
    });

    manager.infoWindow = new google.maps.InfoWindow();

    locationData.forEach(loc => {
        const marker = new google.maps.Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map: manager.gMap,
            title: loc.title
        });
        marker.addListener('click', () => manager.openGoogleInfoWindow(loc));
        manager.markers.push(marker);
    });
}