// Function to update tool information and show relevant inputs
async function updateToolInfo() {
    const tool = document.getElementById('tool').value;
    const toolDescription = document.getElementById('toolDescription');
    const inflationInputs = document.getElementById('inflationInputs');
    const pppInputs = document.getElementById('pppInputs');
    const currencyConverterInputs = document.getElementById('currencyConverterInputs');

    // Hide all inputs by default
    inflationInputs.style.display = 'none';
    pppInputs.style.display = 'none';
    currencyConverterInputs.style.display = 'none';

    // Show the inputs for the selected tool
    if (tool === 'inflationCalculator') {
        toolDescription.textContent = "Adjust an amount for inflation to find its equivalent value today.";
        inflationInputs.style.display = 'block';
    } else if (tool === 'pppCalculator') {
        toolDescription.textContent = "Compare purchasing power between two countries.";
        pppInputs.style.display = 'block';
    } else if (tool === 'currencyConverter') {
        toolDescription.textContent = "Convert an amount from one currency to another.";
        currencyConverterInputs.style.display = 'block';
    }
}

// Function to populate country dropdowns with supported currencies
async function populateCountryDropdowns() {
    const fromCountryDropdown = document.getElementById('fromCountry');
    const toCountryDropdown = document.getElementById('toCountry');

    try {
        const response = await fetch('https://v6.exchangerate-api.com/v6/da49e23b5e4ed0ba22b97b4f/codes');
        if (!response.ok) {
            throw new Error(`Failed to fetch country codes: ${response.status}`);
        }
        const data = await response.json();

        // Log API response for debugging
        console.log('API Response:', data);

        const countryList = data.supported_codes; // Expecting array of [currencyCode, countryName]
        if (!countryList || countryList.length === 0) {
            throw new Error('No country codes found in API response.');
        }

        // Populate the dropdowns with options
        countryList.forEach(([currencyCode, countryName]) => {
            const optionFrom = document.createElement('option');
            optionFrom.value = currencyCode;
            optionFrom.textContent = `${countryName} (${currencyCode})`;
            fromCountryDropdown.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = currencyCode;
            optionTo.textContent = `${countryName} (${currencyCode})`;
            toCountryDropdown.appendChild(optionTo);
        });

        console.log('Dropdowns populated successfully.');
    } catch (error) {
        console.error('Error populating country dropdowns:', error);
        const errorMessage = document.createElement('option');
        errorMessage.textContent = 'Failed to load countries.';
        fromCountryDropdown.appendChild(errorMessage);
        toCountryDropdown.appendChild(errorMessage);
    }
}

// Function to calculate and display the result
async function calculateResult() {
    const tool = document.getElementById('tool').value;
    const output = document.getElementById('output');
    let result = '';

    try {
        if (tool === 'currencyConverter') {
            const fromCurrency = document.getElementById('fromCountry').value;
            const amountCurrency = parseFloat(document.getElementById('amountCurrency').value);
            const toCurrency = document.getElementById('toCountry').value;

            if (!fromCurrency || !toCurrency || isNaN(amountCurrency)) {
                result = "Please provide valid input for currency conversion.";
            } else {
                // Fetch exchange rate data
                const response = await fetch(`https://v6.exchangerate-api.com/v6/da49e23b5e4ed0ba22b97b4f/latest/${fromCurrency}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch exchange rates. Please check your API key or input.");
                }
                const data = await response.json();
                const rate = data.conversion_rates[toCurrency];

                if (rate) {
                    const convertedAmount = (rate * amountCurrency).toFixed(2);
                    result = `${amountCurrency} ${fromCurrency} is equivalent to ${convertedAmount} ${toCurrency}.`;
                } else {
                    result = `Exchange rate for ${toCurrency} not found.`;
                }
            }
        } else {
            result = "Feature not implemented.";
        }

        // Display the result
        output.textContent = result;
        output.style.display = 'block';
    } catch (error) {
        console.error('Error in calculation:', error);
        output.textContent = `Error: ${error.message}`;
        output.style.display = 'block';
    }
}

// Initialize the country dropdowns when the page loads
window.onload = populateCountryDropdowns;