class MasonryGrid {
    constructor(options = {}) {

        if (window.gsap && window.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
        }
        
        this.container = document.querySelector(options.selector || '#masonryGrid');

        if (!this.container) return;

        this.items = options.items || [];
        this.ease = options.ease || 'power3.out';
        this.duration = options.duration || 0.6;
        this.stagger = options.stagger || 0.05;
        this.animateFrom = options.animateFrom || 'bottom';
        this.scaleOnHover = options.scaleOnHover !== undefined ? options.scaleOnHover : true;
        this.hoverScale = options.hoverScale || 0.95;
        this.blurToFocus = options.blurToFocus !== undefined ? options.blurToFocus : true;
        this.colorShiftOnHover = options.colorShiftOnHover !== undefined ? options.colorShiftOnHover : false;

        this.columns = 1;
        this.width = 0;
        this.gridData = [];
        this.hasMounted = false;
        this.imagesReady = false;

        this.init();
    }

    async init() {
        this.setupResizeObserver();
        await this.preloadImages();
        this.imagesReady = true;
        this.render();
    }

    setupResizeObserver() {
        const ro = new ResizeObserver(([entry]) => {
            const { width } = entry.contentRect;
            if (width !== this.width) {
                this.width = width;
                this.updateColumns();
                this.calculateGrid();
                this.render();
            }
        });
        ro.observe(this.container);
    }

    updateColumns() {
        const w = this.width;
        if (w >= 1500) this.columns = 5;
        else if (w >= 1000) this.columns = 4;
        else if (w >= 600) this.columns = 3;
        else if (w >= 400) this.columns = 2;
        else this.columns = 1;
    }

    async preloadImages() {
        const promises = this.items.map(item => {
            return new Promise(resolve => {
                const img = new Image();
                img.src = item.img;
                img.onload = img.onerror = () => resolve();
            });
        });
        await Promise.all(promises);
    }

    calculateGrid() {
        if (!this.width) return;

        const colHeights = new Array(this.columns).fill(0);
        const columnWidth = this.width / this.columns;

        this.gridData = this.items.map(child => {
            const col = colHeights.indexOf(Math.min(...colHeights));
            const x = columnWidth * col;
            const h = child.height / 2; // Scaling down the raw height value as per user prompt logic
            const y = colHeights[col];

            colHeights[col] += h;

            return { ...child, x, y, w: columnWidth, h };
        });

        // Update container height
        const maxHeight = Math.max(...colHeights);
        this.container.style.height = `${maxHeight}px`;
    }

    getInitialPosition(item) {
        let direction = this.animateFrom;

        if (this.animateFrom === 'random') {
            const directions = ['top', 'bottom', 'left', 'right'];
            direction = directions[Math.floor(Math.random() * directions.length)];
        }

        switch (direction) {
            case 'top': return { x: item.x, y: -200 };
            case 'bottom': return { x: item.x, y: window.innerHeight + 200 };
            case 'left': return { x: -200, y: item.y };
            case 'right': return { x: window.innerWidth + 200, y: item.y };
            case 'center': return { x: this.width / 2 - item.w / 2, y: 0 }; // Simplified center
            default: return { x: item.x, y: item.y + 100 };
        }
    }

    render() {
        if (!this.imagesReady) return;

        // Cleanup: Remove elements that are no longer in the gridData
        const currentIds = this.gridData.map(item => item.id);
        const existingEls = this.container.querySelectorAll('.item-wrapper');
        existingEls.forEach(el => {
            if (!currentIds.includes(el.dataset.key)) {
                el.remove();
            }
        });

        if (!this.gridData.length) return;

        this.gridData.forEach((item, index) => {

            let el = this.container.querySelector(`[data-key="${item.id}"]`);
            
            if (!el) {
                // Create element if it doesn't exist
                el = document.createElement('div');
                el.className = 'item-wrapper';
                el.dataset.key = item.id;
                el.innerHTML = `
                    <div class="item-img" style="background-image: url('${item.img}')">
                        ${this.colorShiftOnHover ? '<div class="color-overlay"></div>' : ''}
                    </div>
                `;
                
                el.onclick = () => window.open(item.url || '#', '_blank', 'noopener');
                el.onmouseenter = (e) => this.handleMouseEnter(e, item);
                el.onmouseleave = (e) => this.handleMouseLeave(e, item);
                
                this.container.appendChild(el);

                // Initial animation
                const initialPos = this.getInitialPosition(item);
                gsap.set(el, {
                    opacity: 0,
                    x: initialPos.x,
                    y: initialPos.y,
                    width: item.w,
                    height: item.h,
                    ...(this.blurToFocus && { filter: 'blur(10px)' })
                });

                gsap.to(el, {
                    opacity: 1,
                    x: item.x,
                    y: item.y,
                    width: item.w,
                    height: item.h,
                    ...(this.blurToFocus && { filter: 'blur(0px)' }),
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: this.container,
                        start: 'top 85%', // Trigger when top of container is 85% from top of viewport
                        once: true
                    },
                    delay: index * this.stagger
                });

            } else {
                // Update existing element position/size
                gsap.to(el, {
                    x: item.x,
                    y: item.y,
                    width: item.w,
                    height: item.h,
                    duration: this.duration,
                    ease: this.ease,
                    overwrite: 'auto'
                });
            }
        });

        this.hasMounted = true;
    }

    handleMouseEnter(e, item) {
        if (this.scaleOnHover) {
            gsap.to(e.currentTarget, {
                scale: this.hoverScale,
                duration: 0.3,
                ease: 'power2.out'
            });
        }

        if (this.colorShiftOnHover) {
            const overlay = e.currentTarget.querySelector('.color-overlay');
            if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
        }
    }

    handleMouseLeave(e, item) {
        if (this.scaleOnHover) {
            gsap.to(e.currentTarget, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        }

        if (this.colorShiftOnHover) {
            const overlay = e.currentTarget.querySelector('.color-overlay');
            if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
        }
    }
}

// Global initialization function
window.initDapitanMasonry = function(items) {
    return new MasonryGrid({
        selector: '#masonryGrid',
        items: items,
        animateFrom: 'bottom',
        stagger: 0.08,
        hoverScale: 0.97,
        blurToFocus: true
    });
};
