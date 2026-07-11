// Grab references to the HTML elements we need to work with
const timeInput = document.getElementById('med-time');
const form = document.getElementById('med-form');
const nameInput = document.getElementById('med-name');
const dosageInput = document.getElementById('med-dosage');
const medList = document.getElementById('med-list');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const frequencySelect = document.getElementById('med-frequency');
const dayOfWeekSelect = document.getElementById('med-day-of-week');
const dayOfMonthInput = document.getElementById('med-day-of-month');

frequencySelect.addEventListener('change', function() {
  dayOfWeekSelect.classList.add('hidden');
  dayOfMonthInput.classList.add('hidden');

  if (frequencySelect.value === 'weekly') {
    dayOfWeekSelect.classList.remove('hidden');
  } else if (frequencySelect.value === 'monthly') {
    dayOfMonthInput.classList.remove('hidden');
  }
});
// Apply saved dark mode preference on page load
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  darkModeToggle.textContent = '☀️';
}

darkModeToggle.addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');

  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  darkModeToggle.textContent = isDark ? '☀️' : '🌙';
});
// Load existing medications from localStorage, or start with an empty array
let medications = JSON.parse(localStorage.getItem('medications')) || [];
// Register the service worker so it can run in the background
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(function(registration) {
      console.log('Service Worker registered:', registration);
    })
    .catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });
}

// Listen for messages coming back from the service worker (button clicks)
navigator.serviceWorker.addEventListener('message', function(event) {
  const { action, medId } = event.data;
  handleNotificationAction(action, medId);
});
// Returns today's date in LOCAL time as "YYYY-MM-DD" (avoids UTC timezone bugs)
function getToday() {
  return formatDateLocal(new Date());
}

