// Log when the background script starts
console.log('Background script started.');

let lastCheckedTime = Date.now(); // Track the last time we checked for changes

chrome.action.onClicked.addListener(function() {
    chrome.tabs.create({url: 'index.html'});
  });

// Listen for authentication token
chrome.identity.onSignInChanged.addListener((account) => {
    console.log('Sign-in state changed:', account); // Add this line for debugging
    if (account) {
      console.log('User signed in:', account);
      startMonitoringDrive();
    } else {
      console.log('User signed out.');
      clearInterval(pollingInterval);
    }
  });

let pollingInterval;

// Function to start monitoring Google Drive
function startMonitoringDrive() {
  console.log('Starting Drive monitoring...');
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    console.log('Token received:', token);

    // Poll for changes every 60 seconds
    pollingInterval = setInterval(() => {
      fetchDriveActivity(token);
    }, 10000); // 60 seconds
  });
}

// Function to fetch recent file-sharing events
function fetchDriveActivity(token) {
    console.log('Fetching Drive activity...');
    const url = 'https://www.googleapis.com/drive/v3/files?fields=files(name,shared,permissions,modifiedTime)&q=\'me\' in owners';
  
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Drive activity:', data);
        processDriveActivity(data);
      })
      .catch((error) => {
        console.error('Error fetching Drive activity:', error);
      });
  }

// Function to process file-sharing events and generate nudges
function processDriveActivity(data) {
    const files = data.files || [];
    files.forEach((file) => {
      const modifiedTime = new Date(file.modifiedTime).getTime();
      if (file.shared && modifiedTime > lastCheckedTime) {
        const nudge = generateNudge(file);
        console.log('Nudge:', nudge);
        sendNudgeNotification(nudge);
      }
    });
  
    // Update the last checked time
    lastCheckedTime = Date.now();
  }

// Function to generate a nudge message
function generateNudge(file) {
  const fileName = file.name || 'a file';
  const permissions = file.permissions || [];
  const recipients = permissions.map((p) => p.emailAddress).join(', ');

  return `You shared "${fileName}" with ${recipients}. They can now view, download, and edit this file. Be cautious about sharing sensitive information.`;
}

// Function to send a nudge as a notification
function sendNudgeNotification(nudge) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Privacy Nudge',
    message: nudge,
  });
}