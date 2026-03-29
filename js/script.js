// Navigation and overlays
const navHome = document.getElementById('navHome');
const navExplore = document.getElementById('navExplore');
const modalLinks = document.querySelectorAll('[data-modal-link="true"]');
const topBarContainer = document.querySelector('.top-bar-container');
const navbar = document.querySelector('.navbar');
const modal = document.getElementById('comingSoonModal');
const closeModal = document.getElementById('closeModal');
const exploreView = document.getElementById('exploreView');
const exploreClose = document.getElementById('exploreClose');
const exploreCanvas = document.getElementById('infinite-grid-menu-canvas');
const exploreTitle = document.getElementById('exploreFaceTitle');
const exploreDescription = document.getElementById('exploreFaceDescription');
const exploreAction = document.getElementById('exploreAction');
let weatherInitialized = false;
let phoneToastTimeout = null;
let exploreResizeFrame = 0;

const exploreItems = [
    {
        image: 'assets/spots/shrine.webp',
        link: 'https://share.google/0SGug8sj4Ajri6GW2',
        title: 'RIZAL SHRINE',
        description: 'Step into a living masterpiece where history breathes through lush gardens and preserved heritage. This is where a national genius painted his greatest legacy—a vibrant estate that invites you to walk through the very frames of his extraordinary life.'
    },
    {
        image: 'assets/spots/punto.webp',
        link: 'https://share.google/kY2GBcUC9OqHYUzOK',
        title: 'PUNTO DE DESEMBARCO DE RIZAL',
        description: 'Stand exactly where the story begins. Framed by the unobstructed, golden hues of the famous Dapitan sunset, this iconic coastal landmark captures the beautiful prologue of a city forever changed by a hero\'s arrival.'
    },
    {
        image: 'assets/spots/minmap.webp',
        link: 'https://share.google/8w86OuB8yTGAARDUg',
        title: 'RELIEF MAP OF MINDANAO',
        description: 'Marvel at a vision carved directly into the earth. Meticulously sculpted by Rizal himself, this 19th-century geographical marvel is a stunning centerpiece that blends artistry, education, and heritage right in the heart of the city square.'
    },
    {
        image: 'assets/spots/dakak.webp',
        link: 'https://share.google/mEZEUDSFBKCYkx3iW',
        title: 'DAKAK PARK AND BEACH RESORT',
        description: 'Dive into a breathtaking canvas painted in pristine blues and powdery whites. From secluded sand coves to heart-pounding zip lines, this sprawling tropical paradise perfectly captures the raw, untouched beauty and vibrant energy of nature.'
    },
    {
        image: 'assets/spots/fantasy.webp',
        link: 'https://share.google/FVP9iLem9R3EHysba',
        title: 'GLORIOUS FANTASY LAND',
        description: 'Watch the canvas glow as the night comes alive. Step into a dazzling explosion of neon colors, thrilling rides, and spectacular fire shows that will ignite your imagination and transform your evening into an unforgettable, dynamic spectacle.'
    },
    {
        image: 'assets/spots/parish.webp',
        link: 'https://share.google/WZY9Wynr3mYCRFO0U',
        title: 'ST. JAMES THE GREATER PARISH CHURCH',
        description: 'Marvel at the architectural strokes of centuries past. This stunning heritage church stands as a timeless testament to faith and history, its intricate designs and solemn atmosphere offering a beautifully preserved glimpse into the city\'s soulful past.'
    },
    {
        image: 'assets/spots/aliguay.webp',
        link: 'https://share.google/wHhnY2WZHhUX7xFuV',
        title: 'ALIGUAY ISLAND',
        description: 'Escape to an untouched masterpiece of crystal-clear waters and vibrant coral reefs. This secluded island paradise is nature\'s finest work, offering a serene, white-sand sanctuary for those looking to immerse themselves in absolute tranquility.'
    }
];

let exploreScene = null;
let activeExploreItem = null;
let exploreIsMoving = true;

function resetNavbarArtifact() {
    if (topBarContainer) {
        topBarContainer.style.opacity = '';
        topBarContainer.style.visibility = '';
        topBarContainer.style.pointerEvents = '';
        topBarContainer.style.transform = 'translateX(-50%)';
        topBarContainer.style.animation = 'none';
    }

    if (navbar) {
        navbar.style.opacity = '';
        navbar.style.transform = '';
    }
}

