(() => {
    const animatedNodes = Array.from(document.querySelectorAll('[data-animated-gradient]'));
    const kicker = document.getElementById('text-kicker');
    const hero = kicker?.closest('.hero') || null;
    const heroWordmark = document.querySelector('#text .text-main');

    if (!animatedNodes.length && !hero) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        animatedNodes.forEach(node => node.style.setProperty('--animated-gradient-position', '50% 50%'));
    }

    const measureTargets = hero && kicker && heroWordmark
        ? { hero, kicker, heroWordmark }
        : null;

    let layoutFrameId = 0;

    const scheduleHeroLayout = () => {
        if (!measureTargets || layoutFrameId) {
            return;
        }

        layoutFrameId = requestAnimationFrame(syncHeroLayout);
    };

    const syncHeroLayout = () => {
        layoutFrameId = 0;

        if (!measureTargets) {
            return;
        }

        const { hero: heroElement, kicker: kickerElement, heroWordmark: wordmarkElement } = measureTargets;
        heroElement.style.setProperty('--hero-kicker-safe-offset', '0px');

        const viewportWidth = window.visualViewport?.width || window.innerWidth;
        const desiredGap = viewportWidth <= 520 ? 6 : viewportWidth <= 820 ? 8 : 10;
        const wordmarkRect = wordmarkElement.getBoundingClientRect();
        const kickerRect = kickerElement.getBoundingClientRect();
        const overlap = kickerRect.bottom - (wordmarkRect.top - desiredGap);

        if (overlap > 0) {
            heroElement.style.setProperty('--hero-kicker-safe-offset', `${Math.ceil(overlap)}px`);
        }
    };

    if (prefersReducedMotion) {
        scheduleHeroLayout();
        return;
    }

    const items = animatedNodes.map(node => ({
        element: node,
        root: node.closest('.hero, .smart-tourism-banner') || node,
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
    start();

    scheduleHeroLayout();
    window.addEventListener('load', scheduleHeroLayout, { once: true });
    window.addEventListener('resize', scheduleHeroLayout, { passive: true });
    window.addEventListener('orientationchange', scheduleHeroLayout, { passive: true });
    window.addEventListener('pageshow', scheduleHeroLayout);
    window.visualViewport?.addEventListener('resize', scheduleHeroLayout, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleHeroLayout, { passive: true });

    if ('ResizeObserver' in window && measureTargets) {
        const resizeObserver = new ResizeObserver(scheduleHeroLayout);
        resizeObserver.observe(measureTargets.hero);
        resizeObserver.observe(measureTargets.kicker);
        resizeObserver.observe(measureTargets.heroWordmark);
    }

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            scheduleHeroLayout();
            window.setTimeout(scheduleHeroLayout, 120);
            window.setTimeout(scheduleHeroLayout, 420);
            window.setTimeout(scheduleHeroLayout, 960);
        });
    } else {
        window.setTimeout(scheduleHeroLayout, 120);
        window.setTimeout(scheduleHeroLayout, 420);
        window.setTimeout(scheduleHeroLayout, 960);
    }
})();
