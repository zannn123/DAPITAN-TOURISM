(() => {
    const animatedNodes = Array.from(document.querySelectorAll('[data-animated-gradient]'));
    const hero = document.querySelector('.hero');
    const heroTitle = document.getElementById('text');
    const heroTitleMain = heroTitle?.querySelector('.text-main');
    const heroKicker = document.getElementById('text-kicker');

    let heroKickerFrame = 0;

    const readKickerGap = () => {
        if (!hero) {
            return 10;
        }

        const gap = Number.parseFloat(getComputedStyle(hero).getPropertyValue('--hero-kicker-gap'));
        return Number.isFinite(gap) ? gap : 10;
    };

    const syncHeroKickerPosition = () => {
        heroKickerFrame = 0;

        if (!hero || !heroTitle || !heroTitleMain || !heroKicker) {
            return;
        }

        const heroRect = hero.getBoundingClientRect();
        const titleRect = heroTitleMain.getBoundingClientRect();
        const kickerRect = heroKicker.getBoundingClientRect();
        if (!heroRect.width || !titleRect.width || !kickerRect.height) {
            return;
        }

        const gap = readKickerGap();
        const targetLeft = (titleRect.left - heroRect.left) + (titleRect.width / 2);
        const targetTop = (titleRect.top - heroRect.top) - gap - (kickerRect.height / 2);
        const safeTop = Math.max(targetTop, 18 + (kickerRect.height / 2));

        heroKicker.style.left = `${targetLeft.toFixed(2)}px`;
        heroKicker.style.top = `${safeTop.toFixed(2)}px`;
    };

    const requestHeroKickerSync = () => {
        if (!heroKicker || heroKickerFrame) {
            return;
        }

        heroKickerFrame = requestAnimationFrame(syncHeroKickerPosition);
    };

    if (!animatedNodes.length) {
        requestHeroKickerSync();
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        animatedNodes.forEach(node => node.style.setProperty('--animated-gradient-position', '50% 50%'));
        return;
    }

    const items = animatedNodes.map(node => ({
        element: node,
        root: node.closest('.hero, .smart-tourism-banner, .immersive-section') || node,
        duration: Number.parseFloat(node.dataset.gradientSpeed || '8000'),
        elapsed: 0,
        lastTime: null,
        isVisible: true
    }));

    let frameId = 0;

    const updateGradient = (item, progress) => {
        item.element.style.setProperty('--animated-gradient-position', `${progress.toFixed(2)}% 50%`);
    };

    const stop = () => {
        if (!frameId) {
            return;
        }

        cancelAnimationFrame(frameId);
        frameId = 0;
        items.forEach(item => {
            item.lastTime = null;
        });
    };

    const tick = time => {
        if (document.hidden) {
            stop();
            return;
        }

        let hasActiveItem = false;

        items.forEach(item => {
            if (!item.isVisible) {
                item.lastTime = null;
                return;
            }

            if (item.lastTime === null) {
                item.lastTime = time;
            }

            item.elapsed += time - item.lastTime;
            item.lastTime = time;

            const fullCycle = item.duration * 2;
            const cycleTime = item.elapsed % fullCycle;
            const progress = cycleTime < item.duration
                ? (cycleTime / item.duration) * 100
                : 100 - (((cycleTime - item.duration) / item.duration) * 100);

            updateGradient(item, progress);
            hasActiveItem = true;
        });

        if (!hasActiveItem) {
            frameId = 0;
            return;
        }

        frameId = requestAnimationFrame(tick);
    };

    const start = () => {
        if (frameId || document.hidden || !items.some(item => item.isVisible)) {
            return;
        }

        frameId = requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const item = items.find(candidate => candidate.root === entry.target);
                if (!item) {
                    return;
                }

                item.isVisible = entry.isIntersecting;
                if (!entry.isIntersecting) {
                    item.lastTime = null;
                }
            });

            if (items.some(item => item.isVisible)) {
                start();
            } else {
                stop();
            }
        }, {
            threshold: 0.1
        });

        items.forEach(item => observer.observe(item.root));
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stop();
            return;
        }

        start();
    });

    items.forEach(item => updateGradient(item, 0));
    requestHeroKickerSync();

    if (hero && heroTitle && heroTitleMain && heroKicker) {
        window.addEventListener('load', requestHeroKickerSync, { once: true });
        window.addEventListener('resize', requestHeroKickerSync, { passive: true });
        window.addEventListener('orientationchange', requestHeroKickerSync, { passive: true });
        window.addEventListener('pageshow', requestHeroKickerSync);

        heroTitle.addEventListener('animationend', requestHeroKickerSync);
        heroKicker.addEventListener('animationend', requestHeroKickerSync);

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', requestHeroKickerSync, { passive: true });
        }

        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(() => requestHeroKickerSync());
            resizeObserver.observe(hero);
            resizeObserver.observe(heroTitle);
            resizeObserver.observe(heroTitleMain);
            resizeObserver.observe(heroKicker);
        }

        if (document.fonts?.ready) {
            document.fonts.ready.then(() => requestHeroKickerSync()).catch(() => {});
        }

        window.setTimeout(requestHeroKickerSync, 900);
    }

    start();
})();
