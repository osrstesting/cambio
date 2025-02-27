let data = {};

async function fetchData() {
    try {
        const response = await fetch('https://pydolarve.org/api/v1/dollar');
        if (!response.ok) {
            throw new Error('Error al obtener los datos');
        }
        data = await response.json();

        // Verificar si los datos existen
        if (data && data.monitors && data.monitors.bcv) {
            // Datos del BCV
            document.getElementById('bcv-price').innerText = `${data.monitors.bcv.symbol} ${data.monitors.bcv.price} VEF`;
            document.getElementById('bcv-last-update').innerText = data.monitors.bcv.last_update;

            // Mostrar el precio anterior y porcentaje
            document.getElementById('bcv-old-price').innerText = `Precio anterior: ${data.monitors.bcv.price_old} VEF`;
            const bcvPercentage = data.monitors.bcv.percent;

            // Verificamos si el cambio es positivo o negativo y modificamos el texto y el color
            if (data.monitors.bcv.color === 'green') {
                document.getElementById('bcv-change').innerText = `+${data.monitors.bcv.change}`;
                document.getElementById('bcv-change').classList.add('positive');
                document.getElementById('bcv-change').classList.remove('negative');
                document.getElementById('bcv-percentage').innerText = `+${bcvPercentage}%`;
                document.getElementById('bcv-percentage').classList.add('positive');
                document.getElementById('bcv-percentage').classList.remove('negative');
            } else if (data.monitors.bcv.color === 'red') {
                document.getElementById('bcv-change').innerText = `-${data.monitors.bcv.change}`;
                document.getElementById('bcv-change').classList.add('negative');
                document.getElementById('bcv-change').classList.remove('positive');
                document.getElementById('bcv-percentage').innerText = `-${bcvPercentage}%`;
                document.getElementById('bcv-percentage').classList.add('negative');
                document.getElementById('bcv-percentage').classList.remove('positive');
            }
        } else {
            console.error('Los datos de BCV no están disponibles');
        }

        // Datos de EnParaleloVzla
        if (data && data.monitors && data.monitors.enparalelovzla) {
            document.getElementById('enparalelovzla-price').innerText = `${data.monitors.enparalelovzla.symbol} ${data.monitors.enparalelovzla.price} VEF`;
            document.getElementById('enparalelovzla-last-update').innerText = data.monitors.enparalelovzla.last_update;

            // Mostrar el precio anterior y porcentaje para EnParaleloVzla
            document.getElementById('enparalelovzla-old-price').innerText = `Precio anterior: ${data.monitors.enparalelovzla.price_old} VEF`;
            const enParaleloVzlaPercentage = data.monitors.enparalelovzla.percent;

            // Verificamos si el cambio es positivo o negativo y modificamos el texto y el color
            if (data.monitors.enparalelovzla.color === 'green') {
                document.getElementById('enparalelovzla-change').innerText = `+${data.monitors.enparalelovzla.change}`;
                document.getElementById('enparalelovzla-change').classList.add('positive');
                document.getElementById('enparalelovzla-change').classList.remove('negative');
                document.getElementById('enparalelovzla-percentage').innerText = `+${enParaleloVzlaPercentage}%`;
                document.getElementById('enparalelovzla-percentage').classList.add('positive');
                document.getElementById('enparalelovzla-percentage').classList.remove('negative');
            } else if (data.monitors.enparalelovzla.color === 'red') {
                document.getElementById('enparalelovzla-change').innerText = `-${data.monitors.enparalelovzla.change}`;
                document.getElementById('enparalelovzla-change').classList.add('negative');
                document.getElementById('enparalelovzla-change').classList.remove('positive');
                document.getElementById('enparalelovzla-percentage').innerText = `-${enParaleloVzlaPercentage}%`;
                document.getElementById('enparalelovzla-percentage').classList.add('negative');
                document.getElementById('enparalelovzla-percentage').classList.remove('positive');
            }
        } else {
            console.error('Los datos de EnParaleloVzla no están disponibles');
        }

    } catch (error) {
        console.error('Hubo un problema con la solicitud de la API:', error);
    }
}

