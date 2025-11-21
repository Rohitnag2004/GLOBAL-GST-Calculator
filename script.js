/* main script (tax logic) merged with uploaded cursor script behavior */

/* -------------------------
   Tax data & state (expanded countries)
--------------------------*/
const taxData = {
    india: {
        name: "India - Goods and Services Tax (GST)",
        currency: "₹",
        description: "GST in India. Representative rates shown.",
        rates: [
            { label: "Nil Rate", value: 0, desc: "Essential items" },
            { label: "Standard 5%", value: 5, desc: "Reduced" },
            { label: "Standard 12%", value: 12, desc: "Standard" },
            { label: "Standard 18%", value: 18, desc: "Most goods/services" },
            { label: "Standard 28%", value: 28, desc: "Luxury items" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    },
    usa: {
        name: "United States - Sales Tax (varies by state/locality)",
        currency: "$",
        description: "Sales tax varies widely — pick a state/county or use Custom Rate.",
        rates: [
            { label: "No Sales Tax (some states)", value: 0, desc: "AK, DE, MT, NH, OR" },
            { label: "Low 4%", value: 4, desc: "Representative low" },
            { label: "Standard 6%", value: 6, desc: "Representative" },
            { label: "Average 7%", value: 7, desc: "Representative" },
            { label: "High 9%", value: 9, desc: "Representative high" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    },
    uk: {
        name: "United Kingdom - Value Added Tax (VAT)",
        currency: "£",
        description: "UK VAT. Representative rates shown.",
        rates: [
            { label: "Zero Rate", value: 0, desc: "Food, children's clothes, books" },
            { label: "Reduced 5%", value: 5, desc: "Reduced" },
            { label: "Standard 20%", value: 20, desc: "Standard" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    },
    australia: {
        name: "Australia - Goods and Services Tax (GST)",
        currency: "A$",
        description: "Australia GST (representative).",
        rates: [
            { label: "Standard 10%", value: 10, desc: "Most goods & services" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    },
    canada: {
        name: "Canada - Goods and Services Tax (GST)",
        currency: "CA$",
        description: "Canada GST (federal) - provinces may add PST/HST.",
        rates: [
            { label: "Federal GST 5%", value: 5, desc: "Federal GST" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    },
    singapore: {
        name: "Singapore - GST",
        currency: "S$",
        description: "Singapore GST (representative).",
        rates: [
            { label: "Standard 8%", value: 8, desc: "Representative rate" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    },
    newzealand: {
        name: "New Zealand - GST",
        currency: "NZ$",
        description: "New Zealand GST (representative).",
        rates: [
            { label: "Standard 15%", value: 15, desc: "Representative rate" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    },
    malaysia: {
        name: "Malaysia - SST / GST",
        currency: "RM",
        description: "Malaysia uses SST (or GST historically). Use Custom to set correct value.",
        rates: [
            { label: "Representative 6%", value: 6, desc: "Representative (SST/GST historical)" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    },
    southafrica: {
        name: "South Africa - VAT",
        currency: "R",
        description: "South Africa VAT (representative).",
        rates: [
            { label: "Standard 15%", value: 15, desc: "Standard VAT" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    },
    uae: {
        name: "UAE - VAT",
        currency: "د.إ",
        description: "UAE VAT (representative).",
        rates: [
            { label: "Standard 5%", value: 5, desc: "Standard VAT" },
            { label: "Custom Rate", value: "custom", desc: "Enter your rate" }
        ]
    }
};

let currentCountry = 'india';
let calculationMode = 'exclusive';

/* Mode switching */
function setCalculationMode(mode){
    calculationMode = mode;
    const exclusiveBtn = document.getElementById('exclusive-btn');
    const inclusiveBtn = document.getElementById('inclusive-btn');
    const modeDescription = document.getElementById('mode-description');
    const amountLabel = document.getElementById('amount-label');

    if(mode === 'exclusive'){
        exclusiveBtn.classList.add('active');
        exclusiveBtn.setAttribute('aria-pressed', 'true');
        inclusiveBtn.classList.remove('active');
        inclusiveBtn.setAttribute('aria-pressed', 'false');
        modeDescription.textContent = 'Add tax to the base amount (Price + Tax = Total)';
        amountLabel.textContent = 'Enter Amount (Base Price)';
    } else {
        inclusiveBtn.classList.add('active');
        inclusiveBtn.setAttribute('aria-pressed', 'true');
        exclusiveBtn.classList.remove('active');
        exclusiveBtn.setAttribute('aria-pressed', 'false');
        modeDescription.textContent = 'Extract tax from the total amount (Total - Tax = Base Price)';
        amountLabel.textContent = 'Enter Amount (Total Price Including Tax)';
    }

    document.getElementById('results').classList.remove('active');
}

/* Populate tax rates UI */
function updateTaxRates(){
    const countrySelect = document.getElementById('country');
    currentCountry = countrySelect.value;
    const data = taxData[currentCountry];

    // show/hide region selector for USA
    const regionContainer = document.getElementById('region-container');
    if (currentCountry === 'usa') {
        regionContainer.style.display = 'block';
    } else {
        regionContainer.style.display = 'none';
    }

    const taxRateSelect = document.getElementById('tax-rate');
    taxRateSelect.innerHTML = '';

    data.rates.forEach(rate => {
        const option = document.createElement('option');
        option.value = rate.value;
        option.textContent = rate.label;
        taxRateSelect.appendChild(option);
    });

    const taxInfoBox = document.getElementById('tax-info');
    taxInfoBox.innerHTML = `
        <h3>${data.name}</h3>
        <p style="color: var(--text-secondary); margin-bottom: 15px;">${data.description}</p>
        <div class="tax-rates">
            ${data.rates.filter(r => r.value !== 'custom').map(rate => `
                <div class="tax-rate-item" title="${rate.desc}">
                    <div class="rate-label">${rate.desc}</div>
                    <div class="rate-value">${rate.value}%</div>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('custom-tax-container').classList.remove('active');
    document.getElementById('results').classList.remove('active');
}

/* update region-based rate (example for USA) */
function updateRegionRate(){
    const regionSelect = document.getElementById('region');
    const selected = regionSelect.options[regionSelect.selectedIndex];
    const rate = selected.getAttribute('data-rate');
    if (rate) {
        // set tax-rate dropdown to this value (create or replace)
        const taxRateSelect = document.getElementById('tax-rate');
        // add an option for the region if doesn't exist
        let regionOption = Array.from(taxRateSelect.options).find(o => o.value === rate);
        if (!regionOption) {
            const opt = document.createElement('option');
            opt.value = rate;
            opt.textContent = `${selected.textContent.split('-')[0].trim()} ${rate}%`;
            taxRateSelect.insertBefore(opt, taxRateSelect.firstChild);
            taxRateSelect.value = rate;
        } else {
            taxRateSelect.value = rate;
        }
    }
    handleTaxRateChange();
}

function handleTaxRateChange(){
    const taxRateSelect = document.getElementById('tax-rate');
    const customTaxContainer = document.getElementById('custom-tax-container');
    if (taxRateSelect.value === 'custom') {
        customTaxContainer.classList.add('active');
    } else {
        customTaxContainer.classList.remove('active');
    }
}

/* Calculation logic */
function calculate(){
    const amount = parseFloat(document.getElementById('amount').value);
    const taxRateSelect = document.getElementById('tax-rate');
    let taxRate;

    if (taxRateSelect.value === 'custom') {
        taxRate = parseFloat(document.getElementById('custom-tax').value);
        if (isNaN(taxRate) || taxRate < 0) {
            alert('Please enter a valid custom tax rate');
            return;
        }
    } else {
        taxRate = parseFloat(taxRateSelect.value);
    }

    if (isNaN(amount) || amount < 0) {
        alert('Please enter a valid amount');
        return;
    }

    const currency = taxData[currentCountry].currency || '';
    let baseAmount, taxAmount, totalAmount;

    if (calculationMode === 'exclusive') {
        baseAmount = amount;
        taxAmount = (baseAmount * taxRate) / 100;
        totalAmount = baseAmount + taxAmount;
    } else {
        totalAmount = amount;
        baseAmount = totalAmount / (1 + taxRate / 100);
        taxAmount = totalAmount - baseAmount;
    }

    document.getElementById('base-amount').textContent = `${currency}${baseAmount.toFixed(2)}`;
    document.getElementById('tax-rate-display').textContent = `${taxRate}%`;
    document.getElementById('tax-amount').textContent = `${currency}${taxAmount.toFixed(2)}`;
    document.getElementById('total-amount').textContent = `${currency}${totalAmount.toFixed(2)}`;

    document.getElementById('results').classList.add('active');
}

/* Theme toggle (same as before) */
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

themeToggleBtn.addEventListener('click', toggleTheme);

function toggleTheme(){
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);

    if (newTheme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
}

/* -------------------------
   Cursor follower (adapted from user's uploaded cursor-script.js)
   Referenced: uploaded cursor-script.js
*/
let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
let posX = mouseX, posY = mouseY;
const speed = 0.12;
const cursor = document.getElementById('cursor');

window.addEventListener('mousemove', (e)=> {
  mouseX = e.clientX;
  mouseY = e.clientY;
  // slightly enlarge follower when moving
  if (cursor) {
    cursor.style.width = '18px';
    cursor.style.height = '18px';
  }
});

window.addEventListener('mousedown', ()=> {
  if (cursor) { cursor.style.width = '36px'; cursor.style.height = '36px'; }
});

window.addEventListener('mouseup', ()=> {
  if (cursor) { cursor.style.width = '14px'; cursor.style.height = '14px'; }
});

function animateCursor(){
  posX += (mouseX - posX) * speed;
  posY += (mouseY - posY) * speed;
  if (cursor) {
    cursor.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%)`;
  }
  requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);

/* Init */
updateTaxRates();
setCalculationMode('exclusive');
