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
    } catch (error) {
        console.error('Error populating country dropdowns:', error);
        fromCountryDropdown.innerHTML = '<option value="">Failed to load countries</option>';
        toCountryDropdown.innerHTML = '<option value="">Failed to load countries</option>';
    }
}

// Function to populate country dropdown for the inflation calculator
async function populateInflationCountryDropdown() {
    const countryDropdown = document.getElementById('country');
    countryDropdown.innerHTML = '<option value="">Select a Country</option>'; // Clear previous options
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
    } catch (error) {
        console.error('Error populating inflation country dropdown:', error);
        countryDropdown.innerHTML = '<option value="">Failed to load countries</option>';
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

// Function to populate PPP country dropdowns
async function populatePppCountryDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '<option value="">Select a Country</option>'; // Default placeholder
    const apiBaseUrl = 'https://api.worldbank.org/v2/country';
    let currentPage = 1;
    let totalPages = 1;

    try {
        while (currentPage <= totalPages) {
            const response = await fetch(`${apiBaseUrl}?format=json&page=${currentPage}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch country list: ${response.status}`);
            }

            const data = await response.json();
            if (!data[1]) throw new Error('No countries found in the API response.');

            if (currentPage === 1) totalPages = data[0]?.pages || 1;

            data[1].forEach((country) => {
                const option = document.createElement('option');
                option.value = country.id; // ISO 3166-1 alpha-3 code
                option.textContent = `${country.name} (${country.id})`;
                dropdown.appendChild(option);
            });

            currentPage++;
        }
    } catch (error) {
        console.error(`Error populating dropdown (${dropdownId}):`, error);
        dropdown.innerHTML = '<option value="">Failed to load countries</option>';
    }
}

// Function to fetch PPP data
async function fetchPPPData(countryCode) {
    const response = await fetch(
        `https://api.worldbank.org/v2/country/${countryCode}/indicator/PA.NUS.PPP?format=json`
    );
    if (!response.ok) throw new Error('Failed to fetch PPP data.');
    const data = await response.json();
    return data[1]?.[0]?.value;
}

// Function to calculate and display the result
async function calculateResult() {
    const tool = document.getElementById('tool').value;
    const output = document.getElementById('output');
    output.textContent = '';
    output.style.display = 'none';

    try {
        if (tool === 'currencyConverter') {
            const fromCurrency = document.getElementById('fromCountry').value;
            const amountCurrency = parseFloat(document.getElementById('amountCurrency').value);
            const toCurrency = document.getElementById('toCountry').value;

            if (!fromCurrency || !toCurrency || isNaN(amountCurrency)) {
                output.textContent = "Please provide valid input for currency conversion.";
            } else {
                const response = await fetch(`https://v6.exchangerate-api.com/v6/da49e23b5e4ed0ba22b97b4f/latest/${fromCurrency}`);
                if (!response.ok) throw new Error('Failed to fetch exchange rates.');

                const data = await response.json();
                const rate = data.conversion_rates[toCurrency];

                if (rate) {
                    const convertedAmount = (amountCurrency * rate).toFixed(2);
                    output.textContent = `${amountCurrency} in ${fromCurrency} is equal to ${convertedAmount} in ${toCurrency}.`;
                } else {
                    output.textContent = `Exchange rate for ${toCurrency} not found.`;
                }
            }
        } else if (tool === 'pppCalculator') {
            const sourceCountry = document.getElementById('sourceCountry').value;
            const targetCountry = document.getElementById('targetCountry').value;
            const amount = parseFloat(document.getElementById('sourceAmount').value);

            if (!sourceCountry || !targetCountry || isNaN(amount) || amount <= 0) {
                output.textContent = 'Please select both countries and enter a valid amount.';
                return;
            }

            const [pppSource, pppTarget] = await Promise.all([
                fetchPPPData(sourceCountry),
                fetchPPPData(targetCountry),
            ]);

            if (!pppSource || !pppTarget) {
                throw new Error('PPP data unavailable for one or both countries.');
            }

            const pppRatio = pppTarget / pppSource;
            const equivalentAmount = (pppRatio * amount).toFixed(2);
            const reversePPP = (1 / pppRatio).toFixed(2);

            output.textContent = `The purchasing power of ${amount} in ${sourceCountry} is equivalent to ${equivalentAmount} in ${targetCountry},In other words, if you spend 1 unit of currency in ${sourceCountry} to buy an item, you would need to spend ${reversePPP} units of ${sourceCountry} currency to buy the same item in ${targetCountry}.`;
        } else if (tool === 'inflationCalculator') {
            const country = document.getElementById('country').value;
            const baseYear = document.getElementById('baseYear').value;
            const currentYear = document.getElementById('currentYear').value;
            const amountInflation = parseFloat(document.getElementById('amountInflation').value);

            if (!country || isNaN(amountInflation) || !baseYear || !currentYear) {
                output.textContent = "Please provide valid inputs for the inflation calculation.";
            } else {
                const response = await fetch(
                    `https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL?format=json&date=${baseYear}:${currentYear}`
                );

                if (!response.ok) throw new Error('Failed to fetch inflation data.');

                const data = await response.json();
                const inflationData = data[1].reduce((acc, entry) => {
                    if (entry.value !== null) acc[entry.date] = entry.value;
                    return acc;
                }, {});

                if (inflationData[baseYear] && inflationData[currentYear]) {
                    const adjustedValue = (amountInflation * inflationData[currentYear]) / inflationData[baseYear];
                    output.textContent = `${amountInflation} in ${baseYear} is equal to ${adjustedValue.toFixed(2)} in ${currentYear}.`;
                } else {
                    output.textContent = 'Insufficient data for the selected years.';
                }
            }
        }
    } catch (error) {
        output.textContent = `Error: ${error.message}`;
    }

    output.style.display = 'block';
}

// Initialize dropdowns on page load
document.addEventListener('DOMContentLoaded', () => {
    populatePppCountryDropdown('sourceCountry');
    populatePppCountryDropdown('targetCountry');
    populateCountryDropdowns();
    populateInflationCountryDropdown();
    populateYearDropdowns();
    updateToolInfo();
});
