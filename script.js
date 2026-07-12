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
const SUPABASE_URL = 'https://miwqeuobqfwnadydmamx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f1SkzmVuwotFKHnwcyiqTg_F6BkBEZG';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Grab auth screen elements
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authModeLabel = document.getElementById('auth-mode-label');
let authToggleLink = document.getElementById('auth-toggle-link');
const authToggleText = document.getElementById('auth-toggle-text');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');

let isSignUpMode = false;

function attachToggleListener() {
  authToggleLink = document.getElementById('auth-toggle-link');
  authToggleLink.addEventListener('click', function(event) {
    event.preventDefault();
    isSignUpMode = !isSignUpMode;

    if (isSignUpMode) {
      authModeLabel.textContent = 'Create a new account';
      authSubmitBtn.textContent = 'Sign Up';
      authToggleText.innerHTML = 'Already have an account? <a href="#" id="auth-toggle-link">Log in</a>';
    } else {
      authModeLabel.textContent = 'Log in to your account';
      authSubmitBtn.textContent = 'Log In';
      authToggleText.innerHTML = 'Don\'t have an account? <a href="#" id="auth-toggle-link">Sign up</a>';
    }

    attachToggleListener();
  });
}
attachToggleListener();

authSubmitBtn.addEventListener('click', async function() {
  const email = authEmailInput.value;
  const password = authPasswordInput.value;

  authError.classList.add('hidden');

  if (isSignUpMode) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      showAuthError(getFriendlyAuthError(error.message));
    } else {
      showAuthError('Account created! Check your email to confirm, then log in.');
    }
  } else {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      showAuthError(getFriendlyAuthError(error.message));
    } else {
      onLoginSuccess();
    }
  }
});

// Translates common Supabase error messages into friendlier, plain-English versions
function getFriendlyAuthError(message) {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (lower.includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the confirmation link.';
  }
  if (lower.includes('unable to validate email address')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('email rate limit exceeded')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }

  // Fallback: show the original message if we don't have a friendlier version
  return message;
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove('hidden');
}

function onLoginSuccess() {
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  loadUserMedications();
}

logoutBtn.addEventListener('click', async function() {
  await supabaseClient.auth.signOut();
  medications = [];
  appScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
  authEmailInput.value = '';
  authPasswordInput.value = '';
});

supabaseClient.auth.getSession().then(function({ data: { session } }) {
  if (session) {
    onLoginSuccess();
  }
});

// Forgot password flow
const forgotPasswordLink = document.getElementById('forgot-password-link');

forgotPasswordLink.addEventListener('click', async function(event) {
  event.preventDefault();
  const email = authEmailInput.value;
  if (!email) {
    showAuthError('Please enter your email above first, then click "Forgot password?"');
    return;
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  if (error) {
    showAuthError(error.message);
  } else {
    showAuthError('Password reset email sent! Check your inbox.');
  }
});

// Detect if this page load is from a password reset email link
supabaseClient.auth.onAuthStateChange(function(event, session) {
  if (event === 'PASSWORD_RECOVERY') {
    const newPassword = prompt('Enter your new password:');
    if (newPassword) {
      supabaseClient.auth.updateUser({ password: newPassword }).then(function({ error }) {
        if (error) {
          alert('Error updating password: ' + error.message);
        } else {
          alert('Password updated successfully! You can now log in with your new password.');
        }
      });
    }
  }
});

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

// Medications now live in memory, loaded from Supabase
let medications = [];

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

navigator.serviceWorker.addEventListener('message', function(event) {
  const { action, medId } = event.data;
  handleNotificationAction(action, medId);
});

function getToday() {
  return formatDateLocal(new Date());
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getInteractionText(drugName) {
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const result = data.results[0];
  return result.drug_interactions ? result.drug_interactions[0] : null;
}

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

async function loadUserMedications() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data, error } = await supabaseClient
    .from('medications')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error loading medications:', error);
    return;
  }

  medications = data.map(function(row) {
    return {
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      time: row.time,
      frequency: row.frequency,
      dayOfWeek: row.day_of_week,
      dayOfMonth: row.day_of_month,
      streak: row.streak,
      lastTaken: row.last_taken,
      history: row.history || [],
      snoozeUntil: null
    };
  });

  renderList();
}

