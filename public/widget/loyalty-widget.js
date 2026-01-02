/**
 * İkas Loyalty Widget - Floating Badge
 * Lightweight vanilla JavaScript widget for customer-facing loyalty display
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

    // Initialize widget
    function init() {
        // Get customer ID from İkas (you'll need to implement this based on İkas's customer detection)
        customerId = getIkasCustomerId();

        if (!customerId) {
            console.log('[Loyalty Widget] No customer logged in');
            renderLoggedOutState();
            return;
        }

        // Fetch loyalty data
        fetchLoyaltyData();

        // Auto-expand if configured
        if (CONFIG.autoExpand) {
            setTimeout(() => toggleExpand(), 1000);
        }
    }

    // Get İkas customer ID (This needs to be implemented based on İkas's system)
    function getIkasCustomerId() {
        // Method 1: From İkas App Bridge (if available)
        if (window.IKasAppBridge && window.IKasAppBridge.getCustomer) {
            const customer = window.IKasAppBridge.getCustomer();
            return customer?.id;
        }

        // Method 2: From cookie/localStorage (merchant-specific)
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
            // Redirect to login or show login modal
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
        const primaryColor = widgetData.settings?.primaryColor || '#4F46E5';
        const label = widgetData.settings?.label || 'Puan';

        widget.innerHTML = `
            ${renderCollapsedView()}
            ${renderExpandedView()}
        `;

        // Apply theme color
        widget.style.setProperty('--loyalty-primary-color', primaryColor);

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

    // Render collapsed badge view
    function renderCollapsedView() {
        const tierEmoji = getTierEmoji(widgetData.tier);
        const label = widgetData.settings?.label || 'Puan';

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
        const label = widgetData.settings?.label || 'Puan';

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
                    <div class="loyalty-stat">
                        <div class="stat-label">${label}</div>
                        <div class="stat-value">${formatNumber(widgetData.points)}</div>
                    </div>

                    <div class="loyalty-stat">
                        <div class="stat-label">Seviye</div>
                        <div class="stat-value">${widgetData.tier}</div>
                    </div>

                    ${widgetData.nextTier ? `
                        <div class="loyalty-progress">
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
                        <div class="loyalty-redeem">
                            <div class="redeem-info">
                                <span>Kullanılabilir:</span>
                                <span class="redeem-value">${widgetData.redeemValue.toFixed(2)}₺</span>
                            </div>
                            <button class="loyalty-redeem-btn">
                                ${label} Kullan
                            </button>
                        </div>
                    ` : `
                        <div class="loyalty-info">
                            Puan kullanmak için minimum ${widgetData.settings?.burnRatio || 100} puana ihtiyacınız var.
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
        widget.className = `loyalty-widget loyalty-widget-${CONFIG.position}`;
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
            } else {
                badge.classList.remove('hidden');
                expanded.classList.add('hidden');
            }
        }
    }

    // Open redemption modal
    function openRedeemModal() {
        // For now, redirect to redemption page or show alert
        // In full implementation, this would open a modal for point redemption
        const redeemUrl = `${CONFIG.apiBaseUrl}/loyalty/redeem`;

        if (confirm(`${widgetData.maxRedeemablePoints} puan kullanarak ${widgetData.redeemValue.toFixed(2)}₺ indirim almak ister misiniz?`)) {
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

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
