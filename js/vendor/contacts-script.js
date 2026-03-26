// ============================================================
//  contact-script.js — Contacts page carousel & card logic
// ============================================================

(() => {

    // ── SPOT DATA ──────────────────────────────────────────────
    const spots = [
        {
            key: 'rizal-shrine',
            title: 'RIZAL SHRINE',
            tag: 'Historical Site',
            image: 'assets/spots/shrine.jpg',
            phone: '+63 917 656 4168',
            email: null,
            facebook: 'https://www.facebook.com/rizalparkandshrinedapitan',
            address: 'Barangay Talisay (Matagobtob), Dapitan City, Zamboanga del Norte 7101',
            hours: 'Daily, 8:00 AM – 5:00 PM · Free Entrance'
        },
        {
            key: 'punto',
            title: 'PUNTO DE DESEMBARCO DE RIZAL',
            tag: 'Historical Landmark',
            image: 'assets/spots/punto.jpg',
            phone: null,
            email: null,
            facebook: null,
            address: 'Sunset Boulevard, Santa Cruz, Dapitan City, Zamboanga del Norte 7101',
            hours: 'Open 24 hours · Free Entrance'
        },
        {
            key: 'minmap',
            title: 'RELIEF MAP OF MINDANAO',
            tag: 'Historical Landmark',
            image: 'assets/spots/minmap.jpg',
            phone: '(065) 213-6203',
            email: null,
            facebook: null,
            address: 'Dapitan City Plaza, Corner F. Sanchez & Gov. R. Carnicero Sts., Dapitan City 7101',
            hours: 'Daily · Free Entrance (Contact City Tourism Office)'
        },
        {
            key: 'dakak',
            title: 'DAKAK PARK AND BEACH RESORT',
            tag: 'Beach Resort',
            image: 'assets/spots/dakak.jpg',
            phone: '(065) 918-8000  ·  +63 918 243 7745',
            email: 'info@dakak.com.ph',
            facebook: 'https://www.facebook.com/DakakParkandBeachResort',
            address: 'Barangay Taguilon, Dapitan City, Zamboanga del Norte 7101',
            hours: 'Always Open (Resort)'
        },
        {
            key: 'fantasy',
            title: 'GLORIOUS FANTASY LAND',
            tag: 'Theme Park',
            image: 'assets/spots/fantasy.jpg',
            phone: '+63 909 407 8694  ·  +63 927 490 2057',
            email: null,
            facebook: 'https://www.facebook.com/gloriasfantasyland',
            address: 'GFL Complex, Sunset Boulevard, Barangay Dawo, Dapitan City, Zamboanga del Norte 7101',
            hours: 'Tue–Thu 2:00 PM – 10:00 PM · Fri–Sun 10:00 AM – 10:00 PM'
        },
        {
            key: 'parish',
            title: 'ST. JAMES THE GREATER PARISH CHURCH',
            tag: 'Heritage Church',
            image: 'assets/spots/parish.jpg',
            phone: '(065) 213-6402  ·  (065) 908-1499',
            email: 'dapitanparish1631@gmail.com',
            facebook: 'https://www.facebook.com/SJGPDapitanParish',
            address: 'Fr. Francisco Paula de Sanchez St., Potol, Dapitan City, Zamboanga del Norte 7101',
            hours: 'Open daily for visits · Mass schedule varies'
        },
        {
            key: 'aliguay',
            title: 'ALIGUAY ISLAND',
            tag: 'Island Destination',
            image: 'assets/spots/aliguay.jpg',
            phone: '+63 918 243 7745 (via Dakak Aqua Sports)',
            email: 'info@dakak.com.ph',
            facebook: 'https://www.facebook.com/DakakParkandBeachResort',
            address: 'Barangay Aliguay, Dapitan City, Zamboanga del Norte (Island Barangay, ~1 hr by speedboat)',
            hours: 'Best visited Apr–Jun · Tours bookable via Dakak Resort'
        }
    ];

    // ── DOM REFERENCES ─────────────────────────────────────────
    const slidesEl  = document.getElementById('carouselSlides');
    const dotsEl    = document.getElementById('carouselDots');
    const thumbsEl  = document.getElementById('carouselThumbs');
    const prevBtn   = document.getElementById('carouselPrev');
    const nextBtn   = document.getElementById('carouselNext');
    const cardEl    = document.getElementById('contactCard');
    const cardTag   = document.getElementById('cardTag');
    const cardTitle = document.getElementById('cardTitle');
    const cardBody  = document.getElementById('cardBody');

    // Guard — exit silently if we're not on the contacts page
    if (!slidesEl || !cardEl) return;

    // ── STATE ──────────────────────────────────────────────────
    let current = 0;

    // ── BUILD CAROUSEL ─────────────────────────────────────────
    spots.forEach((spot, i) => {

        // Slide
        const slide = document.createElement('div');
        slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
        slide.dataset.index = i;
        slide.innerHTML = `
            <img src="${spot.image}" alt="${spot.title}" loading="lazy">
            <div class="carousel-slide-overlay"></div>
            <div class="carousel-slide-label">${spot.title}</div>
        `;
        slide.addEventListener('click', () => goTo(i));
        slidesEl.appendChild(slide);

        // Dot
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to ${spot.title}`);
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);

        // Thumbnail
        const thumb = document.createElement('div');
        thumb.className = 'carousel-thumb' + (i === 0 ? ' active' : '');
        thumb.innerHTML = `<img src="${spot.image}" alt="${spot.title}">`;
        thumb.addEventListener('click', () => goTo(i));
        thumbsEl.appendChild(thumb);
    });

    // ── NAVIGATION ─────────────────────────────────────────────
    function goTo(index) {
        current = (index + spots.length) % spots.length;
        update();
    }

    function update() {
        // Translate the slides strip
        slidesEl.style.transform = `translateX(-${current * 100}%)`;

        // Toggle active state on all indicators
        document.querySelectorAll('.carousel-slide').forEach((s, i) =>
            s.classList.toggle('active', i === current));

        document.querySelectorAll('.carousel-dot').forEach((d, i) =>
            d.classList.toggle('active', i === current));

        document.querySelectorAll('.carousel-thumb').forEach((t, i) => {
            t.classList.toggle('active', i === current);
            if (i === current) {
                t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });

        // Refresh the contact card
        renderCard(spots[current]);
    }

    // Arrow buttons
    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    // Keyboard arrows
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
    });

    // Touch / swipe
    let touchStartX = 0;
    slidesEl.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    slidesEl.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    // ── CONTACT CARD ───────────────────────────────────────────
    function renderCard(spot) {
        // Fade out first, then swap content, then fade back in
        cardEl.classList.remove('visible');

        setTimeout(() => {
            cardTag.textContent   = spot.tag;
            cardTitle.textContent = spot.title;

            const rows = [];

            // Phone
            rows.push(makeRow('📞', 'Phone',
                spot.phone
                    ? spot.phone
                        .split('·')
                        .map(p => p.trim())
                        .map(p => `<a href="tel:${p.replace(/[^+\d]/g, '')}">${p}</a>`)
                        .join('<br>')
                    : '<span class="contact-na">Not available</span>'
            ));

            rows.push('<div class="contact-divider"></div>');

            // Email
            rows.push(makeRow('✉️', 'Email',
                spot.email
                    ? `<a href="mailto:${spot.email}">${spot.email}</a>`
                    : '<span class="contact-na">Not available</span>'
            ));

            rows.push('<div class="contact-divider"></div>');

            // Facebook / Social
            rows.push(makeRow('💬', 'Facebook / Social',
                spot.facebook
                    ? `<a href="${spot.facebook}" target="_blank" rel="noopener noreferrer">Visit Official Page ↗</a>`
                    : '<span class="contact-na">Not available</span>'
            ));

            rows.push('<div class="contact-divider"></div>');

            // Address
            rows.push(makeRow('📍', 'Address',
                spot.address || '<span class="contact-na">Not available</span>'
            ));

            rows.push('<div class="contact-divider"></div>');

            // Hours / Access
            rows.push(makeRow('🕐', 'Hours / Access',
                spot.hours || '<span class="contact-na">Not available</span>'
            ));

            cardBody.innerHTML = rows.join('');
            cardEl.classList.add('visible');

        }, 60); // short delay lets the fade-out finish
    }

    /**
     * Builds a single contact row HTML string.
     * @param {string} icon      — emoji icon
     * @param {string} label     — field label
     * @param {string} valueHTML — inner HTML for the value cell
     */
    function makeRow(icon, label, valueHTML) {
        return `
            <div class="contact-row">
                <div class="contact-icon">${icon}</div>
                <div class="contact-info">
                    <div class="contact-info-label">${label}</div>
                    <div class="contact-info-value">${valueHTML}</div>
                </div>
            </div>
        `;
    }

    // ── INIT ───────────────────────────────────────────────────
    renderCard(spots[0]);
    // Slight delay so the CSS transition actually fires on first load
    setTimeout(() => cardEl.classList.add('visible'), 100);

})();