function isDesktopPhoneCopyMode() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function removePhoneToast() {
    const existingToast = document.querySelector('[data-phone-toast="true"]');
    if (!existingToast) {
        return;
    }

    existingToast.style.opacity = '0';
    existingToast.style.transform = 'translate(-50%, 8px)';
    window.setTimeout(() => existingToast.remove(), 180);
}

function showPhoneToast(message) {
    removePhoneToast();

    const toast = document.createElement('div');
    toast.dataset.phoneToast = 'true';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.left = '50%';
    toast.style.bottom = '24px';
    toast.style.transform = 'translate(-50%, 0)';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '999px';
    toast.style.background = 'rgba(9, 23, 14, 0.9)';
    toast.style.color = '#ffffff';
    toast.style.fontFamily = "'Inter', sans-serif";
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '600';
    toast.style.letterSpacing = '0.01em';
    toast.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.24)';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.14)';
    toast.style.zIndex = '5000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0)';
    });

    if (phoneToastTimeout) {
        clearTimeout(phoneToastTimeout);
    }

    phoneToastTimeout = window.setTimeout(() => {
        removePhoneToast();
        phoneToastTimeout = null;
    }, 1800);
}

async function copyPhoneNumber(phoneNumber) {
    try {
        await navigator.clipboard.writeText(phoneNumber);
        showPhoneToast(`Copied: ${phoneNumber}`);
        return true;
    } catch (error) {
        console.error('Phone copy failed', error);
        showPhoneToast(`Phone: ${phoneNumber}`);
        return false;
    }
}

document.addEventListener('click', event => {
    const phoneLink = event.target.closest('[data-phone-link="true"]');
    if (!phoneLink) {
        return;
    }

    const phoneNumber = phoneLink.getAttribute('data-phone-number') || phoneLink.getAttribute('href')?.replace(/^tel:/, '');
    if (!phoneNumber || !isDesktopPhoneCopyMode()) {
        return;
    }

    event.preventDefault();
    copyPhoneNumber(phoneNumber);
});

/**
 * Dynamically shrinks the font-size of an element until every individual word
 * fits within the element's current pixel width. This prevents ANY word from
 * horizontally overflowing the left-side panel and touching the circle image.
 * No hardcoded values — all measurements come from the live DOM.
 */
function fitTitleFontSize(element) {
    if (!element) return;

    // Reset to the CSS-computed value first
    element.style.fontSize = '';

    const containerWidth = element.offsetWidth;
    if (!containerWidth) return;

    const words = element.textContent.trim().split(/\s+/);
    if (!words.length) return;

    // Offscreen probe span — inherits the same font stack as the element
    const probe = document.createElement('span');
    const computedStyle = getComputedStyle(element);
    probe.style.cssText = [
        'position:absolute',
        'visibility:hidden',
        'white-space:nowrap',
        'top:-9999px',
        'left:-9999px',
        `font-family:${computedStyle.fontFamily}`,
        `font-weight:${computedStyle.fontWeight}`,
        `letter-spacing:${computedStyle.letterSpacing}`,
        `text-transform:${computedStyle.textTransform}`
    ].join(';');
    document.body.appendChild(probe);

    let fontSize = parseFloat(computedStyle.fontSize);
    const minFontSize = 12;

    // Shrink until every word fits in one line of the available column width
    while (fontSize > minFontSize) {
        probe.style.fontSize = fontSize + 'px';
        const overflows = words.some(word => {
            probe.textContent = word;
            return probe.offsetWidth > containerWidth;
        });
        if (!overflows) break;
        fontSize -= 1;
    }

    document.body.removeChild(probe);
    element.style.fontSize = fontSize + 'px';
}

function syncExploreOverlayState() {
    if (!exploreTitle || !exploreDescription || !exploreAction) {
        return;
    }

    const shouldShowDetails = Boolean(activeExploreItem) && !exploreIsMoving;

    exploreTitle.textContent = activeExploreItem ? activeExploreItem.title : '';
    exploreDescription.textContent = activeExploreItem ? activeExploreItem.description : '';

    // Re-fit title font every time text changes so no word ever hits the circle
    requestAnimationFrame(() => fitTitleFontSize(exploreTitle));

    [exploreTitle, exploreDescription, exploreAction].forEach(element => {
        element.classList.toggle('active', shouldShowDetails);
        element.classList.toggle('inactive', !shouldShowDetails);
    });

    exploreAction.disabled = !activeExploreItem || !activeExploreItem.link;
}

