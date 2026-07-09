// Grab references to the HTML elements we need to work with
const form = document.getElementById('med-form');
const nameInput = document.getElementById('med-name');
const dosageInput = document.getElementById('med-dosage');
const medList = document.getElementById('med-list');

// Load existing medications from localStorage, or start with an empty array
let medications = JSON.parse(localStorage.getItem('medications')) || [];

// Returns today's date as a simple string like "2026-07-09"
function getToday() {
  return new Date().toISOString().split('T')[0];
}


// Checks for interactions between a list of rxcui IDs
// Fetches the FDA label text for a given drug name, returns the 
// "drug_interactions" section if it exists
async function getInteractionText(drugName) {
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`;
  const response = await fetch(url);

  if (!response.ok) return null; // drug not found in FDA database

  const data = await response.json();
  const result = data.results[0];

  return result.drug_interactions ? result.drug_interactions[0] : null;
}

// Checks a NEW drug against all EXISTING drugs for interaction warnings
async function checkInteractions(newDrugName, existingDrugNames) {
  const warnings = [];

  const newDrugInteractionText = await getInteractionText(newDrugName);
  if (!newDrugInteractionText) return warnings; // no data available, skip silently

  // For each existing medication, check if its name is MENTIONED in the 
  // new drug's interaction text — a simple but honest way to flag possible overlap
  existingDrugNames.forEach(existingName => {
    const mentioned = newDrugInteractionText.toLowerCase().includes(existingName.toLowerCase());
    if (mentioned) {
      warnings.push(`${newDrugName} may interact with ${existingName}. Check the label or ask your pharmacist.`);
    }
  });

  return warnings;
}
// Renders the full list on screen based on the 'medications' array
function renderList() {
  medList.innerHTML = ''; // clear the current list on screen

  medications.forEach(function(med, index) {
    const listItem = document.createElement('li');

    // Basic info text
    const infoText = document.createElement('span');
    infoText.textContent = `${med.name} — ${med.dosage} | Streak: ${med.streak} 🔥`;

    // "Taken today" button
    const takenBtn = document.createElement('button');
    const takenToday = med.lastTaken === getToday();
    takenBtn.textContent = takenToday ? 'Taken ✅' : 'Mark as taken';
    takenBtn.disabled = takenToday; // prevent double-clicking same day

    takenBtn.addEventListener('click', function() {
      markAsTaken(index);
    });

    listItem.appendChild(infoText);
    listItem.appendChild(takenBtn);
    medList.appendChild(listItem);
  });
}

// Marks a specific medication (by its index in the array) as taken today
function markAsTaken(index) {
  const med = medications[index];
  const today = getToday();

  if (med.lastTaken === today) return; // already marked today, do nothing

  // Check if yesterday was the last taken day, to decide if streak continues
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (med.lastTaken === yesterdayStr) {
    med.streak += 1; // continued streak
  } else {
    med.streak = 1; // streak was broken, restart at 1
  }

  med.lastTaken = today;

  saveToStorage();
  renderList();
}

// Saves the current 'medications' array into localStorage
function saveToStorage() {
  localStorage.setItem('medications', JSON.stringify(medications));
}
// Handle form submission (adding a new medication)
form.addEventListener('submit', async function(event) {
  event.preventDefault();

  const medName = nameInput.value;
  const medDosage = dosageInput.value;

  // Get names of medications already in the list
  const existingNames = medications.map(med => med.name);

  // Check for interactions BEFORE adding the new one
  const warnings = await checkInteractions(medName, existingNames);

  if (warnings.length > 0) {
    const proceed = confirm(
      warnings.join('\n') + '\n\nDo you still want to add this medication?'
    );
    if (!proceed) return; // user cancelled, stop here
  }

  // Add the new medication as an object, including streak tracking fields
  medications.push({
    name: medName,
    dosage: medDosage,
    streak: 0,
    lastTaken: null
  });

  saveToStorage();
  renderList();

  nameInput.value = '';
  dosageInput.value = '';
});


// Render whatever was already saved, as soon as the page loads
renderList();