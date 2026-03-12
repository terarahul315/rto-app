// ===== 1. FIREBASE CONFIG (सबसे ऊपर) =====
const firebaseConfig = {
    apiKey: "AIzaSy...",  // 🔴 अपनी Config यहाँ डालो
    authDomain: "rto-insight-pro.firebaseapp.com",
    projectId: "rto-insight-pro",
    storageBucket: "rto-insight-pro.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};

// Initialize Firebase (पहले Initialize करो)
firebase.initializeApp(firebaseConfig);
console.log('🔥 Firebase Initialized');

// ===== 2. ग्लोबल वेरिएबल्स =====
let currentData = null;

// ===== 3. डोम एलिमेंट्स =====
const vehicleInput = document.getElementById('vehicleNumber');
const loading = document.getElementById('loading');
const resultContainer = document.getElementById('resultContainer');
const errorContainer = document.getElementById('errorContainer');
const rcNumber = document.getElementById('rcNumber');
const ownerName = document.getElementById('ownerName');
const vehicleDetails = document.getElementById('vehicleDetails');
const challanSection = document.getElementById('challanSection');
const challanDetails = document.getElementById('challanDetails');
const errorMessage = document.getElementById('errorMessage');

// ===== 4. एंटर की सपोर्ट =====
vehicleInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getVehicleInfo();
    }
});

// ===== 5. मेन फंक्शन =====
async function getVehicleInfo() {
    // गाड़ी नंबर लो
    const number = vehicleInput.value.trim().toUpperCase();
    
    // वैलिडेशन
    if (!number) {
        showError('कृपया गाड़ी का नंबर डालें!');
        return;
    }
    
    if (number.length < 8 || number.length > 10) {
        showError('सही नंबर डालें! (जैसे: UP16CD1993)');
        return;
    }
    
    // पिछले रिजल्ट छुपाओ
    resultContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    
    // लोडिंग दिखाओ
    loading.style.display = 'block';
    
    // ===== API कॉल =====
    const url = 'https://rto-vehicle-information-india.p.rapidapi.com/getVehicleChallan';
    const apiKey = '6d7214e520mshdf6559c2467fb56p1f8099jsndea556eca5db';
    
    const requestBody = {
        vehicle_no: number,
        consent: "Y",
        consent_text: "I hereby give my consent for Eccentric Labs API to fetch my information"
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'rto-vehicle-information-india.p.rapidapi.com',
                'x-rapidapi-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        
        loading.style.display = 'none';
        
        if (data && !data.error) {
            displayResult(data, number);
        } else {
            showError(data.message || 'गाड़ी का नंबर सही नहीं है');
        }
        
    } catch (error) {
        loading.style.display = 'none';
        console.error('Error:', error);
        showError('कुछ गड़बड़ हुई! इंटरनेट चेक करो');
    }
}