function ensureExploreScene() {
    if (exploreScene || !window.InfiniteMenuScene || !exploreCanvas) {
        return;
    }

    try {
        exploreScene = new window.InfiniteMenuScene({
            canvas: exploreCanvas,
            items: exploreItems,
            scale: 1,
            onActiveItemChange: item => {
                activeExploreItem = item;
                syncExploreOverlayState();
            },
            onMovementChange: isMoving => {
                exploreIsMoving = isMoving;
                syncExploreOverlayState();
            }
        });
    } catch (e) {
        console.error("Explore scene init failed", e);
    }
}

function openExploreView() {
    if (!modal || !exploreView) {
        return;
    }

    resetNavbarArtifact();
    modal.classList.remove('active');
    exploreView.classList.add('active');
    exploreView.setAttribute('aria-hidden', 'false');
    document.body.classList.add('explore-open');

    ensureExploreScene();

    requestAnimationFrame(() => {
        if (exploreScene) {
            exploreScene.resize();
        }
    });
}

function closeExploreView() {
    if (!exploreView) {
        return;
    }

    exploreView.classList.remove('active');
    exploreView.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('explore-open');
    resetNavbarArtifact();

    // Unset inline styles. The CSS `explore-open` state handles invisibility properly.
    if (navbar) {
        navbar.style.opacity = '';
        navbar.style.transform = '';
    }
}

function openComingSoonModal() {
    if (!modal) {
        return;
    }

    closeExploreView();
    resetNavbarArtifact();
    modal.classList.add('active');
}

/**
 * ─── NAVIGATION REFINEMENTS ───
 * Handles Home and Explore clicks with fallback for non-homepage views.
 */
if (navHome) {
    navHome.addEventListener('click', event => {
        if (!document.querySelector('.hero')) {
            return;
        }
        event.preventDefault();
        if (modal) modal.classList.remove('active');
        closeExploreView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Clear hash without reload
        history.pushState("", document.title, window.location.pathname + window.location.search);
    });
}

if (navExplore) {
    navExplore.addEventListener('click', event => {
        // If there's no exploreView on this page, let it naturally navigate to index.html#explore
        if (!exploreView) {
            return;
        }
        event.preventDefault();
        openExploreView();
    });
}

modalLinks.forEach(item => {
    item.addEventListener('click', event => {
        event.preventDefault();
        openComingSoonModal();
    });
});

if (closeModal && modal) {
    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });
}

if (exploreClose) {
    exploreClose.addEventListener('click', () => {
        closeExploreView();
    });
}

if (exploreAction) {
    exploreAction.addEventListener('click', () => {
        if (!activeExploreItem || !activeExploreItem.link) {
            return;
        }

        if (activeExploreItem.link.startsWith('http')) {
            window.open(activeExploreItem.link, '_blank', 'noopener,noreferrer');
            return;
        }

        window.location.href = activeExploreItem.link;
    });
}

window.addEventListener('click', event => {
    if (event.target === modal) {
        modal.classList.remove('active');
    }
});

window.addEventListener('keydown', event => {
    if (event.key !== 'Escape') {
        return;
    }

    if (exploreView && exploreView.classList.contains('active')) {
        closeExploreView();
        return;
    }

    if (modal && modal.classList.contains('active')) {
        modal.classList.remove('active');
    }
});

function initMasonryWhenVisible(items) {
    const masonrySection = document.getElementById('masonryGallery');
    if (!window.initDapitanMasonry || !masonrySection) {
        return;
    }

    let initialized = false;
    const start = () => {
        if (initialized) {
            return;
        }

        initialized = true;
        window.initDapitanMasonry(items);
    };

    if (!('IntersectionObserver' in window)) {
        start();
        return;
    }

    const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) {
            return;
        }

        observer.disconnect();
        start();
    }, { rootMargin: '280px 0px' });

    observer.observe(masonrySection);
}

/**
 * Syncs the view based on URL hash (e.g., #explore)
 */
function syncInitialViewFromRoute() {
    if (window.location.hash === '#explore' && exploreView) {
        openExploreView();
        return;
    }

    if (exploreView && exploreView.classList.contains('active')) {
        closeExploreView();
    }

    document.body.classList.remove('explore-open');
    resetNavbarArtifact();
}

// Handle browser Back/Forward or fresh loads with hash
window.addEventListener('hashchange', syncInitialViewFromRoute);
window.addEventListener('pageshow', syncInitialViewFromRoute);
syncInitialViewFromRoute();

// Re-fit title font whenever the viewport is resized
window.addEventListener('resize', () => {
    if (!exploreView || !exploreView.classList || !exploreView.classList.contains('active')) {
        return;
    }

    if (exploreResizeFrame) {
        cancelAnimationFrame(exploreResizeFrame);
    }

    exploreResizeFrame = requestAnimationFrame(() => {
        fitTitleFontSize(exploreTitle);
        exploreResizeFrame = 0;
    });
});

