(() => {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    const idle = callback => {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(callback, { timeout: 2000 });
            return;
        }

        window.setTimeout(callback, 900);
    };

    const afterWindowLoad = callback => {
        if (document.readyState === 'complete') {
            callback();
            return;
        }

        window.addEventListener('load', callback, { once: true });
    };

    function requestVideoPlay(video) {
        if (!video) {
            return;
        }

        const tryPlay = () => {
            const playAttempt = video.play();
            if (playAttempt && typeof playAttempt.catch === 'function') {
                playAttempt.catch(() => {});
            }
        };

        tryPlay();
        video.addEventListener('loadeddata', tryPlay, { once: true });
        video.addEventListener('canplay', tryPlay, { once: true });
    }

    function activateVideo(video) {
        if (!video || video.dataset.loaded === 'true') {
            return;
        }

        const sources = video.querySelectorAll('source[data-src]');
        if (!sources.length && !video.dataset.src) {
            return;
        }

        if (video.dataset.src) {
            video.src = video.dataset.src;
            video.removeAttribute('data-src');
        }

        sources.forEach(source => {
            source.src = source.dataset.src;
            source.removeAttribute('data-src');
        });

        video.dataset.loaded = 'true';
        video.load();

        if (video.autoplay) {
            requestVideoPlay(video);
        }
    }

    function activateIframe(iframe) {
        if (!iframe || iframe.dataset.loaded === 'true') {
            return;
        }

        const src = iframe.dataset.deferredSrc;
        if (!src) {
            return;
        }

        iframe.src = src;
        iframe.dataset.loaded = 'true';
    }

    function setupDeferredVideos() {
        const videos = Array.from(document.querySelectorAll('video[data-deferred-media="true"]'));
        if (!videos.length) {
            return;
        }

        const observer = 'IntersectionObserver' in window
            ? new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    activateVideo(entry.target);
                    observer.unobserve(entry.target);
                });
            }, { rootMargin: '260px 0px' })
            : null;

        videos.forEach(video => {
            if (video.dataset.loadStrategy === 'hero') {
                window.requestAnimationFrame(() => activateVideo(video));
                return;
            }

            if (video.dataset.loadStrategy === 'delayed') {
                afterWindowLoad(() => {
                    window.setTimeout(() => activateVideo(video), 3200);
                });
                return;
            }

            if (video.dataset.loadStrategy === 'idle') {
                idle(() => activateVideo(video));
                return;
            }

            if (observer) {
                const rect = video.getBoundingClientRect();
                if (rect.bottom >= -260 && rect.top <= window.innerHeight + 260) {
                    activateVideo(video);
                    return;
                }
            }

            if (observer) {
                observer.observe(video);
                return;
            }

            idle(() => activateVideo(video));
        });
    }

    function setupDeferredIframes() {
        const iframes = Array.from(document.querySelectorAll('iframe[data-deferred-src]'));
        if (!iframes.length) {
            return;
        }

        const intersectionIframes = [];

        iframes.forEach(iframe => {
            if (iframe.dataset.loadStrategy === 'delayed') {
                afterWindowLoad(() => {
                    window.setTimeout(() => activateIframe(iframe), 900);
                });
                return;
            }

            intersectionIframes.push(iframe);
        });

        if (!('IntersectionObserver' in window)) {
            intersectionIframes.forEach(activateIframe);
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    return;
                }

                activateIframe(entry.target);
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '420px 0px' });

        intersectionIframes.forEach(iframe => observer.observe(iframe));
    }

    function loadElfsight() {
        if (window.__dapitanElfsightLoaded) {
            return;
        }

        const widget = document.querySelector('[data-elfsight-app-lazy]');
        if (!widget) {
            return;
        }

        window.__dapitanElfsightLoaded = true;

        const script = document.createElement('script');
        script.src = 'https://elfsightcdn.com/platform.js';
        script.async = true;
        script.dataset.elfsightLoader = 'true';
        document.body.appendChild(script);
    }

    function setupDeferredElfsight() {
        if (!document.querySelector('[data-elfsight-app-lazy]')) {
            return;
        }

        if (document.querySelector('script[src="https://elfsightcdn.com/platform.js"]')) {
            window.__dapitanElfsightLoaded = true;
            return;
        }

        const initialDelay = isCoarsePointer ? 1800 : 900;
        const interactionDelay = isCoarsePointer ? 250 : 120;
        let queued = false;
        const queueLoad = (delay = 0) => {
            if (queued) {
                return;
            }

            queued = true;
            window.setTimeout(() => idle(loadElfsight), delay);
        };

        afterWindowLoad(() => {
            queueLoad(initialDelay);
        });

        ['pointerdown', 'touchstart', 'keydown'].forEach(eventName => {
            window.addEventListener(eventName, () => {
                queueLoad(interactionDelay);
            }, { once: true, passive: true });
        });

        window.addEventListener('pageshow', () => {
            queueLoad(interactionDelay);
        }, { once: true });
    }

    setupDeferredVideos();
    setupDeferredIframes();
    setupDeferredElfsight();

    window.addEventListener('pageshow', () => {
        document.querySelectorAll('video[data-deferred-media="true"]').forEach(video => {
            if (video.dataset.loaded === 'true' && video.autoplay && video.paused) {
                requestVideoPlay(video);
            }
        });
    });
})();