// Formats any Date object into "YYYY-MM-DD" using LOCAL time, not UTC
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function renderList() {
  medList.innerHTML = '';

  // Show a friendly message if there are no medications yet
  if (medications.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = 'No medications yet — add one above to get started.';
    emptyMessage.style.color = '#888';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.border = 'none';
    medList.appendChild(emptyMessage);
    return;
  }

  // Sort a COPY of the array by time (earliest first)
  const sortedMedications = [...medications].sort(function(a, b) {
    return (a.time || '').localeCompare(b.time || '');
  });

  sortedMedications.forEach(function(med) {
    const index = medications.indexOf(med);
    const listItem = document.createElement('li');

    if (med.editing) {
      // EDIT MODE: show input fields for everything editable
      const nameEditInput = document.createElement('input');
      nameEditInput.type = 'text';
      nameEditInput.value = med.name;

      const dosageEditInput = document.createElement('input');
      dosageEditInput.type = 'text';
      dosageEditInput.value = med.dosage;

      const timeEditInput = document.createElement('input');
      timeEditInput.type = 'time';
      timeEditInput.value = med.time || '';

      const frequencyEditSelect = document.createElement('select');
      ['daily', 'weekly', 'monthly'].forEach(function(freq) {
        const option = document.createElement('option');
        option.value = freq;
        option.textContent = freq.charAt(0).toUpperCase() + freq.slice(1);
        if (med.frequency === freq) option.selected = true;
        frequencyEditSelect.appendChild(option);
      });

      const dayOfWeekEditSelect = document.createElement('select');
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dayNames.forEach(function(day, i) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = day;
        if (med.dayOfWeek === i) option.selected = true;
        dayOfWeekEditSelect.appendChild(option);
      });
      if (med.frequency !== 'weekly') dayOfWeekEditSelect.classList.add('hidden');

      const dayOfMonthEditInput = document.createElement('input');
      dayOfMonthEditInput.type = 'number';
      dayOfMonthEditInput.min = '1';
      dayOfMonthEditInput.max = '31';
      dayOfMonthEditInput.placeholder = 'Day of month (1-31)';
      dayOfMonthEditInput.value = med.dayOfMonth || '';
      if (med.frequency !== 'monthly') dayOfMonthEditInput.classList.add('hidden');

      // Show/hide the right extra field as the dropdown changes, same as the main form
      frequencyEditSelect.addEventListener('change', function() {
        dayOfWeekEditSelect.classList.add('hidden');
        dayOfMonthEditInput.classList.add('hidden');

        if (frequencyEditSelect.value === 'weekly') {
          dayOfWeekEditSelect.classList.remove('hidden');
        } else if (frequencyEditSelect.value === 'monthly') {
          dayOfMonthEditInput.classList.remove('hidden');
        }
      });

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', function() {
        saveEdit(
          index,
          nameEditInput.value,
          dosageEditInput.value,
          timeEditInput.value,
          frequencyEditSelect.value,
          dayOfWeekEditSelect.value,
          dayOfMonthEditInput.value
        );
      });

      listItem.appendChild(nameEditInput);
      listItem.appendChild(dosageEditInput);
      listItem.appendChild(timeEditInput);
      listItem.appendChild(frequencyEditSelect);
      listItem.appendChild(dayOfWeekEditSelect);
      listItem.appendChild(dayOfMonthEditInput);
      listItem.appendChild(saveBtn);

    } else {
      // NORMAL MODE: show plain text + buttons
      const infoText = document.createElement('span');
      infoText.textContent = `${med.name} — ${med.dosage} — ⏰ ${formatTime(med.time)} | Streak: ${med.streak} 🔥`;

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

      
      const heatmap = buildHeatmap(med.history || []);
      listItem.appendChild(heatmap);
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
function saveEdit(index, newName, newDosage, newTime, newFrequency, newDayOfWeek, newDayOfMonth) {
  medications[index].name = newName;
  medications[index].dosage = newDosage;
  medications[index].time = newTime;
  medications[index].frequency = newFrequency;
  medications[index].dayOfWeek = newFrequency === 'weekly' ? parseInt(newDayOfWeek) : null;
  medications[index].dayOfMonth = newFrequency === 'monthly' ? parseInt(newDayOfMonth) : null;
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
  const yesterdayStr = formatDateLocal(yesterday);

  if (med.lastTaken === yesterdayStr) {
    med.streak += 1;
  } else {
    med.streak = 1;
  }

  med.lastTaken = today;
  if(!med.history) med.history = [];// safety check for old data without history yet
  med.history.push(today); // new: log this date

  saveToStorage();
  renderList();
}

// Saves the current 'medications' array into localStorage
function saveToStorage() {
  localStorage.setItem('medications', JSON.stringify(medications));
}

// Handle form submission (adding a new medication)
const warningBox = document.getElementById('warning-box');

// Handle form submission (adding a new medication)
form.addEventListener('submit', async function(event) {
  event.preventDefault();

  const medName = nameInput.value;
  const medDosage = dosageInput.value;
  const medTime=timeInput.value;
  const medFrequency = frequencySelect.value; 
  const medDayOfWeek = dayOfWeekSelect.value; 
  const medDayOfMonth = dayOfMonthInput.value;
  // check for duplicates first
  const alreadyExists = medications.some(
    med => med.name.toLowerCase() === medName.toLowerCase()
  );

  if (alreadyExists) {
    showDuplicateError(medName);
    return; // stop here, don't even check interactions
  }
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Checking interactions...';
  submitBtn.disabled = true;

  const existingNames = medications.map(med => med.name);
  const warnings = await checkInteractions(medName, existingNames);

  submitBtn.textContent = originalText;
  submitBtn.disabled = false;
  if (warnings.length > 0) {
    showWarning(warnings, medName, medDosage,medTime,medFrequency,medDayOfWeek,medDayOfMonth);
  } else {
    addMedication(medName, medDosage,medTime,medFrequency,medDayOfWeek,medDayOfMonth);
  }
});


function showDuplicateError(medName) {
  warningBox.innerHTML = '';
  warningBox.classList.remove('hidden');

  const message = document.createElement('div');
  message.textContent = `You've already added ${medName}. You can edit the existing entry instead.`;
  warningBox.appendChild(message);

  const actions = document.createElement('div');
  actions.className = 'warning-actions';

  const okBtn = document.createElement('button');
  okBtn.textContent = 'OK';
  okBtn.className = 'cancel-btn';
  okBtn.addEventListener('click', hideWarning);

  actions.appendChild(okBtn);
  warningBox.appendChild(actions);
}

// Displays the styled warning box with Confirm/Cancel buttons
function showWarning(warnings, medName, medDosage,medTime,medFrequency,medDayOfWeek,medDayOfMonth) {
  warningBox.innerHTML = '';
  warningBox.classList.remove('hidden');

  const message = document.createElement('div');
  message.textContent = warnings.join(' ');
  warningBox.appendChild(message);

  const actions = document.createElement('div');
  actions.className = 'warning-actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Add anyway';
  confirmBtn.className = 'confirm-btn';
  confirmBtn.addEventListener('click', function() {
    addMedication(medName, medDosage,medTime,medFrequency, medDayOfWeek, medDayOfMonth);
    hideWarning();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'cancel-btn';
  cancelBtn.addEventListener('click', hideWarning);

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  warningBox.appendChild(actions);
}

function hideWarning() {
  warningBox.classList.add('hidden');
  warningBox.innerHTML = '';
}

// Actually adds the medication to the list (used both with and without warnings)
function addMedication(medName, medDosage,medTime,medFrequency, medDayOfWeek, medDayOfMonth) {
  medications.push({
    id: Date.now() + Math.random(),
    name: medName,
    dosage: medDosage,
    time:medTime,
    frequency: medFrequency,           
    dayOfWeek: medFrequency === 'weekly' ? parseInt(medDayOfWeek) : null,   
    dayOfMonth: medFrequency === 'monthly' ? parseInt(medDayOfMonth) : null,
    streak: 0,
    lastTaken: null,
    history: [] //New:stores every date this was marked as taken
  });

  saveToStorage();
  renderList();

  nameInput.value = '';
  dosageInput.value = '';
  timeInput.value='';
  frequencySelect.value = 'daily'; 
  dayOfWeekSelect.classList.add('hidden'); 
  dayOfMonthInput.classList.add('hidden');
}
// Converts a 24-hour time string like "20:00" into "8:00 PM"
function formatTime(time24) {
  if (!time24) return 'no time set';

  const [hourStr, minute] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12;
  if (hour === 0) hour = 12; // 0 becomes 12 for 12 AM/PM

  return `${hour}:${minute} ${ampm}`;
}
// Builds a small row of squares representing the last 14 days,
// highlighting which days the medication was taken
function buildHeatmap(history) {
  const container = document.createElement('div');
  container.className = 'heatmap';

  const daysToShow = 14;

  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDateLocal(date);

    const square = document.createElement('div');
    square.className = 'heatmap-square';
    square.title = dateStr; // shows date on hover

    if (history.includes(dateStr)) {
      square.classList.add('taken');
    }

    container.appendChild(square);
  }

  return container;
}
// Render whatever was already saved, as soon as the page loads
renderList();
// Ask the user for permission to show notifications (runs once when page loads)
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Checks all medications every minute — fires a notification if it's time
function checkReminders() {
  const now = Date.now();
  const nowDate = new Date();
  const currentTime = nowDate.toTimeString().slice(0, 5); // "HH:MM"
  const today = getToday();

  medications.forEach(function(med) {
    
    if (med.lastTaken === today) return;

    if (med.snoozeUntil && now < med.snoozeUntil) return;

    
    if (!isDueToday(med, nowDate)) return;

    const isScheduledTime = med.time === currentTime;
    const snoozeJustExpired = med.snoozeUntil && now >= med.snoozeUntil;

    if (isScheduledTime || snoozeJustExpired) {
      med.snoozeUntil = null;
      showReminderNotification(med);
    }
  });
}


function isDueToday(med, date) {
  if (!med.frequency || med.frequency === 'daily') {
    return true; 
  }

  if (med.frequency === 'weekly') {
    return date.getDay() === med.dayOfWeek; 
  }

  if (med.frequency === 'monthly') {
    return date.getDate() === med.dayOfMonth;  
  }

  return true; 
}


// Called when the user clicks Snooze or Stop on a notification
function handleNotificationAction(action, medId) {
  const med = medications.find(m => m.id === medId);
  if (!med) return;

  if (action === 'stop') {
    // Treat "stop" as marking it taken for today, so no more reminders fire
    const index = medications.indexOf(med);
    markAsTaken(index);
  } else if (action === 'snooze') {
    // Snooze: remind again in 10 minutes by temporarily overriding the time check
    med.snoozeUntil = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    saveToStorage();
  }
}

// Shows a notification WITH Snooze/Stop buttons, via the service worker
function showReminderNotification(med) {
  if (Notification.permission !== 'granted') return;

  navigator.serviceWorker.ready.then(function(registration) {
    registration.showNotification('Medication Reminder 💊', {
      body: `Time to take ${med.name} — ${med.dosage}`,
      data: { medId: med.id },
      actions: [
        { action: 'snooze', title: 'Snooze 10 min' },
        { action: 'stop', title: 'Mark as taken' }
      ]
    });
  });
}


// Ask for permission as soon as the page loads
requestNotificationPermission();

// Check every 60 seconds (60000 milliseconds) if it's time for a reminder
setInterval(checkReminders, 60000);