// Constants
const MONITORS = ['bcv', 'enparalelovzla', 'promedio'];
const IMAGES = {
    bcv: 'bcv.webp',
    enparalelovzla: 'paralelo.png',
    promedio: 'promedio.webp'
};

// Elements from DOM
const calculatorElements = {
    amountInput: document.getElementById('amount'),
    currencyTypeSelect: document.getElementById('currency-type'),
    exchangeRateSelect: document.getElementById('exchange-rate'),
    customRateInput: document.getElementById('custom-rate'),
    conversionResult: document.getElementById('conversion-result'),
    copyBtn: document.getElementById('copy-btn'),
    copyMessage: document.getElementById('copy-message'),
    errorContainer: document.getElementById('error-container'),
    themeToggle: document.getElementById('theme-toggle')
};

// Create objects for each monitor's elements
const rateCardElements = {};
MONITORS.forEach(id => {
    rateCardElements[id] = {
        image: document.getElementById(`${id}-image`),
        title: document.getElementById(`${id}-title`),
        price: document.getElementById(`${id}-price`),
        lastUpdate: document.getElementById(`${id}-last-update`),
        oldPrice: document.getElementById(`${id}-old-price`),
        change: document.getElementById(`${id}-change`),
        percentage: document.getElementById(`${id}-percentage`)
    };
});

// Variables to store exchange rates
let rates = {
    bcv: null,
    enparalelovzla: null,
    promedio: null
};

