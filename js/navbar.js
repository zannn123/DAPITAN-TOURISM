(() => {
    const mountPoint = document.getElementById('siteNavbar');
    if (!mountPoint) {
        return;
    }

    mountPoint.innerHTML = `
        <div class="top-bar-container">
            <nav class="navbar" aria-label="Primary">
                <div class="nav-logo">
                    <img src="assets/logo.png" alt="Dapitan Logo" class="nav-logo-image">
                </div>
                <ul class="nav-links">
                    <li><a href="index.html" class="nav-item" id="navHome" data-nav="home">
                        <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 10.5 12 4l8 6.5"/>
                            <path d="M6.5 9.5V20h11V9.5"/>
                            <path d="M10 20v-5h4v5"/>
                        </svg>
                        <span class="nav-label">Home</span>
                    </a></li>
                    <li><a href="index.html#explore" class="nav-item" id="navExplore" data-nav="explore">
                        <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m12 5 2.1 4.3 4.8.7-3.4 3.3.8 4.7-4.3-2.3-4.3 2.3.8-4.7-3.4-3.3 4.8-.7Z"/>
                        </svg>
                        <span class="nav-label">Explore</span>
                    </a></li>
                    <li><a href="map.html" class="nav-item" data-nav="map">
                        <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 20s5-4.8 5-9a5 5 0 1 0-10 0c0 4.2 5 9 5 9Z"/>
                            <circle cx="12" cy="11" r="1.9"/>
                        </svg>
                        <span class="nav-label">Map</span>
                    </a></li>
                    <li><a href="contacts.html" class="nav-item" data-nav="contacts">
                        <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5.5 4.5h3l1.2 4-2 1.7a14.4 14.4 0 0 0 6.1 6.1l1.7-2 4 1.2v3a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 4 5.9 1.4 1.4 0 0 1 5.5 4.5Z"/>
                        </svg>
                        <span class="nav-label">Contacts</span>
                    </a></li>
                    <li><a href="about.html" class="nav-item" data-nav="about">
                        <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="8.5"/>
                            <path d="M12 10v5"/>
                            <path d="M12 7v.01"/>
                        </svg>
                        <span class="nav-label">About</span>
                    </a></li>
                </ul>
            </nav>
            <div class="nav-weather" id="navWeather" aria-label="Current weather in Dapitan">
                <div class="weather-icon" id="weatherIcon"></div>
                <div class="weather-temp" id="weatherTemp">--°</div>
                <div class="weather-info">
                    <span class="weather-city">Dapitan</span>
                    <span class="weather-label">City</span>
                </div>
            </div>
        </div>
    `;

    const topBar = mountPoint.querySelector('.top-bar-container');
    const navLinks = mountPoint.querySelector('.nav-links');
    const currentPage = document.body?.dataset.page || 'home';
    const navItems = Array.from(mountPoint.querySelectorAll('[data-nav]'));
    const navStateStorageKey = 'dapitan-active-nav';

    function normalizeNavbarShell() {
        if (!topBar) {
            return;
        }

        topBar.style.opacity = '1';
        topBar.style.visibility = 'visible';
        topBar.style.pointerEvents = '';
        topBar.style.transform = 'translateX(-50%)';
        topBar.style.animation = 'none';
    }

    function getActiveItem() {
        return navItems.find(item => item.classList.contains('active')) || null;
    }

    function isDesktopTextNav() {
        return window.innerWidth > 767.98;
    }

    function hideActivePill() {
        if (!navLinks) {
            return;
        }

        navLinks.style.setProperty('--active-pill-opacity', '0');
        navLinks.style.setProperty('--active-pill-width', '0px');
        navLinks.style.setProperty('--active-pill-x', '0px');
    }

    function setActivePill(item, immediate = false) {
        if (!navLinks || !item || !isDesktopTextNav()) {
            hideActivePill();
            return;
        }

        const linksRect = navLinks.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        if (!linksRect.width || !itemRect.width) {
            return;
        }

        navLinks.classList.toggle('pill-no-transition', immediate);
        navLinks.style.setProperty('--active-pill-width', `${itemRect.width}px`);
        navLinks.style.setProperty('--active-pill-x', `${itemRect.left - linksRect.left}px`);
        navLinks.style.setProperty('--active-pill-opacity', '1');
    }

    function syncActivePill(options = {}) {
        const { animateFromStored = false, immediate = false } = options;
        const activeItem = getActiveItem();

        if (!activeItem || !isDesktopTextNav()) {
            hideActivePill();
            return;
        }

        if (animateFromStored && navLinks) {
            const previousNavKey = window.sessionStorage.getItem(navStateStorageKey);
            const previousItem = previousNavKey
                ? navItems.find(item => item.dataset.nav === previousNavKey)
                : null;

            if (previousItem && previousItem !== activeItem) {
                setActivePill(previousItem, true);
                requestAnimationFrame(() => {
                    navLinks.classList.remove('pill-no-transition');
                    requestAnimationFrame(() => {
                        setActivePill(activeItem);
                    });
                });
                window.sessionStorage.setItem(navStateStorageKey, activeItem.dataset.nav);
                return;
            }
        }

        setActivePill(activeItem, immediate);
        window.sessionStorage.setItem(navStateStorageKey, activeItem.dataset.nav);

        if (immediate && navLinks) {
            requestAnimationFrame(() => {
                navLinks.classList.remove('pill-no-transition');
            });
        }
    }

    function syncActiveState(options = {}) {
        const isHome = currentPage === 'home';
        const routeHash = window.location.hash;
        const exploreOpen = isHome && (routeHash === '#explore' || document.body.classList.contains('explore-open'));

        let activeNav = currentPage;
        if (exploreOpen) {
            activeNav = 'explore';
        }

        navItems.forEach(item => {
            const isActive = item.dataset.nav === activeNav;
            item.classList.toggle('active', isActive);
            if (isActive) {
                item.setAttribute('aria-current', 'page');
            } else {
                item.removeAttribute('aria-current');
            }
        });

        syncActivePill(options);
    }

    syncActiveState({ animateFromStored: true, immediate: true });
    window.addEventListener('hashchange', () => syncActiveState());
    window.addEventListener('resize', () => syncActivePill({ immediate: true }));
    window.addEventListener('pageshow', event => {
        normalizeNavbarShell();
        if (event.persisted) {
            syncActiveState({ immediate: true });
        }
    });

    if (document.body) {
        const stateObserver = new MutationObserver(() => syncActiveState());
        stateObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

})();