function toggleCustomRate() {
    const rateSelect = document.getElementById('exchange-rate');
    const customRateInput = document.getElementById('custom-rate');
    if (rateSelect.value === 'custom') {
        customRateInput.style.display = 'block';
    } else {
        customRateInput.style.display = 'none';
    }
}

function calculate() {
    let amount = parseFloat(document.getElementById('amount').value);

    // Verificar si el campo está vacío
    if (!document.getElementById('amount').value.trim()) {
        document.getElementById('conversion-result').innerText = ''; // No mostrar mensaje de error
        document.getElementById('copy-btn').style.display = 'none'; // Ocultar el botón de copiar
        return; // Salir sin hacer el cálculo
    }

    // Validación: Si la cantidad no es un número válido o es menor o igual a 0, se asigna 1 como valor por defecto
    if (isNaN(amount) || amount <= 0) {
        amount = 1; // Asigna un valor predeterminado para evitar NaN
        document.getElementById('conversion-result').innerText = "Ingresa una cantidad válida";
        document.getElementById('copy-btn').style.display = 'none'; // Ocultar el botón de copiar si la cantidad no es válida
    } else {
        // Si la cantidad es válida, continúa con el cálculo
        const currencyType = document.getElementById('currency-type').value;
        const rateType = document.getElementById('exchange-rate').value;
        let rate = 0;

        // Selección de la tasa de cambio
        if (rateType === 'bcv') {
            rate = data.monitors.bcv.price;
        } else if (rateType === 'enparalelovzla') {
            rate = data.monitors.enparalelovzla.price;
        } else if (rateType === 'custom') {
            rate = parseFloat(document.getElementById('custom-rate').value);
        }

        // Si la tasa personalizada no es válida, mostramos un mensaje de advertencia
        if (rateType === 'custom' && (isNaN(rate) || rate <= 0)) {
            document.getElementById('conversion-result').innerText = "Ingresa una tasa personalizada válida";
            document.getElementById('copy-btn').style.display = 'none'; // Ocultar el botón de copiar si la cantidad no es válida
            return;
        }

        // Cálculo de la conversión
        let result, currencySymbol;

        if (currencyType === 'bolivares-to-dollars') {
            result = amount / rate;
            currencySymbol = 'USD';
        } else {
            result = amount * rate;
            currencySymbol = 'VEF';
        }

        // Formatear el resultado
        const formattedResult = new Intl.NumberFormat('de-DE', { style: 'decimal', minimumFractionDigits: 2 }).format(result);
        document.getElementById('conversion-result').innerText = `${formattedResult} ${currencySymbol}`;
        document.getElementById('copy-btn').style.display = 'inline-block'; // Mostrar el botón de copiar si el cálculo es válido
    }
}

function copyResult() {
    const resultText = document.getElementById('conversion-result').innerText;
    const numberResult = resultText.replace(/[^\d,.-]/g, '');
    if (numberResult === "Ingresa una cantidad válida") {
        return;
    }
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(numberResult).then(function () {
        showCopiedMessage();
    }).catch(function (error) {
        console.error('Error al copiar el resultado: ', error);
    });
}

// Función para mostrar el mensaje de "Resultado copiado"
function showCopiedMessage() {
    const copyMessage = document.getElementById('copy-message');
    copyMessage.style.display = 'block'; // Mostrar el mensaje

    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        copyMessage.style.display = 'none'; // Ocultar el mensaje
    }, 5000);
}


// Al cargar la página, limpiar los campos 'amount' y 'custom-rate' y revisar si la tasa personalizada está activa
window.addEventListener('load', () => {
    // Limpiar los campos de cantidad y tasa personalizada
    document.getElementById('amount').value = '';
    document.getElementById('custom-rate').value = '';

    toggleCustomRate(); // Asegura que el campo se muestre si la tasa personalizada está seleccionada
    calculate(); // Realiza el cálculo al cargar la página si hay datos disponibles
});

// Añadir los eventos para manejar los cambios
document.getElementById('amount').addEventListener('input', calculate);
document.getElementById('currency-type').addEventListener('change', calculate);
document.getElementById('exchange-rate').addEventListener('change', function () {
    toggleCustomRate();
    calculate();
});
document.getElementById('custom-rate').addEventListener('input', calculate);
document.getElementById('copy-btn').addEventListener('click', copyResult);

fetchData();