// Initialize Masonry Gallery on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const masonryData = [
        {
            id: "punto",
            img: "assets/spots/punto.webp",
            url: "https://share.google/kY2GBcUC9OqHYUzOK",
            height: 900 // Tall
        },
        {
            id: "shrine",
            img: "assets/spots/shrine.webp",
            url: "https://share.google/0SGug8sj4Ajri6GW2",
            height: 750
        },
        {
            id: "minmap",
            img: "assets/spots/minmap.webp",
            url: "https://share.google/8w86OuB8yTGAARDUg",
            height: 600
        },
        {
            id: "dakak",
            img: "assets/spots/dakak.webp",
            url: "https://share.google/mEZEUDSFBKCYkx3iW",
            height: 850
        },
        {
            id: "fantasy",
            img: "assets/spots/fantasy.webp",
            url: "https://share.google/FVP9iLem9R3EHysba",
            height: 700
        },
        {
            id: "parish",
            img: "assets/spots/parish.webp",
            url: "https://share.google/WZY9Wynr3mYCRFO0U",
            height: 800
        },
        {
            id: "aliguay",
            img: "assets/spots/aliguay.webp",
            url: "https://share.google/wHhnY2WZHhUX7xFuV",
            height: 650
        }
    ];

    initMasonryWhenVisible(masonryData);

    // Weather Initialization - ensure it runs even if DOMContentLoaded already fired
    initDapitanWeather();
});

// Immediate execution check if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initDapitanWeather();
}

/**
 * ─── WEATHER INTEGRATION ───
 * Fetches real-time weather for Dapitan City (8.65, 123.42)
 * using Open-Meteo API.
 */
async function initDapitanWeather() {
    if (weatherInitialized) {
        return;
    }

    const tempEl = document.getElementById('weatherTemp');
    const iconEl = document.getElementById('weatherIcon');
    if (!tempEl || !iconEl) return;

    weatherInitialized = true;

    const lat = 8.65;
    const lon = 123.42;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const { temperature, weathercode } = data.current_weather;
        tempEl.textContent = `${Math.round(temperature)}°`;
        iconEl.innerHTML = getWeatherSVG(weathercode);
    } catch (error) {
        console.error('Weather fetch failed:', error);
        tempEl.textContent = '29°'; // Fallback for Dapitan average
        iconEl.innerHTML = getWeatherSVG(1); // Partial cloud fallback
    }
}

function getWeatherSVG(code) {
    // Basic mapping of Open-Meteo codes to SVGs
    // Codes: https://open-meteo.com/en/docs
    
    const icons = {
        clear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5" fill="#FFD700"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#FFBC00"/></svg>`,
        partial: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 4.5 4.5 0 0 0-8.9 1c-2.3.4-4 2.4-4 4.8a4.7 4.7 0 0 0 4.7 4.7h8.2z" fill="#f0f0f0"/><circle cx="12" cy="9" r="3" fill="#FFD700"/><path d="M12 5v1M15.5 6.5l-.7.7M17 9h-1M15.5 11.5l-.7-.7" stroke="#FFBC00"/></svg>`,
        cloudy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 4.5 4.5 0 0 0-8.9 1c-2.3.4-4 2.4-4 4.8a4.7 4.7 0 0 0 4.7 4.7h8.2z" fill="#d1d1d1" stroke="#a0a0a0"/></svg>`,
        rain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 4.5 4.5 0 0 0-8.9 1c-2.3.4-4 2.4-4 4.8a4.7 4.7 0 0 0 4.7 4.7h8.2z" fill="#a0bedb"/><path d="M10 20v2M14 20v2M7 18v2" stroke="#4a90e2"/></svg>`,
        thunder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 4.5 4.5 0 0 0-8.9 1c-2.3.4-4 2.4-4 4.8a4.7 4.7 0 0 0 4.7 4.7h8.2z" fill="#7a7a7a"/><path d="M13 18l-2 3h3l-2 3" fill="#FFD700" stroke="#FFBC00"/></svg>`
    };

    if (code === 0) return icons.clear;
    if (code >= 1 && code <= 3) return icons.partial;
    if (code >= 45 && code <= 48) return icons.cloudy;
    if (code >= 51 && code <= 67) return icons.rain;
    if (code >= 80 && code <= 82) return icons.rain;
    if (code >= 95) return icons.thunder;
    return icons.partial; // default
}
