// Smooth animation state
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
let targetScroll = window.scrollY;
let currentScroll = window.scrollY;

// Parallax layers
const layers = [
    { element: document.getElementById('back'), mouseSpeed: -0.2, scrollSpeed: 0.4 },
    { element: document.getElementById('text'), mouseSpeed: 0.5, scrollSpeed: -0.2 },
    { element: document.getElementById('front'), mouseSpeed: 1.2, scrollSpeed: 0 },
    { element: document.getElementById('text-hollow'), mouseSpeed: 0.5, scrollSpeed: -0.2 }
];

// Navigation and overlays
const navHome = document.getElementById('navHome');
const navExplore = document.getElementById('navExplore');
const modalLinks = document.querySelectorAll('[data-modal-link="true"]');
const navbar = document.querySelector('.navbar');
const modal = document.getElementById('comingSoonModal');
const closeModal = document.getElementById('closeModal');
const exploreView = document.getElementById('exploreView');
const exploreClose = document.getElementById('exploreClose');
const exploreCanvas = document.getElementById('infinite-grid-menu-canvas');
const exploreTitle = document.getElementById('exploreFaceTitle');
const exploreDescription = document.getElementById('exploreFaceDescription');
const exploreAction = document.getElementById('exploreAction');

const exploreItems = [
    {
        image: 'assets/spots/shrine.jpg',
        link: 'https://share.google/0SGug8sj4Ajri6GW2',
        title: 'RIZAL SHRINE',
        description: 'Step into a living masterpiece where history breathes through lush gardens and preserved heritage. This is where a national genius painted his greatest legacy—a vibrant estate that invites you to walk through the very frames of his extraordinary life.'
    },
    {
        image: 'assets/spots/punto.jpg',
        link: 'https://share.google/kY2GBcUC9OqHYUzOK',
        title: 'PUNTO DE DESEMBARCO DE RIZAL',
        description: 'Stand exactly where the story begins. Framed by the unobstructed, golden hues of the famous Dapitan sunset, this iconic coastal landmark captures the beautiful prologue of a city forever changed by a hero\'s arrival.'
    },
    {
        image: 'assets/spots/minmap.jpg',
        link: 'https://share.google/8w86OuB8yTGAARDUg',
        title: 'RELIEF MAP OF MINDANAO',
        description: 'Marvel at a vision carved directly into the earth. Meticulously sculpted by Rizal himself, this 19th-century geographical marvel is a stunning centerpiece that blends artistry, education, and heritage right in the heart of the city square.'
    },
    {
        image: 'assets/spots/dakak.jpg',
        link: 'https://share.google/mEZEUDSFBKCYkx3iW',
        title: 'DAKAK PARK AND BEACH RESORT',
        description: 'Dive into a breathtaking canvas painted in pristine blues and powdery whites. From secluded sand coves to heart-pounding zip lines, this sprawling tropical paradise perfectly captures the raw, untouched beauty and vibrant energy of nature.'
    },
    {
        image: 'assets/spots/fantasy.jpg',
        link: 'https://share.google/FVP9iLem9R3EHysba',
        title: 'GLORIOUS FANTASY LAND',
        description: 'Watch the canvas glow as the night comes alive. Step into a dazzling explosion of neon colors, thrilling rides, and spectacular fire shows that will ignite your imagination and transform your evening into an unforgettable, dynamic spectacle.'
    },
    {
        image: 'assets/spots/parish.jpg',
        link: 'https://share.google/WZY9Wynr3mYCRFO0U',
        title: 'ST. JAMES THE GREATER PARISH CHURCH',
        description: 'Marvel at the architectural strokes of centuries past. This stunning heritage church stands as a timeless testament to faith and history, its intricate designs and solemn atmosphere offering a beautifully preserved glimpse into the city\'s soulful past.'
    },
    {
        image: 'assets/spots/aliguay.jpg',
        link: 'https://share.google/wHhnY2WZHhUX7xFuV',
        title: 'ALIGUAY ISLAND',
        description: 'Escape to an untouched masterpiece of crystal-clear waters and vibrant coral reefs. This secluded island paradise is nature\'s finest work, offering a serene, white-sand sanctuary for those looking to immerse themselves in absolute tranquility.'
    }
];

let exploreScene = null;
let activeExploreItem = null;
let exploreIsMoving = true;

document.addEventListener('mousemove', event => {
    targetX = (window.innerWidth / 2 - event.pageX) / 100;
    targetY = (window.innerHeight / 2 - event.pageY) / 100;
});

window.addEventListener('scroll', () => {
    targetScroll = window.scrollY;
});

function renderFrame() {
    currentX += (targetX - currentX) * 0.04;
    currentY += (targetY - currentY) * 0.04;
    currentScroll += (targetScroll - currentScroll) * 0.06;

    layers.forEach(layer => {
        if (!layer.element) {
            return;
        }

        const moveX = currentX * layer.mouseSpeed;
        const moveY = (currentY * layer.mouseSpeed) + (currentScroll * layer.scrollSpeed);

        if (layer.element.id === 'text' || layer.element.id === 'text-hollow') {
            const opacity = Math.max(1 - (currentScroll / 500), 0);
            layer.element.style.opacity = opacity;
            layer.element.style.transform = `translate3d(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px), 0)`;
        } else {
            layer.element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(1.02)`;
        }
    });

    requestAnimationFrame(renderFrame);
}

function resetNavbarArtifact() {
    if (!navbar) {
        return;
    }

    navbar.style.animation = 'none';
    navbar.style.transform = 'translateX(-50%)';
}

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
}

function openExploreView() {
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
    exploreView.classList.remove('active');
    exploreView.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('explore-open');
    resetNavbarArtifact();

    // Re-show navbar explicitly in case animation state left it invisible
    if (navbar) {
        navbar.style.opacity = '1';
        navbar.style.transform = 'translateX(-50%)';
    }
}

function openComingSoonModal() {
    closeExploreView();
    resetNavbarArtifact();
    modal.classList.add('active');
}

navHome.addEventListener('click', event => {
    event.preventDefault();
    modal.classList.remove('active');
    closeExploreView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

navExplore.addEventListener('click', event => {
    event.preventDefault();
    openExploreView();
});

modalLinks.forEach(item => {
    item.addEventListener('click', event => {
        event.preventDefault();
        openComingSoonModal();
    });
});

closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
});

exploreClose.addEventListener('click', () => {
    closeExploreView();
});

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

window.addEventListener('click', event => {
    if (event.target === modal) {
        modal.classList.remove('active');
    }
});

window.addEventListener('keydown', event => {
    if (event.key !== 'Escape') {
        return;
    }

    if (exploreView.classList.contains('active')) {
        closeExploreView();
        return;
    }

    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
    }
});

requestAnimationFrame(renderFrame);

// Re-fit title font whenever the viewport is resized
window.addEventListener('resize', () => {
    if (exploreView.classList.contains('active')) {
        fitTitleFontSize(exploreTitle);
    }
});
