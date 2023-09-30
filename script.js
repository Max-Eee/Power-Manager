const body = document.querySelector('body'),
      sidebar = body.querySelector('nav'),
      toggle = body.querySelector(".toggle"),
      searchBtn = body.querySelector(".search-box"),
      modeSwitch = body.querySelector(".toggle-switch"),
      modeText = body.querySelector(".mode-text");

toggle.addEventListener("click" , () =>{
    sidebar.classList.toggle("close");
});

searchBtn.addEventListener("click" , () =>{
    sidebar.classList.remove("close");
});

modeSwitch.addEventListener("click" , () =>{
    body.classList.toggle("dark");
    
    if(body.classList.contains("dark")){
        modeText.innerText = "Light mode";
    } else {
        modeText.innerText = "Dark mode";   
    }
});

const SPREADSHEET_ID = '1JSZRxZfTIey05yMfAZn8DOh1FbsgvobLJo3L0Xm-G40';
const API_KEY = 'AIzaSyAAesZDPdPRSYU4tX9v9b5JAcuMSZWNdyI';

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

//--Cards Data Fetching--
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

//--Notifications--

document.addEventListener('DOMContentLoaded', function () {
  const notificationsTabLink = document.getElementById('notifications-tab-link');
  const notificationsSection = document.querySelector('.notifications');
  const setPowerLimitBtn = document.getElementById('set-power-limit-btn');
  const powerLimitInput = document.getElementById('power-limit');
  const notificationList = document.querySelector('.notification-list');

  // Define the data variable
  let data = [];

  // Event listener to show/hide the Notifications tab
  notificationsTabLink.addEventListener('click', () => {
      notificationsSection.style.display = 'flex';
      // Other sections can be hidden if needed
      // Hide other sections: document.querySelector('.home').style.display = 'none';
  });

  // Event listener to set power limit and check for notifications
  setPowerLimitBtn.addEventListener('click', () => {
      const powerLimit = parseInt(powerLimitInput.value);

      // Assuming you have a function to check if the power limit is exceeded
      if (checkPowerLimitExceeded(powerLimit, data)) {
          // Display notification
          displayNotification(`Power limit exceeded: ${powerLimit} W`);
      }
  });

  // Function to check if the power limit is exceeded
  function checkPowerLimitExceeded(limit, data) {
    // Assuming the last row of your data contains the latest values
    const latestRow = data[data.length - 1];

    // Get the actual power consumption from the 4th column (index 3)
    const actualPowerConsumption = parseInt(latestRow[3]);

    return actualPowerConsumption > limit;
  }

  // Function to display a notification
  function displayNotification(message) {
      const notification = document.createElement('div');
      notification.classList.add('notification');
      notification.textContent = message;

      // Add the new notification to the list
      notificationList.appendChild(notification);
  }
});

