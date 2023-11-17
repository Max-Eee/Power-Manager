const body = document.querySelector('body'),
  sidebar = body.querySelector('nav'),
  toggle = body.querySelector(".toggle"),
  searchBtn = body.querySelector(".search-box"),
  modeSwitch = body.querySelector(".toggle-switch"),
  modeText = body.querySelector(".mode-text");

toggle.addEventListener("click", () => {
  sidebar.classList.toggle("close");
});

searchBtn.addEventListener("click", () => {
  sidebar.classList.remove("close");
});

modeSwitch.addEventListener("click", () => {
  body.classList.toggle("dark");

  if (body.classList.contains("dark")) {
    modeText.innerText = "Light mode";
  } else {
    modeText.innerText = "Dark mode";
  }
});

const SPREADSHEET_ID = '1YCVll5WrsZejK4qBBCDs-ReGvXDokubBp-wQypLXf5M';
const API_KEY = 'AIzaSyBhUyVVkKx5MyPvkbGVEzb0v4E9IeVRK4U';

// Load the Google Sheets API
gapi.load('client', initClient);

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  }).then(() => {
    // Fetch all data from the spreadsheet
    fetchAllData();
    // Fetch latest values for the cards
    fetchLatestValues();
    // Fetch power limit from "Settings" tab
    fetchPowerLimit();
    // Fetch data periodically (adjust the interval as needed)
    setInterval(fetchLatestValues, 5000); // Fetch latest values every 5 seconds
  });
}

function fetchAllData() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Log',
  }).then(response => {
    const values = response.result.values;

    // Update the HTML table with all data
    updateTable(values);
  });
}

function fetchLatestValues() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Log',
  }).then(response => {
    const values = response.result.values;

    // Update the card values with the latest values
    updateCardValues(values);
    
    // Check if the power limit is exceeded and show a notification
    checkPowerLimit();
  });
}

function updateTable(data) {
  const table = document.getElementById('data-table');

  // Clear existing table data
  table.innerHTML = '';

  // Add header row
  const headerRow = table.insertRow(0);
  data[0].forEach((header, index) => {
    const cell = headerRow.insertCell(index);
    cell.textContent = header;
  });

  // Add data rows
  for (let i = 1; i < data.length; i++) {
    const row = table.insertRow(i);
    data[i].forEach((value, index) => {
      const cell = row.insertCell(index);
      cell.textContent = value;
    });
  }
}

// --Cards Data Fetching--
const voltageValue = document.getElementById('voltage-value');
const currentValue = document.getElementById('current-value');
const powerValue = document.getElementById('power-value');
const unitValue = document.getElementById('unit-value');

const COLUMN_INDEX_FOR_VOLTAGE = 2; // Column C
const COLUMN_INDEX_FOR_CURRENT = 3; // Column D
const COLUMN_INDEX_FOR_POWER = 4; // Column E
const COLUMN_INDEX_FOR_UNIT = 5; // Column F

function updateCardValues(data) {
  // Assuming the last row of your data contains the latest values
  const latestRow = data[data.length - 1];

  // Update the card values
  voltageValue.textContent = latestRow[COLUMN_INDEX_FOR_VOLTAGE];
  currentValue.textContent = latestRow[COLUMN_INDEX_FOR_CURRENT];
  powerValue.textContent = latestRow[COLUMN_INDEX_FOR_POWER];
  unitValue.textContent = latestRow[COLUMN_INDEX_FOR_UNIT];
}

// Function to fetch the power limit from the "Settings" tab
function fetchPowerLimit() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Settings!A1', // Assuming A1 cell in "Settings" tab contains the power limit
  }).then(response => {
    const powerLimit = response.result.values[0][0];
    if (powerLimit) {
      // Set the retrieved power limit in the input field
      document.getElementById('power-limit').value = powerLimit;
    }
  });
}

// Function to set the power limit to the "Settings" tab
function setPowerLimit() {
  const userPowerLimit = document.getElementById('power-limit').value;
  if (!isNaN(userPowerLimit)) {
    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Settings!A1',
      valueInputOption: 'RAW',
      values: [[userPowerLimit]],
    }).then(() => {
      alert('Power limit set successfully!');
    }).catch(error => {
      console.error('Update error:', error);
    });
  } else {
    alert('Invalid input. Please enter a valid number.');
  }
}





// Fetch the power limit from "Settings" tab when the page loads
fetchPowerLimit();

// Set Power Limit button event
const setPowerLimitBtn = document.getElementById('set-power-limit-btn');
setPowerLimitBtn.addEventListener('click', setPowerLimit);

// Check if the power limit is exceeded and show a notification
function checkPowerLimit() {
  const powerLimit = parseFloat(document.getElementById('power-limit').value);
  const latestPowerValue = parseFloat(powerValue.textContent);

  if (!isNaN(powerLimit) && !isNaN(latestPowerValue) && latestPowerValue > powerLimit) {
    // Power limit exceeded, show a notification
    const notificationList = document.getElementById('notification-list');
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = `Power limit exceeded: ${latestPowerValue}`;
    notificationList.appendChild(notification);
  }
}

// Update Sheet ID
document.getElementById('update-sheet-btn').addEventListener('click', updateSheetId);

function updateSheetId() {
    const newSheetId = document.getElementById('sheet-id').value;

    // Validate the new sheet ID (you can add more validation if needed)
    if (newSheetId.trim() !== '') {
        // Update the global variable SPREADSHEET_ID with the new sheet ID
        SPREADSHEET_ID = newSheetId;
        
        // Fetch data with the updated sheet ID
        fetchAllData();
        fetchLatestValues();
        fetchPowerLimit();

        alert('Google Sheet ID updated successfully!');
    } else {
        alert('Please enter a valid Google Sheet ID.');
    }
}
