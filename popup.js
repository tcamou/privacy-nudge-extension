// Elements
const authButton = document.getElementById('auth-button');
const fetchButton = document.getElementById('fetch-button');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');

// Function to check auth status
function checkAuthStatus() {
  console.log('Checking auth status...');
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (chrome.runtime.lastError) {
      console.error('Error checking auth status:', chrome.runtime.lastError);
    }
    if (token) {
      // User is signed in
      console.log('User is signed in. Token:', token);
      authButton.textContent = 'Signed in';
      authButton.disabled = true;
      fetchButton.disabled = false; // Enable the fetch button
      statusDiv.textContent = 'Status: Signed in';
    } else {
      // User is not signed in
      console.log('User is not signed in.');
      authButton.textContent = 'Sign in with Google';
      authButton.disabled = false;
      fetchButton.disabled = true; // Disable the fetch button
      statusDiv.textContent = 'Status: Not signed in';
    }
  });
}

// Sign in with Google
authButton.addEventListener('click', () => {
  console.log('Sign in button clicked.');
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting token:', chrome.runtime.lastError);
      return;
    }
    console.log('Authentication successful! Token:', token);
    checkAuthStatus(); // Update UI
  });
});

// Fetch Google Drive data
fetchButton.addEventListener('click', () => {
  console.log('Fetch button clicked.');
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting token:', chrome.runtime.lastError);
      return;
    }

    // Call the Google Drive API
    fetchDriveData(token);
  });
});

// Function to fetch Google Drive data
function fetchDriveData(token) {
  const url = 'https://www.googleapis.com/drive/v3/files?fields=files(name,shared,permissions,modifiedTime)&q=\'me\' in owners';

  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Drive data:', data);
      displayDriveData(data);
    })
    .catch((error) => {
      console.error('Error fetching Drive data:', error);
      resultDiv.textContent = 'Error fetching data. Check the console for details.';
    });
}

// Function to display Google Drive data
function displayDriveData(data) {
  const files = data.files || [];
  if (files.length === 0) {
    resultDiv.textContent = 'No files found.';
    return;
  }

  let resultHtml = '<h2>Your Files:</h2><ul>';
  files.forEach((file) => {
    resultHtml += `<li><strong>${file.name}</strong> (Shared: ${file.shared ? 'Yes' : 'No'})</li>`;
  });
  resultHtml += '</ul>';

  resultDiv.innerHTML = resultHtml;
}

// Check auth status when the popup loads
checkAuthStatus();