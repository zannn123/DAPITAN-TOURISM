// ============================================================
//  Contacts Page Script
// ============================================================

(() => {
    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => {
            const entities = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };

            return entities[char];
        });
    }

    const spots = [
        {
            key: 'rizal-shrine',
            title: 'RIZAL SHRINE',
            tag: 'Historical Site',
            blurb: 'Gardens, heritage, and quiet afternoon walks',
            image: 'assets/spots/shrine.webp',
            phone: '+63 917 656 4168',
            email: null,
            facebook: 'https://www.facebook.com/rizalparkandshrinedapitan',
            address: 'Barangay Talisay (Matagobtob), Dapitan City, Zamboanga del Norte 7101',
            hours: 'Daily, 8:00 AM - 5:00 PM'
        },
        {
            key: 'punto',
            title: 'PUNTO DE DESEMBARCO DE RIZAL',
            tag: 'Historical Landmark',
            blurb: 'Sunset-facing coastal stop with Rizal history',
            image: 'assets/spots/punto.webp',
            phone: null,
            email: null,
            facebook: null,
            address: 'Sunset Boulevard, Santa Cruz, Dapitan City, Zamboanga del Norte 7101',
            hours: 'Open 24 hours'
        },
        {
            key: 'minmap',
            title: 'RELIEF MAP OF MINDANAO',
            tag: 'Historical Landmark',
            blurb: 'Rizal-crafted city-square centerpiece',
            image: 'assets/spots/minmap.webp',
            phone: '(065) 213-6203',
            email: null,
            facebook: null,
            address: 'Dapitan City Plaza, Corner F. Sanchez & Gov. R. Carnicero Sts., Dapitan City 7101',
            hours: 'Daily access'
        },
        {
            key: 'dakak',
            title: 'DAKAK PARK AND BEACH RESORT',
            tag: 'Beach Resort',
            blurb: 'Private shoreline, resort stays, and water activities',
            image: 'assets/spots/dakak.webp',
            phone: '(065) 918-8000  ·  +63 918 243 7745',
            email: 'info@dakak.com.ph',
            facebook: 'https://www.facebook.com/DakakParkandBeachResort',
            address: 'Barangay Taguilon, Dapitan City, Zamboanga del Norte 7101',
            hours: 'Always open'
        },
        {
            key: 'fantasy',
            title: 'GLORIOUS FANTASY LAND',
            tag: 'Theme Park',
            blurb: 'Night lights, rides, and family attractions',
            image: 'assets/spots/fantasy.webp',
            phone: '+63 909 407 8694  ·  +63 927 490 2057',
            email: null,
            facebook: 'https://www.facebook.com/gloriasfantasyland',
            address: 'GFL Complex, Sunset Boulevard, Barangay Dawo, Dapitan City, Zamboanga del Norte 7101',
            hours: 'Tue-Sun, 2:00 PM - 10:00 PM'
        },
        {
            key: 'parish',
            title: 'ST. JAMES THE GREATER PARISH CHURCH',
            tag: 'Heritage Church',
            blurb: 'Historic church visits and parish schedule',
            image: 'assets/spots/parish.webp',
            phone: '(065) 213-6402  ·  (065) 908-1499',
            email: 'dapitanparish1631@gmail.com',
            facebook: 'https://www.facebook.com/SJGPDapitanParish',
            address: 'Fr. Francisco Paula de Sanchez St., Potol, Dapitan City, Zamboanga del Norte 7101',
            hours: 'Open daily for visits'
        },
        {
            key: 'aliguay',
            title: 'ALIGUAY ISLAND',
            tag: 'Island Destination',
            blurb: 'Boat trips, clear water, and island day tours',
            image: 'assets/spots/aliguay.webp',
            phone: '+63 918 243 7745 (via Dakak Aqua Sports)',
            email: 'info@dakak.com.ph',
            facebook: 'https://www.facebook.com/DakakParkandBeachResort',
            address: 'Barangay Aliguay, Dapitan City, Zamboanga del Norte',
            hours: 'Best visited Apr-Jun'
        }
    ];

    const slidesEl = document.getElementById('carouselSlides');
    const dotsEl = document.getElementById('carouselDots');
    const thumbsEl = document.getElementById('carouselThumbs');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const cardEl = document.getElementById('contactCard');
    const cardHeroImage = document.getElementById('cardHeroImage');
    const cardTag = document.getElementById('cardTag');
    const cardTitle = document.getElementById('cardTitle');
    const cardBody = document.getElementById('cardBody');
    const backdropSlidesEl = document.getElementById('contactBackdropSlides');
    const heroTitleEl = document.getElementById('contactHeroTitle');
    const heroMetaEl = document.getElementById('contactHeroMeta');
    const heroCurrentEl = document.getElementById('contactHeroCurrent');
    const heroTotalEl = document.getElementById('contactHeroTotal');

    if (
        !slidesEl || !dotsEl || !thumbsEl || !prevBtn || !nextBtn ||
        !cardEl || !cardHeroImage || !cardTag || !cardTitle || !cardBody ||
        !backdropSlidesEl || !heroTitleEl || !heroMetaEl || !heroCurrentEl || !heroTotalEl
    ) {
        return;
    }

    let current = 0;
    let autoRotateId = null;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const slideImages = [];
    const thumbImages = [];
    const backdropSlides = [];

    function ensureImageSource(image) {
        if (!image) {
            return;
        }

        const deferredSource = image.getAttribute('data-src');
        if (!deferredSource) {
            return;
        }

        image.src = deferredSource;
        image.removeAttribute('data-src');
    }

    function ensureBackdropSource(backdrop) {
        if (!backdrop) {
            return;
        }

        const deferredSource = backdrop.getAttribute('data-image');
        if (!deferredSource) {
            return;
        }

        backdrop.style.backgroundImage = `url("${deferredSource}")`;
        backdrop.removeAttribute('data-image');
    }

    function primeSpot(index) {
        const normalizedIndex = (index + spots.length) % spots.length;
        ensureImageSource(slideImages[normalizedIndex]);
        ensureImageSource(thumbImages[normalizedIndex]);
        ensureBackdropSource(backdropSlides[normalizedIndex]);
    }

    spots.forEach((spot, index) => {
        const backdrop = document.createElement('div');
        backdrop.className = 'contacts-backdrop-slide' + (index === 0 ? ' active' : '');
        if (index === 0) {
            backdrop.style.backgroundImage = `url("${spot.image}")`;
        } else {
            backdrop.dataset.image = spot.image;
        }
        backdropSlidesEl.appendChild(backdrop);
        backdropSlides.push(backdrop);

        const slide = document.createElement('div');
        slide.className = 'carousel-slide' + (index === 0 ? ' active' : '');
        slide.innerHTML = `
            <img ${index === 0 ? `src="${spot.image}" fetchpriority="high"` : `data-src="${spot.image}"`} alt="${spot.title}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async">
            <div class="carousel-slide-overlay"></div>
            <div class="carousel-slide-label">${spot.title}</div>
        `;
        slide.addEventListener('click', () => goTo(index));
        slidesEl.appendChild(slide);
        slideImages.push(slide.querySelector('img'));

        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to ${spot.title}`);
        dot.addEventListener('click', () => goTo(index));
        dotsEl.appendChild(dot);

        const thumb = document.createElement('div');
        thumb.className = 'carousel-thumb' + (index === 0 ? ' active' : '');
        thumb.innerHTML = `<img ${index < 2 ? `src="${spot.image}"` : `data-src="${spot.image}"`} alt="${spot.title}" loading="lazy" decoding="async">`;
        thumb.addEventListener('click', () => goTo(index));
        thumbsEl.appendChild(thumb);
        thumbImages.push(thumb.querySelector('img'));
    });

    heroTotalEl.textContent = formatIndex(spots.length - 1);

    function formatIndex(index) {
        return String(index + 1).padStart(2, '0');
    }

    function goTo(index, { restartAuto = true } = {}) {
        current = (index + spots.length) % spots.length;
        update();
        if (restartAuto) {
            restartAutoplay();
        }
    }

    function update() {
        primeSpot(current);
        primeSpot(current + 1);
        slidesEl.style.transform = `translateX(-${current * 100}%)`;

        document.querySelectorAll('.contacts-backdrop-slide').forEach((slide, index) => {
            slide.classList.toggle('active', index === current);
        });

        document.querySelectorAll('.carousel-slide').forEach((slide, index) => {
            slide.classList.toggle('active', index === current);
        });

        document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === current);
        });

        document.querySelectorAll('.carousel-thumb').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === current);
            if (index === current) {
                thumb.scrollIntoView({
                    behavior: prefersReducedMotion ? 'auto' : 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        });

        syncHero(spots[current]);
        renderCard(spots[current]);
    }

    function syncHero(spot) {
        heroTitleEl.textContent = spot.title;
        heroMetaEl.textContent = `${spot.tag} · ${spot.blurb}`;
        heroCurrentEl.textContent = formatIndex(current);
    }

    function renderCard(spot) {
        cardEl.classList.remove('visible');

        setTimeout(() => {
            cardHeroImage.src = spot.image;
            cardHeroImage.alt = spot.title;
            cardTag.textContent = spot.tag;
            cardTitle.textContent = spot.title;

            const rows = [];

            if (spot.phone) {
                rows.push(makeRow(
                    '📞',
                    'Phone',
                    spot.phone
                        .split('·')
                        .map(phone => phone.trim())
                        .map(phone => {
                            const phoneHref = phone.replace(/[^+\d]/g, '');
                            const safePhoneLabel = escapeHtml(phone);
                            const safePhoneValue = escapeHtml(phoneHref);

                            return `<a href="tel:${safePhoneValue}" data-phone-link="true" data-phone-number="${safePhoneValue}">${safePhoneLabel}</a>`;
                        })
                        .join('<br>')
                ));
            }

            if (spot.email) {
                rows.push(makeRow('✉️', 'Email', `<a href="mailto:${spot.email}">${spot.email}</a>`));
            }

            if (spot.facebook) {
                rows.push(makeRow(
                    '💬',
                    'Social',
                    `<a href="${spot.facebook}" target="_blank" rel="noopener noreferrer">Visit Official Page ↗</a>`
                ));
            }

            rows.push(makeRow('📍', 'Address', spot.address));
            rows.push(makeRow('🕐', 'Hours', spot.hours));

            cardBody.innerHTML = rows.join('');
            cardEl.classList.add('visible');
        }, 70);
    }

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

    function clearAutoplay() {
        if (autoRotateId) {
            clearInterval(autoRotateId);
            autoRotateId = null;
        }
    }

    function restartAutoplay() {
        clearAutoplay();
        if (prefersReducedMotion) {
            return;
        }

        autoRotateId = window.setInterval(() => {
            goTo(current + 1, { restartAuto: false });
        }, 5200);
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    document.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') {
            goTo(current - 1);
        }
        if (event.key === 'ArrowRight') {
            goTo(current + 1);
        }
    });

    let touchStartX = 0;
    slidesEl.addEventListener('touchstart', event => {
        touchStartX = event.touches[0].clientX;
    }, { passive: true });

    slidesEl.addEventListener('touchend', event => {
        const deltaX = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(deltaX) > 40) {
            goTo(current + (deltaX < 0 ? 1 : -1));
        }
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearAutoplay();
        } else {
            restartAutoplay();
        }
    });

    update();
    setTimeout(() => cardEl.classList.add('visible'), 100);
    restartAutoplay();
})();
