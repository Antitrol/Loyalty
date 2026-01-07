/**
 * İkas Loyalty Widget - Enhanced Version
 * Theme System, Animations & Style Variants
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        apiBaseUrl: window.IKAS_LOYALTY_CONFIG?.apiUrl || '',
        position: window.IKAS_LOYALTY_CONFIG?.position || 'bottom-right',
        autoExpand: window.IKAS_LOYALTY_CONFIG?.autoExpand || false,
    };

    // Widget State
    let widgetData = null;
    let isExpanded = false;
    let customerId = null;
    let widgetSettings = {};

    // Initialize widget
    function init() {
        // Get customer ID from İkas
        customerId = getIkasCustomerId();

        if (!customerId) {
            console.log('[Loyalty Widget] No customer logged in');
            renderLoggedOutState();
            return;
        }

        // Fetch loyalty data
        fetchLoyaltyData();

        // Auto-expand if configured
        if (CONFIG.autoExpand || widgetSettings.autoExpand) {
            setTimeout(() => toggleExpand(), 1000);
        }
    }

    // Get İkas customer ID
    function getIkasCustomerId() {
        // Method 1: From İkas App Bridge
        if (window.IKasAppBridge && window.IKasAppBridge.getCustomer) {
            const customer = window.IKasAppBridge.getCustomer();
            return customer?.id;
        }

        // Method 2: From localStorage
        const customerData = localStorage.getItem('ikas_customer');
        if (customerData) {
            try {
                const parsed = JSON.parse(customerData);
                return parsed.id;
            } catch (e) {
                console.error('[Loyalty Widget] Failed to parse customer data:', e);
            }
        }

        // Method 3: From URL parameter (for testing)
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('customerId');
    }

    // Fetch loyalty data from API
    async function fetchLoyaltyData() {
        try {
            const response = await fetch(
                `${CONFIG.apiBaseUrl}/api/widget/profile?customerId=${customerId}`
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            widgetData = await response.json();
            widgetSettings = widgetData.settings || {};
            render();
        } catch (error) {
            console.error('[Loyalty Widget] Failed to fetch data:', error);
            renderErrorState();
        }
    }

    // Render logged out state
    function renderLoggedOutState() {
        const widget = createWidgetElement();
        widget.innerHTML = `
            <div class="loyalty-widget-badge" data-state="logged-out">
                <div class="loyalty-icon">🎁</div>
                <div class="loyalty-text">
                    <div class="loyalty-label">Sadakat</div>
                    <div class="loyalty-cta">Giriş Yap</div>
                </div>
            </div>
        `;
        widget.onclick = () => {
            window.location.href = '/account/login';
        };
        document.body.appendChild(widget);
    }

    // Render error state
    function renderErrorState() {
        const widget = createWidgetElement();
        widget.innerHTML = `
            <div class="loyalty-widget-badge" data-state="error">
                <div class="loyalty-icon">⚠️</div>
                <div class="loyalty-text">
                    <div class="loyalty-label">Hata</div>
                </div>
            </div>
        `;
        document.body.appendChild(widget);
    }

    // Render widget with data
    function render() {
        if (!widgetData) return;

        const widget = createWidgetElement();

        // Apply settings
        applyWidgetSettings(widget);

        widget.innerHTML = `
            ${renderCollapsedView()}
            ${renderExpandedView()}
        `;

        // Apply theme colors
        const primaryColor = widgetSettings.primaryColor || '#4F46E5';
        const secondaryColor = widgetSettings.secondaryColor || '#818CF8';
        const borderRadius = widgetSettings.borderRadius || 16;

        widget.style.setProperty('--loyalty-primary-color', primaryColor);
        widget.style.setProperty('--loyalty-secondary-color', secondaryColor);
        widget.style.setProperty('--loyalty-border-radius', `${borderRadius}px`);

        // Set shadow intensity
        const shadowIntensity = widgetSettings.shadowIntensity || 'medium';
        if (shadowIntensity === 'low') {
            widget.style.setProperty('--loyalty-shadow-medium', 'var(--loyalty-shadow-low)');
        } else if (shadowIntensity === 'high') {
            widget.style.setProperty('--loyalty-shadow-medium', 'var(--loyalty-shadow-high)');
        }

        // Add event listeners
        const badge = widget.querySelector('.loyalty-widget-badge');
        const closeBtn = widget.querySelector('.loyalty-close');
        const redeemBtn = widget.querySelector('.loyalty-redeem-btn');

        if (badge) {
            badge.onclick = () => toggleExpand();
        }

        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                toggleExpand();
            };
        }

        if (redeemBtn && widgetData.canRedeem) {
            redeemBtn.onclick = (e) => {
                e.stopPropagation();
                openRedeemModal();
            };
        }

        document.body.appendChild(widget);
    }

    // Apply widget settings
    function applyWidgetSettings(widget) {
        const theme = widgetSettings.theme || 'light';
        const style = widgetSettings.style || 'default';
        const position = widgetSettings.position || CONFIG.position;
        const animations = widgetSettings.animations !== false;

        widget.setAttribute('data-theme', theme);
        widget.setAttribute('data-style', style);
        widget.setAttribute('data-animations', animations);
        widget.className = `loyalty-widget loyalty-widget-${position}`;
    }

    // Render collapsed badge view
    function renderCollapsedView() {
        const tierEmoji = getTierEmoji(widgetData.tier);
        const label = widgetSettings.label || 'Puan';
        const style = widgetSettings.style || 'default';

        // Different renders based on style
        if (style === 'minimal') {
            return `
                <div class="loyalty-widget-badge ${isExpanded ? 'hidden' : ''}" data-state="collapsed">
                    <div class="loyalty-icon">${tierEmoji}</div>
                    <div class="loyalty-points">${formatNumber(widgetData.points)}</div>
                </div>
            `;
        }

        if (style === 'compact') {
            return `
                <div class="loyalty-widget-badge ${isExpanded ? 'hidden' : ''}" data-state="collapsed">
                    <div class="loyalty-icon">${tierEmoji}</div>
                    <div class="loyalty-points">${formatNumber(widgetData.points)}</div>
                    <div class="loyalty-label">${label}</div>
                </div>
            `;
        }

        // Default and card styles
        return `
            <div class="loyalty-widget-badge ${isExpanded ? 'hidden' : ''}" data-state="collapsed">
                <div class="loyalty-icon">${tierEmoji}</div>
                <div class="loyalty-text">
                    <div class="loyalty-points">${formatNumber(widgetData.points)}</div>
                    <div class="loyalty-label">${label}</div>
                </div>
            </div>
        `;
    }

    // Render expanded view
    function renderExpandedView() {
        const tierEmoji = getTierEmoji(widgetData.tier);
        const label = widgetSettings.label || 'Puan';

        return `
            <div class="loyalty-widget-expanded ${!isExpanded ? 'hidden' : ''}" data-state="expanded">
                <div class="loyalty-header">
                    <div class="loyalty-title">
                        <span class="loyalty-icon-large">${tierEmoji}</span>
                        <span>Sadakat ${label}ın</span>
                    </div>
                    <button class="loyalty-close">×</button>
                </div>

                <div class="loyalty-body">
                    <div class="loyalty-stat loyalty-animate-fadein">
                        <div class="stat-label">${label}</div>
                        <div class="stat-value">${formatNumber(widgetData.points)}</div>
                    </div>

                    <div class="loyalty-stat loyalty-animate-fadein">
                        <div class="stat-label">Seviye</div>
                        <div class="stat-value">${widgetData.tier}</div>
                    </div>

                    ${widgetData.nextTier ? `
                        <div class="loyalty-progress loyalty-animate-fadein">
                            <div class="progress-header">
                                <span>İlerleme</span>
                                <span>${widgetData.nextTier.pointsNeeded} ${label} kaldı</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${widgetData.nextTier.progress}%"></div>
                            </div>
                            <div class="progress-label">${widgetData.nextTier.name} seviyesine</div>
                        </div>
                    ` : ''}

                    ${widgetData.canRedeem ? `
                        <div class="loyalty-redeem loyalty-animate-fadein">
                            <div class="redeem-info">
                                <span>Kullanılabilir:</span>
                                <span class="redeem-value">${widgetData.redeemValue.toFixed(2)}₺</span>
                            </div>
                            <button class="loyalty-redeem-btn">
                                ${label} Kullan
                            </button>
                        </div>
                    ` : `
                        <div class="loyalty-info loyalty-animate-fadein">
                            Puan kullanmak için minimum ${widgetSettings.burnRatio || 100} puana ihtiyacınız var.
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    // Create widget container element
    function createWidgetElement() {
        // Remove existing widget if any
        const existing = document.getElementById('ikas-loyalty-widget');
        if (existing) {
            existing.remove();
        }

        const widget = document.createElement('div');
        widget.id = 'ikas-loyalty-widget';
        widget.className = 'loyalty-widget'; // Ensure base class is set immediately
        return widget;
    }

    // Toggle expand/collapse
    function toggleExpand() {
        isExpanded = !isExpanded;

        const badge = document.querySelector('.loyalty-widget-badge');
        const expanded = document.querySelector('.loyalty-widget-expanded');

        if (badge && expanded) {
            if (isExpanded) {
                badge.classList.add('hidden');
                expanded.classList.remove('hidden');

                // Trigger animations for staggered effect
                const animatedElements = expanded.querySelectorAll('.loyalty-animate-fadein');
                animatedElements.forEach((el, index) => {
                    el.style.animationDelay = `${index * 0.1}s`;
                });
            } else {
                badge.classList.remove('hidden');
                expanded.classList.add('hidden');
            }
        }
    }

    // Open redemption modal
    function openRedeemModal() {
        const label = widgetSettings.label || 'Puan';
        const redeemUrl = `${CONFIG.apiBaseUrl}/loyalty/redeem`;

        if (confirm(`${widgetData.maxRedeemablePoints} ${label} kullanarak ${widgetData.redeemValue.toFixed(2)}₺ indirim almak ister misiniz?`)) {
            window.location.href = redeemUrl;
        }
    }

    // Utility: Get tier emoji
    function getTierEmoji(tier) {
        const emojis = {
            'Standard': '⭐',
            'Bronze': '🥉',
            'Silver': '🥈',
            'Gold': '🥇',
            'Platinum': '💎'
        };
        return emojis[tier] || '⭐';
    }

    // Utility: Format number with thousands separator
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Utility: Animate number changes
    function animateNumber(element, start, end, duration = 500) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = formatNumber(Math.floor(current));
        }, 16);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