function renderList() {
  medList.innerHTML = '';

  if (medications.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = 'No medications yet — add one above to get started.';
    emptyMessage.style.color = '#888';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.border = 'none';
    medList.appendChild(emptyMessage);
    return;
  }

  const sortedMedications = [...medications].sort(function(a, b) {
    return (a.time || '').localeCompare(b.time || '');
  });

  sortedMedications.forEach(function(med) {
    const index = medications.indexOf(med);
    const listItem = document.createElement('li');

    if (med.editing) {
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

function toggleEdit(index) {
  medications[index].editing = true;
  renderList();
}

async function saveEdit(index, newName, newDosage, newTime, newFrequency, newDayOfWeek, newDayOfMonth) {
  const med = medications[index];
  med.name = newName;
  med.dosage = newDosage;
  med.time = newTime;
  med.frequency = newFrequency;
  med.dayOfWeek = newFrequency === 'weekly' ? parseInt(newDayOfWeek) : null;
  med.dayOfMonth = newFrequency === 'monthly' ? parseInt(newDayOfMonth) : null;
  med.editing = false;

  const { error } = await supabaseClient
    .from('medications')
    .update({
      name: med.name,
      dosage: med.dosage,
      time: med.time,
      frequency: med.frequency,
      day_of_week: med.dayOfWeek,
      day_of_month: med.dayOfMonth
    })
    .eq('id', med.id);

  if (error) console.error('Error updating medication:', error);

  renderList();
}

async function deleteMedication(index) {
  const med = medications[index];
  const confirmed = confirm(`Remove ${med.name} from your list?`);
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from('medications')
    .delete()
    .eq('id', med.id);

  if (error) {
    console.error('Error deleting medication:', error);
    return;
  }

  medications.splice(index, 1);
  renderList();
}

async function markAsTaken(index) {
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
  if (!med.history) med.history = [];
  med.history.push(today);

  const { error } = await supabaseClient
    .from('medications')
    .update({
      streak: med.streak,
      last_taken: med.lastTaken,
      history: med.history
    })
    .eq('id', med.id);

  if (error) console.error('Error updating medication:', error);

  renderList();
}

const warningBox = document.getElementById('warning-box');

form.addEventListener('submit', async function(event) {
  event.preventDefault();

  const medName = nameInput.value;
  const medDosage = dosageInput.value;
  const medTime = timeInput.value;
  const medFrequency = frequencySelect.value;
  const medDayOfWeek = dayOfWeekSelect.value;
  const medDayOfMonth = dayOfMonthInput.value;

  const alreadyExists = medications.some(
    med => med.name.toLowerCase() === medName.toLowerCase()
  );

  if (alreadyExists) {
    showDuplicateError(medName);
    return;
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
    showWarning(warnings, medName, medDosage, medTime, medFrequency, medDayOfWeek, medDayOfMonth);
  } else {
    addMedication(medName, medDosage, medTime, medFrequency, medDayOfWeek, medDayOfMonth);
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

function showWarning(warnings, medName, medDosage, medTime, medFrequency, medDayOfWeek, medDayOfMonth) {
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
    addMedication(medName, medDosage, medTime, medFrequency, medDayOfWeek, medDayOfMonth);
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

async function addMedication(medName, medDosage, medTime, medFrequency, medDayOfWeek, medDayOfMonth) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    console.error('No logged in user');
    return;
  }

  const { data, error } = await supabaseClient
    .from('medications')
    .insert({
      user_id: user.id,
      name: medName,
      dosage: medDosage,
      time: medTime,
      frequency: medFrequency,
      day_of_week: medFrequency === 'weekly' ? parseInt(medDayOfWeek) : null,
      day_of_month: medFrequency === 'monthly' ? parseInt(medDayOfMonth) : null,
      streak: 0,
      last_taken: null,
      history: []
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding medication:', error);
    return;
  }

  medications.push({
    id: data.id,
    name: data.name,
    dosage: data.dosage,
    time: data.time,
    frequency: data.frequency,
    dayOfWeek: data.day_of_week,
    dayOfMonth: data.day_of_month,
    streak: data.streak,
    lastTaken: data.last_taken,
    history: data.history || [],
    snoozeUntil: null
  });

  renderList();

  nameInput.value = '';
  dosageInput.value = '';
  timeInput.value = '';
  frequencySelect.value = 'daily';
  dayOfWeekSelect.classList.add('hidden');
  dayOfMonthInput.classList.add('hidden');
}

function formatTime(time24) {
  if (!time24) return 'no time set';
  const [hourStr, minute] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

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
    square.title = dateStr;

    if (history.includes(dateStr)) {
      square.classList.add('taken');
    }

    container.appendChild(square);
  }

  return container;
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function checkReminders() {
  const now = Date.now();
  const nowDate = new Date();
  const currentTime = nowDate.toTimeString().slice(0, 5);
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
  if (!med.frequency || med.frequency === 'daily') return true;
  if (med.frequency === 'weekly') return date.getDay() === med.dayOfWeek;
  if (med.frequency === 'monthly') return date.getDate() === med.dayOfMonth;
  return true;
}

function handleNotificationAction(action, medId) {
  const med = medications.find(m => m.id === medId);
  if (!med) return;

  if (action === 'stop') {
    const index = medications.indexOf(med);
    markAsTaken(index);
  } else if (action === 'snooze') {
    med.snoozeUntil = Date.now() + 10 * 60 * 1000;
  }
}

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

requestNotificationPermission();
setInterval(checkReminders, 60000);