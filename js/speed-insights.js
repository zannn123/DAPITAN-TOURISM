/**
 * Vercel Speed Insights Integration
 * Automatically tracks web vitals and performance metrics
 * Documentation: https://vercel.com/docs/speed-insights/quickstart
 */

(function() {
    'use strict';

    // Initialize queue for Speed Insights
    function initQueue() {
        if (window.si) return;
        window.si = function(...params) {
            window.siq = window.siq || [];
            window.siq.push(params);
        };
    }

    // Inject Speed Insights script
    function injectSpeedInsights() {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return;

        // Initialize the queue
        initQueue();

        // Configuration
        const config = {
            src: '/_vercel/speed-insights/script.js',
            dataset: {
                sdkn: '@vercel/speed-insights',
                sdkv: '2.0.0'
            }
        };

        // Check if script is already loaded
        if (document.head.querySelector('script[src*="' + config.src + '"]')) {
            return;
        }

        // Create and configure the script element
        const script = document.createElement('script');
        script.src = config.src;
        script.defer = true;

        // Set data attributes
        for (const [key, value] of Object.entries(config.dataset)) {
            script.dataset[key] = value;
        }

        // Add error handler
        script.onerror = function() {
            console.log(
                '[Vercel Speed Insights] Failed to load script from ' + config.src + 
                '. Please check if any content blockers are enabled and try again.'
            );
        };

        // Append to head
        document.head.appendChild(script);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSpeedInsights);
    } else {
        // DOM is already ready
        injectSpeedInsights();
    }
})();