/* === NUMBER FORMATTING FUNCTIONS === */
function formatVenezuelanCurrency(value) {
    return parseFloat(value).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/* === INPUT VALIDATION FUNCTIONS === */
function isValidDecimal(value) {
    return /^[0-9]*([.,]{0,1}[0-9]*)?$/.test(value);
}

function hasSingleDecimalSeparator(value) {
    const commaCount = (value.match(/,/g) || []).length;
    const dotCount = (value.match(/\./g) || []).length;
    return commaCount <= 1 && dotCount <= 1 && !(commaCount === 1 && dotCount === 1);
}

function hasMaxDecimalPlaces(value, max = 2) {
    const parts = value.split(',');
    return !(parts.length > 1 && parts[1].length > max);
}

function hasMaxDigits(value, max = 15) {
    return value.replace(/[^0-9]/g, '').length <= max;
}

function displayError(message) {
    calculatorElements.errorContainer.textContent = message;
    calculatorElements.errorContainer.classList.add('show');
}

function clearError() {
    calculatorElements.errorContainer.textContent = '';
    calculatorElements.errorContainer.classList.remove('show');
    calculatorElements.amountInput.classList.remove('invalid');
    calculatorElements.customRateInput.classList.remove('invalid');
}

function handlePaste(event, inputElement) {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    const withoutDots = pastedText.replace(/\./g, '');
    let processedValue = '';
    let commaFound = false;
    let commaIndex = -1;

    // Encontrar la primera coma y su índice en el texto original (sin eliminar puntos)
    const firstCommaOriginalIndex = pastedText.indexOf(',');

    for (let i = 0; i < withoutDots.length && processedValue.replace(/[^0-9]/g, '').length < 14; i++) {
        const char = withoutDots[i];
        if (/[0-9]/.test(char)) {
            processedValue += char;
        } else if (char === ',' && !commaFound) {
            processedValue += char;
            commaFound = true;
            commaIndex = processedValue.length - 1; // Guardar el índice de la coma en el valor procesado
        }
    }

    inputElement.value = processedValue;
    handleInputValue(inputElement); // Trigger input handling for validation
    event.preventDefault(); // Prevent the default paste action
}

function handleInputValue(inputElement) {
    let value = inputElement.value;
    const hasComma = value.includes(',');
    const hasDot = value.includes('.');

    if (!isValidDecimal(value)) {
        inputElement.classList.add('invalid');
        inputElement.value = value.slice(0, -1);
        displayError('Caracter no permitido');
        return;
    }

    // Validar si hay más de un separador decimal
    if (hasComma && hasDot) {
        inputElement.classList.add('invalid');
        inputElement.value = value.slice(0, -1);
        displayError('Solo puede usar un separador decimal');
        return;
    }

    // Normalizar el valor
    inputElement.classList.remove('invalid');
    if (hasDot && !hasComma) {
        value = value.replace('.', ',');
        inputElement.value = value; // Update the input value after normalization
    }

    const parts = value.split(',');
    if (parts.length > 1 && parts[1].length > 2) {
        inputElement.classList.add('invalid');
        inputElement.value = parts[0] + ',' + parts[1].slice(0, 2);
        displayError('Máximo 2 decimales');
        return;
    }

    if (!hasMaxDigits(value)) {
        inputElement.classList.add('invalid');
        const parts = value.split(',');
        inputElement.value = value.slice(0, 15 - (parts.length > 1 ? parts[1].length : 0)) + (parts.length > 1 ? ',' + parts[1] : '');
        displayError('Demasiados dígitos');
        return;
    }

    clearError();

    if (inputElement === calculatorElements.amountInput || inputElement === calculatorElements.customRateInput) {
        convertCurrency();
    }
}

/* === API DATA FUNCTIONS === */
const fetchData = async () => {
    try {
        const response = await fetch('https://pydolarve.org/api/v1/dollar?page=criptodolar');
        const data = await response.json();

        if (data?.monitors) {
            updateMonitorValues(data.monitors);
            MONITORS.forEach(id => updateMonitorDisplay(id, data.monitors[id]));
            updateTasaInput();
            convertCurrency();
        }
    } catch (error) {
        console.error('Error en solicitud API:', error);
        displayError('Error actualizando tasas. Intentando de nuevo...');
        setTimeout(fetchData, 5000);
    }
};

const updateMonitorValues = (monitors) => {
    rates.bcv = parseFloat(monitors.bcv.price.toString().replace(',', '.'));
    rates.enparalelovzla = parseFloat(monitors.enparalelovzla.price.toString().replace(',', '.'));
    rates.promedio = parseFloat(monitors.promedio.price.toString().replace(',', '.'));
};

const updateMonitorDisplay = (id, monitor) => {
    if (!monitor) return;

    const elements = rateCardElements[id];
    if (!elements) return;

    elements.image?.setAttribute('src', IMAGES[id]);

    if (elements.title) elements.title.textContent = monitor.title;

    if (elements.price) {
        const formattedPrice = formatVenezuelanCurrency(monitor.price);
        elements.price.innerHTML = `${monitor.symbol} ${formattedPrice} Bs`;
    }

    if (elements.lastUpdate) elements.lastUpdate.textContent = monitor.last_update;

    if (elements.oldPrice) {
        const formattedOldPrice = formatVenezuelanCurrency(monitor.price_old);
        elements.oldPrice.textContent = `Anterior: ${formattedOldPrice} Bs`;
    }

    if (elements.change && elements.percentage) {
        const currentPrice = parseFloat(monitor.price.toString().replace(',', '.'));
        const oldPrice = parseFloat(monitor.price_old.toString().replace(',', '.'));
        const change = currentPrice - oldPrice;
        const percentage = oldPrice !== 0 ? (change / oldPrice) * 100 : 0;

        const isPositive = change >= 0;
        const sign = isPositive ? '+' : '-';
        const colorClass = isPositive ? 'positive' : 'negative';

        const formattedChange = Math.abs(change).toFixed(2).replace('.', ',');
        const formattedPercentage = Math.abs(percentage).toFixed(2).replace('.', ',');

        elements.change.innerHTML = `${sign}${formattedChange} Bs`;
        elements.percentage.innerHTML = `${sign}${formattedPercentage}%`;

        elements.change.classList.remove('positive', 'negative');
        elements.percentage.classList.remove('positive', 'negative');

        elements.change.classList.add(colorClass);
        elements.percentage.classList.add(colorClass);
    }
};

/* === CALCULATOR FUNCTIONS === */
// ... (código JavaScript anterior) ...

function updateTasaInput() {
    const rateType = calculatorElements.exchangeRateSelect.value;
    const customRateLabel = document.querySelector('label[for="custom-rate"]');
    const pencilIcon = '<i class="fas fa-pencil-alt" aria-hidden="true"></i> ';
    let labelText = pencilIcon;

    calculatorElements.customRateInput.disabled = rateType !== 'custom';

    if (rateType === 'custom') {
        labelText += 'Personalizada';
        calculatorElements.customRateInput.value = '';
    } else {
        let displayValue = '';
        let selectedRateText = '';
        const exchangeRateSelect = calculatorElements.exchangeRateSelect;
        const selectedOption = exchangeRateSelect.options[exchangeRateSelect.selectedIndex];
        if (selectedOption) {
            selectedRateText = selectedOption.textContent;
        }

        labelText += selectedRateText;

        if (rates[rateType]) {
            displayValue = rates[rateType].toString().replace('.', ',');
        }
        calculatorElements.customRateInput.value = displayValue;
    }

    if (customRateLabel) {
        customRateLabel.innerHTML = labelText;
    }
}

// ... (código JavaScript posterior) ...

function convertCurrency() {
    const amountStr = calculatorElements.amountInput.value.replace(',', '.');
    const amount = parseFloat(amountStr || 0);
    const currencyType = calculatorElements.currencyTypeSelect.value;
    const rateType = calculatorElements.exchangeRateSelect.value;

    let rate;
    if (rateType === 'custom') {
        const customRateStr = calculatorElements.customRateInput.value.replace(',', '.');
        rate = parseFloat(customRateStr || 0);
    } else {
        rate = rates[rateType] || 0;
    }

    // Validate inputs
    if (isNaN(amount) || amount <= 0) {
        calculatorElements.conversionResult.textContent = '0,00';
        if (calculatorElements.amountInput.value.trim() !== '') {
            displayError('Ingrese un monto válido');
        }
        calculatorElements.copyBtn.style.display = 'none';
        return;
    }

    if (isNaN(rate) || rate <= 0) {
        calculatorElements.conversionResult.textContent = '0,00';
        displayError('Tasa de cambio no válida');
        calculatorElements.copyBtn.style.display = 'none';
        return;
    }

    clearError();

    let result;
    let currencySymbol;

    if (currencyType === 'bolivares-to-dollars') {
        result = amount / rate;
        currencySymbol = 'USD';
    } else {
        result = amount * rate;
        currencySymbol = 'Bs';
    }

    calculatorElements.conversionResult.textContent = `${formatVenezuelanCurrency(result)} ${currencySymbol}`;
    calculatorElements.copyBtn.style.display = 'block';
}

/* === EVENT LISTENERS === */
calculatorElements.amountInput.addEventListener('input', () => handleInputValue(calculatorElements.amountInput));
calculatorElements.customRateInput.addEventListener('input', () => handleInputValue(calculatorElements.customRateInput));

calculatorElements.amountInput.addEventListener('paste', (event) => handlePaste(event, calculatorElements.amountInput));
calculatorElements.customRateInput.addEventListener('paste', (event) => handlePaste(event, calculatorElements.customRateInput));

calculatorElements.amountInput.addEventListener('focus', function() {
    this.parentElement.classList.add('active');
});

calculatorElements.amountInput.addEventListener('blur', function() {
    this.parentElement.classList.remove('active');
    clearError();
});

calculatorElements.customRateInput.addEventListener('focus', function() {
    this.parentElement.classList.add('active');
});

calculatorElements.customRateInput.addEventListener('blur', function() {
    this.parentElement.classList.remove('active');
    clearError();
});

calculatorElements.exchangeRateSelect.addEventListener('change', () => {
    updateTasaInput();
    convertCurrency();
});

calculatorElements.currencyTypeSelect.addEventListener('change', convertCurrency);

calculatorElements.copyBtn.addEventListener('click', function() {
    const resultText = calculatorElements.conversionResult.innerText;
    const cleanedResult = resultText.replace(/[^0-9.,]/g, '');

    navigator.clipboard.writeText(cleanedResult)
        .then(() => {
            calculatorElements.copyMessage.style.display = 'block';
            setTimeout(() => {
                calculatorElements.copyMessage.style.display = 'none';
            }, 2000);
        })
        .catch(err => {
            console.error('Error al copiar: ', err);
            displayError('No se pudo copiar al portapapeles');
        });
});

/* === THEME TOGGLE (Optional) === */
function initDarkModeToggle() {
    // Check for saved theme preference or use OS preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
        document.body.classList.add('dark-mode');
    }

    // Create theme toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    toggleBtn.classList.add('theme-toggle-btn');

    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) {
        mainHeader.appendChild(toggleBtn);
        calculatorElements.themeToggle = toggleBtn;
    } else {
        console.warn("No .main-header element found to append the theme toggle button.");
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

/* === INITIALIZATION === */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    calculatorElements.copyBtn.style.display = 'none';

    // Limpiar el input de cantidad al cargar
    calculatorElements.amountInput.value = '';

    // Initialize theme
    initDarkModeToggle();

    // Fetch exchange rate data
    fetchData();

    // Set up periodic data refresh (every 10 minutes)
    setInterval(fetchData, 600000);
});
