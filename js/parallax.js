(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const titleLayerIds = new Set(['text', 'text-hollow', 'text-kicker']);
    const layers = [
        { element: document.getElementById('back'), mouseSpeed: -0.2, scrollSpeed: 0.4 },
        { element: document.getElementById('text'), mouseSpeed: 0.5, scrollSpeed: -0.2 },
        { element: document.getElementById('front'), mouseSpeed: 1.2, scrollSpeed: 0 },
        { element: document.getElementById('text-kicker'), mouseSpeed: 0.5, scrollSpeed: -0.2 },
        { element: document.getElementById('text-hollow'), mouseSpeed: 0.5, scrollSpeed: -0.2 }
    ].filter(layer => layer.element);
    const scrollLayers = [...document.querySelectorAll('[data-scroll-parallax]')];
    const hoverScenes = canHover && !prefersReducedMotion
        ? [...document.querySelectorAll('[data-parallax-scene]')].map(scene => ({
        scene,
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
        layers: [...scene.querySelectorAll('[data-hover-parallax]')]
    }))
        : [];

    if (!layers.length && !scrollLayers.length && !hoverScenes.length) {
        return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let targetScroll = window.scrollY;
    let currentScroll = window.scrollY;
    let frameRequested = false;
    const settleThreshold = 0.12;

    function requestFrame() {
        if (frameRequested) {
            return;
        }

        frameRequested = true;
        requestAnimationFrame(renderFrame);
    }

    if (canHover && layers.length && !prefersReducedMotion) {
        document.addEventListener('mousemove', event => {
            targetX = (window.innerWidth / 2 - event.pageX) / 100;
            targetY = (window.innerHeight / 2 - event.pageY) / 100;
            requestFrame();
        });
    }

    window.addEventListener('scroll', () => {
        targetScroll = window.scrollY;
        requestFrame();
    }, { passive: true });

    window.addEventListener('resize', requestFrame, { passive: true });

    hoverScenes.forEach(state => {
        state.scene.addEventListener('mousemove', event => {
            const rect = state.scene.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return;
            }

            state.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            state.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
            requestFrame();
        });

        state.scene.addEventListener('mouseleave', () => {
            state.targetX = 0;
            state.targetY = 0;
            requestFrame();
        });
    });

    function updateScrollParallax() {
        scrollLayers.forEach(layer => {
            const speed = Number.parseFloat(layer.dataset.scrollParallax);
            if (Number.isNaN(speed)) {
                return;
            }

            const scene = layer.closest('[data-parallax-scene]') || layer;
            const rect = scene.getBoundingClientRect();
            const progress = ((window.innerHeight - rect.top) / (window.innerHeight + rect.height)) - 0.5;
            const offset = progress * window.innerHeight * speed;

            layer.style.setProperty('--scroll-parallax-offset', `${offset.toFixed(2)}px`);
        });
    }

    function updateHoverParallax() {
        let shouldContinue = false;

        hoverScenes.forEach(state => {
            state.currentX += (state.targetX - state.currentX) * 0.08;
            state.currentY += (state.targetY - state.currentY) * 0.08;

            if (
                Math.abs(state.targetX - state.currentX) > settleThreshold ||
                Math.abs(state.targetY - state.currentY) > settleThreshold
            ) {
                shouldContinue = true;
            }

            state.layers.forEach(layer => {
                const depth = Number.parseFloat(layer.dataset.hoverParallax);
                if (Number.isNaN(depth)) {
                    return;
                }

                layer.style.setProperty('--hover-parallax-x', `${(state.currentX * depth).toFixed(2)}px`);
                layer.style.setProperty('--hover-parallax-y', `${(state.currentY * depth).toFixed(2)}px`);
            });
        });

        return shouldContinue;
    }

    function renderFrame() {
        frameRequested = false;

        let shouldContinue = false;

        currentX += (targetX - currentX) * 0.04;
        currentY += (targetY - currentY) * 0.04;
        currentScroll += (targetScroll - currentScroll) * 0.06;

        if (
            Math.abs(targetX - currentX) > settleThreshold ||
            Math.abs(targetY - currentY) > settleThreshold ||
            Math.abs(targetScroll - currentScroll) > settleThreshold
        ) {
            shouldContinue = true;
        }

        layers.forEach(layer => {
            const moveX = currentX * layer.mouseSpeed;
            const moveY = (currentY * layer.mouseSpeed) + (currentScroll * layer.scrollSpeed);

            if (titleLayerIds.has(layer.element.id)) {
                const opacity = Math.max(1 - (currentScroll / 500), 0);
                layer.element.style.opacity = opacity;
                layer.element.style.transform = `translate3d(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px), 0)`;
            } else {
                layer.element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(1.02)`;
            }
        });

        updateScrollParallax();
        shouldContinue = updateHoverParallax() || shouldContinue;

        if (shouldContinue) {
            requestFrame();
        }
    }

    updateScrollParallax();
    requestFrame();
})();
