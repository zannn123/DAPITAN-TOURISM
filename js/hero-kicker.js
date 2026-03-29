(() => {
    const kicker = document.getElementById('text-kicker');
    const hero = kicker?.closest('.hero');

    if (!kicker || !hero) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        kicker.style.setProperty('--hero-kicker-position', '50% 50%');
        return;
    }

    const animationDuration = 8000;
    let frameId = 0;
    let lastTime = null;
    let elapsed = 0;
    let isVisible = true;

    const updateGradient = progress => {
        kicker.style.setProperty('--hero-kicker-position', `${progress.toFixed(2)}% 50%`);
    };

    const stop = () => {
        if (!frameId) {
            return;
        }

        cancelAnimationFrame(frameId);
        frameId = 0;
        lastTime = null;
    };

    const tick = time => {
        if (document.hidden || !isVisible) {
            stop();
            return;
        }

        if (lastTime === null) {
            lastTime = time;
        }

        elapsed += time - lastTime;
        lastTime = time;

        const fullCycle = animationDuration * 2;
        const cycleTime = elapsed % fullCycle;
        const progress = cycleTime < animationDuration
            ? (cycleTime / animationDuration) * 100
            : 100 - (((cycleTime - animationDuration) / animationDuration) * 100);

        updateGradient(progress);
        frameId = requestAnimationFrame(tick);
    };

    const start = () => {
        if (frameId || document.hidden || !isVisible) {
            return;
        }

        frameId = requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            isVisible = entries.some(entry => entry.isIntersecting);

            if (isVisible) {
                start();
                return;
            }

            stop();
        }, {
            threshold: 0.1
        });

        observer.observe(hero);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stop();
            return;
        }

        start();
    });

    updateGradient(0);
    start();
})();
