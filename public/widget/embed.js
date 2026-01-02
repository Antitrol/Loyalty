/**
 * İkas Loyalty Widget - Embed Script
 * Easy integration script for merchants
 * 
 * Usage:
 * <script>
 *   window.IKAS_LOYALTY_CONFIG = {
 *     apiUrl: 'https://your-app.vercel.app',
 *     position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
 *     autoExpand: false
 *   };
 * </script>
 * <script src="https://your-app.vercel.app/widget/embed.js"></script>
 */

(function () {
    'use strict';

    // Default configuration
    const DEFAULT_CONFIG = {
        apiUrl: '',
        position: 'bottom-right',
        autoExpand: false
    };

    // Merge with user config
    window.IKAS_LOYALTY_CONFIG = Object.assign(
        {},
        DEFAULT_CONFIG,
        window.IKAS_LOYALTY_CONFIG || {}
    );

    // Auto-detect API URL if not provided
    if (!window.IKAS_LOYALTY_CONFIG.apiUrl) {
        const scriptSrc = document.currentScript?.src || '';
        const scriptUrl = new URL(scriptSrc);
        window.IKAS_LOYALTY_CONFIG.apiUrl = scriptUrl.origin;
    }

    const baseUrl = window.IKAS_LOYALTY_CONFIG.apiUrl;

    // Load CSS
    function loadCSS() {
        if (document.getElementById('ikas-loyalty-widget-css')) {
            return; // Already loaded
        }

        const link = document.createElement('link');
        link.id = 'ikas-loyalty-widget-css';
        link.rel = 'stylesheet';
        link.href = `${baseUrl}/widget/loyalty-widget.css`;
        document.head.appendChild(link);
    }

    // Load JavaScript
    function loadJS() {
        if (document.getElementById('ikas-loyalty-widget-js')) {
            return; // Already loaded
        }

        const script = document.createElement('script');
        script.id = 'ikas-loyalty-widget-js';
        script.src = `${baseUrl}/widget/loyalty-widget.js`;
        script.async = true;

        script.onerror = function () {
            console.error('[İkas Loyalty] Failed to load widget script');
        };

        document.body.appendChild(script);
    }

    // Initialize
    function init() {
        console.log('[İkas Loyalty] Initializing widget...', window.IKAS_LOYALTY_CONFIG);
        loadCSS();
        loadJS();
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
