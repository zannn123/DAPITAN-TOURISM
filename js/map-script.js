// Dapitan Interactive Map
class DapitanMap {
    constructor() {
        this.map = document.getElementById('dapitanMap');
        if (!this.map) return;
        
        this.tooltip = document.getElementById('mapTooltip');
        this.markers = document.querySelectorAll('.map-marker');
        this.locations = this.getLocationData();
        this.isDragging = false;
        this.init();
    }

    getLocationData() {
        return {
            'rizal-shrine': {
                title: 'Rizal Shrine',
                desc: 'Dr. José Rizal\'s exile home. National hero lived here 1892-1896.',
                color: '#ff6b6b',
                link: 'explore.html'
            },
            'dakak-beach': {
                title: 'Dakak Beach Resort',
                desc: 'World-class white sand beach with crystal waters.',
                color: '#4ecdc4',
                link: 'explore.html'
            },
            'linaw-beach': {
                title: 'Linaw Beach',
                desc: 'Family-friendly beach with calm, clear waters.',
                color: '#a8e6cf',
                link: 'explore.html'
            },
            'sumlog-falls': {
                title: 'Sumlog Waterfalls',
                desc: 'Hidden jungle falls with natural swimming pools.',
                color: '#3498db',
                link: 'explore.html'
            }
        };
    }

    init() {
        this.setupEventListeners();
        this.setupMapInteractions();
        this.animateMarkers();
    }

    setupEventListeners() {
        this.markers.forEach((marker, index) => {
            const location = marker.dataset.location;
            
            // Desktop hover
            marker.addEventListener('mouseenter', (e) => this.showTooltip(e, location));
            marker.addEventListener('mouseleave', () => this.hideTooltip());
            
            // Click navigation
            marker.addEventListener('click', (e) => this.handleMarkerClick(e, location));
            
            // Mobile touch
            marker.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.showTooltip({ currentTarget: marker }, location);
            }, { passive: false });
        });
    }

    setupMapInteractions() {
        let startX, startY;
        
        // Desktop drag
        this.map.style.cursor = 'grab';
        this.map.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            this.map.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const deltaX = (e.clientX - startX) * 0.5;
            const deltaY = (e.clientY - startY) * 0.5;
            this.map.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.02)`;
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.map.style.cursor = 'grab';
                setTimeout(() => {
                    this.map.style.transform = 'translate(0,0) scale(1)';
                }, 300);
            }
        });

        // Touch support
        this.map.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: false });

        this.map.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const deltaX = (e.touches[0].clientX - startX) * 0.3;
            const deltaY = (e.touches[0].clientY - startY) * 0.3;
            this.map.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.01)`;
        }, { passive: false });

        // Subtle parallax
        document.addEventListener('mousemove', (e) => {
            const rect = this.map.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 15;
            this.map.style.transform = `translate(${x}px, ${y}px) scale(1.003)`;
        });
    }

    animateMarkers() {
        this.markers.forEach((marker, index) => {
            const circle = marker.querySelector('circle');
            const pulse = () => {
                circle.animate([
                    { transform: 'scale(1)', r: circle.getAttribute('r') },
                    { transform: 'scale(1.2)', r: parseFloat(circle.getAttribute('r')) * 1.2 },
                    { transform: 'scale(1)', r: circle.getAttribute('r') }
                ], {
                    duration: 2000 + index * 300,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    iterations: Infinity
                });
            };
            setTimeout(pulse, index * 200);
        });
    }

    showTooltip(event, location) {
        const data = this.locations[location];
        if (!data) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        // Smart positioning
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top - 150;

        // Keep in viewport
        left = Math.max(20, Math.min(window.innerWidth - tooltipRect.width - 20, left));
        top = Math.max(20, Math.min(window.innerHeight - tooltipRect.height - 20, top));

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.opacity = '1';
        this.tooltip.style.visibility = 'visible';
        this.tooltip.style.transform = 'scale(1) translateY(0)';
        this.tooltip.dataset.location = location;

        // Dynamic content
        const content = this.tooltip.querySelector('.tooltip-content');
        content.style.borderLeft = `4px solid ${data.color}`;
        content.innerHTML = `
            <h4 style="color: ${data.color}; margin: 0 0 8px 0;">${data.title}</h4>
            <p style="font-size: 14px; margin: 0 0 16px 0; color: #555; line-height: 1.4;">${data.desc}</p>
            <a href="${data.link}" class="btn tooltip-btn" style="background: ${data.color}; color: white; padding: 10px 24px; font-size: 13px; border: none;">View Details</a>
        `;
    }

    hideTooltip() {
        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'scale(0.95) translateY(-10px)';
        setTimeout(() => {
            this.tooltip.style.visibility = 'hidden';
        }, 250);
    }

    handleMarkerClick(event, location) {
        event.stopPropagation();
        const data = this.locations[location];
        if (data.link) {
            window.location.href = data.link;
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DapitanMap());
} else {
    new DapitanMap();
}