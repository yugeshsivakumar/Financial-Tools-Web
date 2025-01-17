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

// Function to populate country dropdowns for the currency converter
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

// Function to populate country dropdown for the inflation calculator
// Function to populate country dropdown for the inflation calculator
async function populateInflationCountryDropdown() {
    const countryDropdown = document.getElementById('country');
    countryDropdown.innerHTML = ''; // Clear previous options
    const apiBaseUrl = 'https://api.worldbank.org/v2/country';
    let currentPage = 1;
    let totalPages = 1; // Placeholder to start the loop

    try {
        while (currentPage <= totalPages) {
            const response = await fetch(`${apiBaseUrl}?format=json&page=${currentPage}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch country list: ${response.status}`);
            }

            const data = await response.json();
            if (!data[1] || data[1].length === 0) {
                throw new Error('No countries found in API response.');
            }

            // Set totalPages on the first request
            if (currentPage === 1 && data[0].pages) {
                totalPages = data[0].pages;
            }

            // Add countries to the dropdown
            data[1].forEach((country) => {
                if (country.id && country.name) {
                    const option = document.createElement('option');
                    option.value = country.id; // ISO 3166-1 alpha-3 code
                    option.textContent = `${country.name} (${country.id})`;
                    countryDropdown.appendChild(option);
                }
            });

            currentPage++;
        }

        console.log('Inflation country dropdown populated successfully.');
    } catch (error) {
        console.error('Error populating inflation country dropdown:', error);
        const errorMessage = document.createElement('option');
        errorMessage.textContent = 'Failed to load countries.';
        countryDropdown.appendChild(errorMessage);
    }
}


// Function to populate year dropdowns
function populateYearDropdowns() {
    const baseYearDropdown = document.getElementById('baseYear');
    const currentYearDropdown = document.getElementById('currentYear');
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year >= 1900; year--) {
        const baseOption = document.createElement('option');
        baseOption.value = year;
        baseOption.textContent = year;

        const currentOption = document.createElement('option');
        currentOption.value = year;
        currentOption.textContent = year;

        baseYearDropdown.appendChild(baseOption);
        currentYearDropdown.appendChild(currentOption);
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
        } else if (tool === 'inflationCalculator') {
            const country = document.getElementById('country').value;
            const baseYear = parseInt(document.getElementById('baseYear').value);
            const currentYear = parseInt(document.getElementById('currentYear').value);
            const amountInflation = parseFloat(document.getElementById('amountInflation').value);

            if (!country || isNaN(baseYear) || isNaN(currentYear) || isNaN(amountInflation)) {
                result = "Please provide valid inputs for the inflation calculation.";
            } else {
                // Fetch inflation rate data
                const response = await fetch(
                    `https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL?format=json&date=${baseYear}:${currentYear}`
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch inflation data: ${response.status}`);
                }

                const data = await response.json();

                if (!data || !data[1] || data[1].length === 0) {
                    throw new Error(`No inflation data available for ${country} between ${baseYear} and ${currentYear}.`);
                }

                // Process inflation data
                const inflationData = data[1].reduce((acc, entry) => {
                    if (entry.value !== null) {
                        acc[entry.date] = entry.value;
                    }
                    return acc;
                }, {});

                if (!inflationData[baseYear] || !inflationData[currentYear]) {
                    throw new Error(`Insufficient inflation data for the selected years: ${baseYear} or ${currentYear}.`);
                }

                // Calculate adjusted value
                const baseCPI = inflationData[baseYear];
                const currentCPI = inflationData[currentYear];
                const adjustedValue = (amountInflation * currentCPI) / baseCPI;

                result = `${amountInflation} in ${baseYear} is equivalent to ${adjustedValue.toFixed(2)} in ${currentYear}.`;
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

// Initialize the dropdowns when the page loads
window.onload = function () {
    populateCountryDropdowns();
    populateInflationCountryDropdown();
    populateYearDropdowns();
};