// ===== 6. रिजल्ट दिखाने का फंक्शन =====
function displayResult(data, number) {
    currentData = data;
    resultContainer.style.display = 'block';
    rcNumber.textContent = number;
    
    const owner = data.owner_name || data.owner || data.ownerName || data.vehicle_owner || 'उपलब्ध नहीं';
    ownerName.textContent = owner;
    
    const details = [
        {
            icon: 'fa-calendar-alt',
            label: 'रजिस्ट्रेशन तारीख',
            value: formatDate(data.registration_date || data.reg_date || data.registrationDate)
        },
        {
            icon: 'fa-car',
            label: 'मॉडल',
            value: data.model || data.vehicle_model || data.vehicleModel || 'उपलब्ध नहीं'
        },
        {
            icon: 'fa-gas-pump',
            label: 'ईंधन प्रकार',
            value: data.fuel_type || data.fuelType || data.fuel || 'उपलब्ध नहीं'
        },
        {
            icon: 'fa-industry',
            label: 'निर्माता',
            value: data.manufacturer || data.maker || data.make || 'उपलब्ध नहीं'
        },
        {
            icon: 'fa-shield-alt',
            label: 'बीमा वैध',
            value: formatDate(data.insurance_valid || data.insurance_valid_till || data.insurance)
        },
        {
            icon: 'fa-clipboard-check',
            label: 'PUC वैध',
            value: formatDate(data.puc_valid || data.puc_valid_till || data.puc)
        },
        {
            icon: 'fa-calendar',
            label: 'फिटनेस',
            value: formatDate(data.fitness_valid || data.fitness)
        },
        {
            icon: 'fa-id-card',
            label: 'चेसिस नंबर',
            value: maskSensitiveData(data.chassis_no || data.chassis)
        }
    ];
    
    let detailsHTML = '';
    details.forEach(item => {
        detailsHTML += `
            <div class="detail-cell">
                <div class="cell-label">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.label}</span>
                </div>
                <div class="cell-value">${item.value}</div>
            </div>
        `;
    });
    
    vehicleDetails.innerHTML = detailsHTML;
    
    const challanData = data.challan_details || data.challan || data.challanData || data.challan_info;
    
    if (challanData) {
        challanSection.style.display = 'block';
        
        let challanHTML = '';
        
        if (Array.isArray(challanData) && challanData.length > 0) {
            challanData.forEach((challan, index) => {
                challanHTML += `
                    <div class="challan-item">
                        <span>🚨 चालान #${index + 1}</span>
                        <span>₹${challan.amount || challan.fine || challan.penalty || 'N/A'}</span>
                    </div>
                    <div class="challan-item">
                        <span>📅 तारीख:</span>
                        <span>${formatDate(challan.date || challan.issue_date || challan.challan_date)}</span>
                    </div>
                    <div class="challan-item">
                        <span>📝 कारण:</span>
                        <span>${challan.reason || challan.offence || challan.description || 'N/A'}</span>
                    </div>
                    <div class="challan-item">
                        <span>🏛️ स्थान:</span>
                        <span>${challan.location || challan.place || challan.rto || 'N/A'}</span>
                    </div>
                    <div style="margin: 15px 0; border-top: 1px dashed #ef476f;"></div>
                `;
            });
        } else if (typeof challanData === 'object') {
            challanHTML = `
                <div class="challan-item">
                    <span>💰 जुर्माना:</span>
                    <span>₹${challanData.amount || challanData.fine || challanData.penalty || 'N/A'}</span>
                </div>
                <div class="challan-item">
                    <span>📅 तारीख:</span>
                    <span>${formatDate(challanData.date || challanData.issue_date || challanData.challan_date)}</span>
                </div>
                <div class="challan-item">
                    <span>📝 कारण:</span>
                    <span>${challanData.reason || challanData.offence || challanData.description || 'N/A'}</span>
                </div>
                <div class="challan-item">
                    <span>🏛️ स्थान:</span>
                    <span>${challanData.location || challanData.place || challanData.rto || 'N/A'}</span>
                </div>
            `;
        }
        
        challanDetails.innerHTML = challanHTML;
        
    } else {
        challanSection.style.display = 'none';
    }
}

// ===== 7. एरर दिखाने का फंक्शन =====
function showError(message) {
    errorContainer.style.display = 'block';
    errorMessage.textContent = message;
    resultContainer.style.display = 'none';
}

// ===== 8. रीसेट सर्च =====
function resetSearch() {
    errorContainer.style.display = 'none';
    vehicleInput.value = '';
    vehicleInput.focus();
}

// ===== 9. डेट फॉर्मेट करने का फंक्शन =====
function formatDate(dateString) {
    if (!dateString || dateString === 'N/A' || dateString === 'उपलब्ध नहीं') return 'उपलब्ध नहीं';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('hi-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// ===== 10. सेंसिटिव डेटा छुपाने का फंक्शन =====
function maskSensitiveData(value) {
    if (!value || value === 'N/A' || value === 'उपलब्ध नहीं') return 'उपलब्ध नहीं';
    if (value.length < 8) return '****';
    
    return '****' + value.slice(-4);
}

// ===== 11. गाड़ी नंबर वैलिडेट करने का फंक्शन =====
function validateVehicleNumber(number) {
    const pattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/;
    return pattern.test(number);
}
