
(function () {
    console.log("Ikas Loyalty Widget Loading...");

    // Configuration
    const API_BASE_URL = 'http://localhost:3000/api/loyalty'; // Change to production URL later

    // In a real Ikas theme, the customer ID is usually available in a global JS object like `window.ikas.customer.id`
    // For this demo, we will check for a global variable or fall back to a prompt/mock if not found.
    const getCustomerId = () => {
        if (window.params && window.params.customerId) return window.params.customerId;
        // Fallback for testing: Look for a query param ?customerId=...
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('customerId');
    };

    const customerId = getCustomerId();

    if (!customerId) {
        console.log("No customer logged in (or ID not found). Loyalty widget hidden.");
        return;
    }

    // Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .ikas-loyalty-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 50px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            font-family: -apple-system, system-ui, sans-serif;
            cursor: pointer;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: transform 0.2s;
        }
        .ikas-loyalty-widget:hover {
            transform: scale(1.05);
        }
        .ikas-loyalty-points {
            font-weight: bold;
            font-size: 16px;
        }
        .ikas-loyalty-icon {
            font-size: 20px;
        }
    `;
    document.head.appendChild(style);

    // Create Widget Element
    const widget = document.createElement('div');
    widget.className = 'ikas-loyalty-widget';
    widget.innerHTML = `
        <span class="ikas-loyalty-icon">🎁</span>
        <span id="ikas-loyalty-text">Loading...</span>
    `;
    widget.onclick = () => {
        alert("Loyalty Panel coming soon! Your ID: " + customerId);
    };
    document.body.appendChild(widget);

    // Fetch Data
    fetch(`${API_BASE_URL}/profile?customerId=${customerId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.profile) {
                const textEl = document.getElementById('ikas-loyalty-text');
                textEl.innerText = `${data.profile.pointsBalance} Points`;

                // Optional: Change color based on Tier
                if (data.profile.tier === 'Gold' || data.profile.tier === 'Platinum') {
                    widget.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                }
            } else {
                widget.innerText = 'Join Loyalty';
            }
        })
        .catch(err => {
            console.error("Loyalty Widget Error:", err);
            widget.style.display = 'none';
        });

})();
