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

// Fetches the FDA label text for a given drug name, returns the 
// "drug_interactions" section if it exists
async function getInteractionText(drugName) {
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`;
  const response = await fetch(url);

  if (!response.ok) return null;

  const data = await response.json();
  const result = data.results[0];

  return result.drug_interactions ? result.drug_interactions[0] : null;
}

// Checks a NEW drug against all EXISTING drugs for interaction warnings
async function checkInteractions(newDrugName, existingDrugNames) {
  const warnings = [];

  const newDrugInteractionText = await getInteractionText(newDrugName);
  if (!newDrugInteractionText) return warnings;

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
  medList.innerHTML = '';

  medications.forEach(function(med, index) {
    const listItem = document.createElement('li');

    if (med.editing) {
      // EDIT MODE: show input fields instead of plain text
      const nameEditInput = document.createElement('input');
      nameEditInput.type = 'text';
      nameEditInput.value = med.name;

      const dosageEditInput = document.createElement('input');
      dosageEditInput.type = 'text';
      dosageEditInput.value = med.dosage;

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', function() {
        saveEdit(index, nameEditInput.value, dosageEditInput.value);
      });

      listItem.appendChild(nameEditInput);
      listItem.appendChild(dosageEditInput);
      listItem.appendChild(saveBtn);

    } else {
      // NORMAL MODE: show plain text + buttons
      const infoText = document.createElement('span');
      infoText.textContent = `${med.name} — ${med.dosage} | Streak: ${med.streak} 🔥`;

      const takenBtn = document.createElement('button');
      const takenToday = med.lastTaken === getToday();
      takenBtn.textContent = takenToday ? 'Taken ✅' : 'Mark as taken';
      takenBtn.disabled = takenToday;
      takenBtn.addEventListener('click', function() {
        markAsTaken(index);
      });

      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.title = 'Edit this medication';
      editBtn.addEventListener('click', function() {
        toggleEdit(index);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = 'Delete this medication';
      deleteBtn.addEventListener('click', function() {
        deleteMedication(index);
      });

      listItem.appendChild(infoText);
      listItem.appendChild(takenBtn);
      listItem.appendChild(editBtn);
      listItem.appendChild(deleteBtn);
    }

    medList.appendChild(listItem);
  });
}

// Switches a medication into "editing" mode
function toggleEdit(index) {
  medications[index].editing = true;
  renderList();
}

// Saves the edited name/dosage and exits editing mode
function saveEdit(index, newName, newDosage) {
  medications[index].name = newName;
  medications[index].dosage = newDosage;
  medications[index].editing = false;

  saveToStorage();
  renderList();
}

// Removes a medication by its index
function deleteMedication(index) {
  const confirmed = confirm(`Remove ${medications[index].name} from your list?`);
  if (!confirmed) return;

  medications.splice(index, 1);
  saveToStorage();
  renderList();
}

// Marks a specific medication (by its index in the array) as taken today
function markAsTaken(index) {
  const med = medications[index];
  const today = getToday();

  if (med.lastTaken === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (med.lastTaken === yesterdayStr) {
    med.streak += 1;
  } else {
    med.streak = 1;
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

  const existingNames = medications.map(med => med.name);

  const warnings = await checkInteractions(medName, existingNames);

  if (warnings.length > 0) {
    const proceed = confirm(
      warnings.join('\n') + '\n\nDo you still want to add this medication?'
    );
    if (!proceed) return;
  }

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