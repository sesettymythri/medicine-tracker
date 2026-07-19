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
const reportsBtn = document.getElementById('reports-btn');
const closeReportsBtn = document.getElementById('close-reports-btn');
const reportsScreen = document.getElementById('reports-screen');
const reportsSummary = document.getElementById('reports-summary');
const reportsTableBody = document.getElementById('reports-table-body');
const medListForReports = document.getElementById('med-list');
const medFormForReports = document.getElementById('med-form');
const downloadCsvBtn = document.getElementById('download-csv-btn');

const caregiverBtn = document.getElementById('caregiver-btn');
const closeCaregiverBtn = document.getElementById('close-caregiver-btn');
const caregiverScreen = document.getElementById('caregiver-screen');
const caregiverEmailInput = document.getElementById('caregiver-email-input');
const inviteCaregiverBtn = document.getElementById('invite-caregiver-btn');
const caregiverList = document.getElementById('caregiver-list');
const patientsList = document.getElementById('patients-list');

const SUPABASE_URL = 'https://miwqeuobqfwnadydmamx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f1SkzmVuwotFKHnwcyiqTg_F6BkBEZG';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

// Hospital Staff elements
const staffBtn = document.getElementById('staff-btn');
const closeStaffBtn = document.getElementById('close-staff-btn');
const staffScreen = document.getElementById('staff-screen');
const staffEmailInput = document.getElementById('staff-email-input');
const inviteStaffBtn = document.getElementById('invite-staff-btn');
const myStaffList = document.getElementById('my-staff-list');
const staffPatientsList = document.getElementById('staff-patients-list');
const pendingPrescriptionsList = document.getElementById('pending-prescriptions-list');
const prescribeFormSection = document.getElementById('prescribe-form-section');
const prescribingForLabel = document.getElementById('prescribing-for-label');
const prescribeName = document.getElementById('prescribe-name');
const prescribeDosage = document.getElementById('prescribe-dosage');
const prescribeTime = document.getElementById('prescribe-time');
const prescribeFrequency = document.getElementById('prescribe-frequency');
const prescribeDayOfWeek = document.getElementById('prescribe-day-of-week');
const prescribeDayOfMonth = document.getElementById('prescribe-day-of-month');
const prescribeNotes = document.getElementById('prescribe-notes');
const submitPrescriptionBtn = document.getElementById('submit-prescription-btn');
const cancelPrescriptionBtn = document.getElementById('cancel-prescription-btn');

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

  return message;
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove('hidden');
}

async function onLoginSuccess() {
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');

  const { data: { user } } = await supabaseClient.auth.getUser();
  const loggedInAsEl = document.getElementById('logged-in-as');
  if (loggedInAsEl && user) {
    loggedInAsEl.textContent = `Logged in as ${user.email}`;
  }

  loadUserMedications();
}

logoutBtn.addEventListener('click', async function() {
  await supabaseClient.auth.signOut();
  medications = [];
  currentlyViewingPatientId = null;
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

const resetPasswordScreen = document.getElementById('reset-password-screen');
const newPasswordInput = document.getElementById('new-password-input');
const resetPasswordSubmitBtn = document.getElementById('reset-password-submit-btn');
const resetPasswordError = document.getElementById('reset-password-error');

supabaseClient.auth.onAuthStateChange(function(event, session) {
  if (event === 'PASSWORD_RECOVERY') {
    authScreen.classList.add('hidden');
    appScreen.classList.add('hidden');
    resetPasswordScreen.classList.remove('hidden');
  }
});

resetPasswordSubmitBtn.addEventListener('click', async function() {
  const newPassword = newPasswordInput.value;

  if (!newPassword || newPassword.length < 6) {
    resetPasswordError.textContent = 'Password must be at least 6 characters.';
    resetPasswordError.classList.remove('hidden');
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

  if (error) {
    resetPasswordError.textContent = error.message;
    resetPasswordError.classList.remove('hidden');
  } else {
    resetPasswordScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    showAuthError('Password updated successfully! You can now log in.');
    newPasswordInput.value = '';
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

let medications = [];

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

let currentlyViewingPatientId = null;

async function loadUserMedications() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const targetUserId = currentlyViewingPatientId || user.id;

  medList.innerHTML = '<li style="text-align:center; border:none; color:#888;">Loading your medications...</li>';

  const { data, error } = await supabaseClient
    .from('medications')
    .select('*')
    .eq('user_id', targetUserId);

  if (error) {
    console.error('Error loading medications:', error);
    medList.innerHTML = '<li style="text-align:center; border:none; color:#a02020;">Failed to load medications. Please refresh the page.</li>';
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
      fromPrescription: row.from_prescription || false,
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
      const rxBadge = med.fromPrescription ? '🏥 ' : '';
      infoText.textContent = `${rxBadge}${med.name} — ${med.dosage} — ⏰ ${formatTime(med.time)} | Streak: ${med.streak} 🔥`;

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
      editBtn.setAttribute('aria-label', 'Edit this medication');
      editBtn.addEventListener('click', function() {
        toggleEdit(index);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = 'Delete this medication';
      deleteBtn.setAttribute('aria-label', 'Delete this medication');
      deleteBtn.addEventListener('click', function() {
        deleteMedication(index);
      });

      listItem.appendChild(infoText);

      if (!currentlyViewingPatientId) {
        listItem.appendChild(takenBtn);
        listItem.appendChild(editBtn);
        listItem.appendChild(deleteBtn);
      }

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
    fromPrescription: false,
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

let currentReportRows = [];

reportsBtn.addEventListener('click', function() {
  generateReport();
  reportsScreen.classList.remove('hidden');
  medListForReports.classList.add('hidden');
  medFormForReports.classList.add('hidden');
  warningBox.classList.add('hidden');
});

closeReportsBtn.addEventListener('click', function() {
  reportsScreen.classList.add('hidden');
  medListForReports.classList.remove('hidden');
  medFormForReports.classList.remove('hidden');
});

function generateReport() {
  const daysToShow = 14;
  const today = new Date();
  const rows = [];

  let totalTaken = 0;
  let totalMissed = 0;

  medications.forEach(function(med) {
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = formatDateLocal(date);

      if (!isDueToday(med, date)) continue;

      const wasTaken = (med.history || []).includes(dateStr);
      const isPastOrToday = dateStr <= getToday();

      if (wasTaken) {
        totalTaken++;
        rows.push({ date: dateStr, name: med.name, time: med.time, status: 'Taken' });
      } else if (isPastOrToday) {
        totalMissed++;
        rows.push({ date: dateStr, name: med.name, time: med.time, status: 'Missed' });
      }
    }
  });

  rows.sort(function(a, b) {
    return b.date.localeCompare(a.date);
  });

  const totalDoses = totalTaken + totalMissed;
  const consistencyPercent = totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 0;

  currentReportRows = rows;
  renderReportSummary(totalTaken, totalMissed, consistencyPercent);
  renderReportTable(rows);
}

function renderReportSummary(totalTaken, totalMissed, consistencyPercent) {
  reportsSummary.innerHTML = `
    <div class="summary-card">
      <div class="summary-number">${totalTaken}</div>
      <div class="summary-label">Taken (14 days)</div>
    </div>
    <div class="summary-card">
      <div class="summary-number">${totalMissed}</div>
      <div class="summary-label">Missed (14 days)</div>
    </div>
    <div class="summary-card">
      <div class="summary-number">${consistencyPercent}%</div>
      <div class="summary-label">Consistency</div>
    </div>
  `;
}

function renderReportTable(rows) {
  reportsTableBody.innerHTML = '';

  if (rows.length === 0) {
    reportsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">No history yet.</td></tr>';
    return;
  }

  rows.forEach(function(row) {
    const tr = document.createElement('tr');

    const statusClass = row.status === 'Taken' ? 'status-taken' : 'status-missed';
    const statusIcon = row.status === 'Taken' ? '✅' : '❌';

    tr.innerHTML = `
      <td>${formatDateForDisplay(row.date)}</td>
      <td>${row.name}</td>
      <td>${formatTime(row.time)}</td>
      <td class="${statusClass}">${statusIcon} ${row.status}</td>
    `;

    reportsTableBody.appendChild(tr);
  });
}

function formatDateForDisplay(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
}

downloadCsvBtn.addEventListener('click', function() {
  if (currentReportRows.length === 0) {
    alert('No data to export yet.');
    return;
  }

  let csvContent = 'Date,Medicine,Time,Status\n';

  currentReportRows.forEach(function(row) {
    const dateStr = formatDateForDisplay(row.date);
    const timeStr = formatTime(row.time);
    csvContent += `"${dateStr}","${row.name}","${timeStr}","${row.status}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `medication-report-${getToday()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
});

caregiverBtn.addEventListener('click', function() {
  loadCaregiverScreen();
  caregiverScreen.classList.remove('hidden');
  medList.classList.add('hidden');
  medFormForReports.classList.add('hidden');
  warningBox.classList.add('hidden');
});

closeCaregiverBtn.addEventListener('click', function() {
  caregiverScreen.classList.add('hidden');
  medList.classList.remove('hidden');
  if (!currentlyViewingPatientId) {
    medFormForReports.classList.remove('hidden');
  }
});

inviteCaregiverBtn.addEventListener('click', async function() {
  const email = caregiverEmailInput.value.trim();
  if (!email) return;

  const { data: { user } } = await supabaseClient.auth.getUser();

  if (email.toLowerCase() === user.email.toLowerCase()) {
    alert("You can't invite yourself.");
    return;
  }

  const { error } = await supabaseClient
    .from('caregiver_links')
    .insert({
      patient_id: user.id,
      caregiver_email: email.toLowerCase(),
      status: 'pending'
    });

  if (error) {
    alert('Error sending invite: ' + error.message);
    return;
  }

  caregiverEmailInput.value = '';
  loadCaregiverScreen();
});

async function loadCaregiverScreen() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  const { data: myCaregivers } = await supabaseClient
    .from('caregiver_links')
    .select('*')
    .eq('patient_id', user.id);

  caregiverList.innerHTML = '';
  if (!myCaregivers || myCaregivers.length === 0) {
    caregiverList.innerHTML = '<li style="border:none; color:#888;">No caregivers invited yet.</li>';
  } else {
    myCaregivers.forEach(function(link) {
      const li = document.createElement('li');

      const statusClass = link.status === 'accepted' ? 'status-accepted' : 'status-pending';
      const statusText = link.status === 'accepted' ? 'Accepted' : 'Pending';

      li.innerHTML = `
        <span>${link.caregiver_email} <span class="caregiver-status ${statusClass}">${statusText}</span></span>
      `;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'remove-caregiver-btn';
      removeBtn.addEventListener('click', async function() {
        await supabaseClient.from('caregiver_links').delete().eq('id', link.id);
        loadCaregiverScreen();
      });

      li.appendChild(removeBtn);
      caregiverList.appendChild(li);
    });
  }

  const { data: invitesForMe } = await supabaseClient
    .from('caregiver_links')
    .select('*')
    .eq('caregiver_email', user.email.toLowerCase());

  patientsList.innerHTML = '';
  if (!invitesForMe || invitesForMe.length === 0) {
    patientsList.innerHTML = '<li style="border:none; color:#888;">No one has invited you yet.</li>';
  } else {
    for (const link of invitesForMe) {
      if (!link.caregiver_id) {
        await supabaseClient
          .from('caregiver_links')
          .update({ caregiver_id: user.id })
          .eq('id', link.id);
      }

      const li = document.createElement('li');

      if (link.status === 'pending') {
        li.innerHTML = `<span>Invitation from a patient</span>`;

        const acceptBtn = document.createElement('button');
        acceptBtn.textContent = 'Accept';
        acceptBtn.className = 'accept-invite-btn';
        acceptBtn.addEventListener('click', async function() {
          await supabaseClient
            .from('caregiver_links')
            .update({ status: 'accepted', caregiver_id: user.id })
            .eq('id', link.id);
          loadCaregiverScreen();
        });

        li.appendChild(acceptBtn);
      } else {
        li.innerHTML = `<span>Patient (accepted)</span>`;

        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'View';
        viewBtn.className = 'view-patient-btn';
        viewBtn.addEventListener('click', function() {
          switchToPatientView(link.patient_id);
        });

        const leaveBtn = document.createElement('button');
        leaveBtn.textContent = 'Leave';
        leaveBtn.className = 'remove-caregiver-btn';
        leaveBtn.addEventListener('click', async function() {
          const confirmed = confirm('Are you sure you want to stop being a caregiver for this patient?');
          if (!confirmed) return;

          await supabaseClient.from('caregiver_links').delete().eq('id', link.id);
          loadCaregiverScreen();
        });

        li.appendChild(viewBtn);
        li.appendChild(leaveBtn);
      }

      patientsList.appendChild(li);
    }
  }
}

async function switchToPatientView(patientId) {
  currentlyViewingPatientId = patientId;
  caregiverScreen.classList.add('hidden');
  medList.classList.remove('hidden');
  medFormForReports.classList.add('hidden');
  showViewingBanner();
  await loadUserMedications();
}

function switchToOwnView() {
  currentlyViewingPatientId = null;
  medFormForReports.classList.remove('hidden');
  hideViewingBanner();
  loadUserMedications();
}

function showViewingBanner() {
  let banner = document.getElementById('viewing-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'viewing-banner';
    medList.parentNode.insertBefore(banner, medList);
  }
  banner.innerHTML = `<span>👁️ Viewing a patient's medications (read-only)</span>`;
  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back to my medications';
  backBtn.addEventListener('click', switchToOwnView);
  banner.appendChild(backBtn);
}

function hideViewingBanner() {
  const banner = document.getElementById('viewing-banner');
  if (banner) banner.remove();
}

// ===== Hospital Staff / Prescriptions logic =====
let currentlyPrescribingToPatientId = null;

staffBtn.addEventListener('click', function() {
  loadStaffScreen();
  staffScreen.classList.remove('hidden');
  medList.classList.add('hidden');
  medFormForReports.classList.add('hidden');
  warningBox.classList.add('hidden');
});

closeStaffBtn.addEventListener('click', function() {
  staffScreen.classList.add('hidden');
  medList.classList.remove('hidden');
  if (!currentlyViewingPatientId) {
    medFormForReports.classList.remove('hidden');
  }
  prescribeFormSection.classList.add('hidden');
});

inviteStaffBtn.addEventListener('click', async function() {
  const email = staffEmailInput.value.trim();
  if (!email) return;

  const { data: { user } } = await supabaseClient.auth.getUser();

  if (email.toLowerCase() === user.email.toLowerCase()) {
    alert("You can't invite yourself.");
    return;
  }

  const { error } = await supabaseClient
    .from('staff_links')
    .insert({
      patient_id: user.id,
      staff_email: email.toLowerCase(),
      status: 'pending'
    });

  if (error) {
    alert('Error sending invite: ' + error.message);
    return;
  }

  staffEmailInput.value = '';
  loadStaffScreen();
});

async function loadStaffScreen() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  await loadMyStaff(user);
  await loadStaffPatients(user);
  await loadPendingPrescriptions(user);
}

async function loadMyStaff(user) {
  const { data: myStaff } = await supabaseClient
    .from('staff_links')
    .select('*')
    .eq('patient_id', user.id);

  myStaffList.innerHTML = '';
  if (!myStaff || myStaff.length === 0) {
    myStaffList.innerHTML = '<li style="border:none; color:#888;">No hospital staff linked yet.</li>';
    return;
  }

  myStaff.forEach(function(link) {
    const li = document.createElement('li');

    const statusClass = link.status === 'accepted' ? 'status-accepted' : 'status-pending';
    const statusText = link.status === 'accepted' ? 'Accepted' : 'Pending';

    li.innerHTML = `<span>${link.staff_email} <span class="caregiver-status ${statusClass}">${statusText}</span></span>`;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-caregiver-btn';
    removeBtn.addEventListener('click', async function() {
      await supabaseClient.from('staff_links').delete().eq('id', link.id);
      loadStaffScreen();
    });

    li.appendChild(removeBtn);
    myStaffList.appendChild(li);
  });
}

async function loadStaffPatients(user) {
  const { data: invitesForMe } = await supabaseClient
    .from('staff_links')
    .select('*')
    .eq('staff_email', user.email.toLowerCase());

  staffPatientsList.innerHTML = '';
  if (!invitesForMe || invitesForMe.length === 0) {
    staffPatientsList.innerHTML = '<li style="border:none; color:#888;">No patients have linked with you yet.</li>';
    return;
  }

  for (const link of invitesForMe) {
    if (!link.staff_id) {
      await supabaseClient
        .from('staff_links')
        .update({ staff_id: user.id })
        .eq('id', link.id);
    }

    const li = document.createElement('li');

    if (link.status === 'pending') {
      li.innerHTML = `<span>Invitation from a patient</span>`;

      const acceptBtn = document.createElement('button');
      acceptBtn.textContent = 'Accept';
      acceptBtn.className = 'accept-invite-btn';
      acceptBtn.addEventListener('click', async function() {
        await supabaseClient
          .from('staff_links')
          .update({ status: 'accepted', staff_id: user.id })
          .eq('id', link.id);
        loadStaffScreen();
      });

      li.appendChild(acceptBtn);
    } else {
      li.innerHTML = `<span>Patient (linked)</span>`;

      const prescribeBtn = document.createElement('button');
      prescribeBtn.textContent = 'Prescribe';
      prescribeBtn.className = 'prescribe-btn';
      prescribeBtn.addEventListener('click', function() {
        openPrescribeForm(link.patient_id);
      });

      li.appendChild(prescribeBtn);
    }

    staffPatientsList.appendChild(li);
  }
}

async function loadPendingPrescriptions(user) {
  const { data: allPrescriptions } = await supabaseClient
    .from('prescriptions')
    .select('*')
    .eq('patient_id', user.id)
    .order('id', { ascending: false });

  const prescriptions = (allPrescriptions || []).filter(rx => rx.status === 'pending');
  const history = (allPrescriptions || []).filter(rx => rx.status !== 'pending');

  pendingPrescriptionsList.innerHTML = '';
  if (prescriptions.length === 0) {
    pendingPrescriptionsList.innerHTML = '<li style="border:none; color:#888;">No pending prescriptions.</li>';
  } else {
    prescriptions.forEach(function(rx) {
      const li = document.createElement('li');

      const details = document.createElement('div');
      details.className = 'prescription-item-details';
      details.innerHTML = `
        <div>${rx.name} — ${rx.dosage} — ⏰ ${formatTime(rx.time)}</div>
        ${rx.notes ? `<div class="rx-notes">${rx.notes}</div>` : ''}
      `;

      const approveBtn = document.createElement('button');
      approveBtn.textContent = 'Approve';
      approveBtn.className = 'accept-invite-btn';
      approveBtn.addEventListener('click', function() {
        approvePrescription(rx);
      });

      const declineBtn = document.createElement('button');
      declineBtn.textContent = 'Decline';
      declineBtn.className = 'decline-btn';
      declineBtn.addEventListener('click', async function() {
        await supabaseClient.from('prescriptions').update({ status: 'declined' }).eq('id', rx.id);
        loadStaffScreen();
      });

      li.appendChild(details);
      li.appendChild(approveBtn);
      li.appendChild(declineBtn);
      pendingPrescriptionsList.appendChild(li);
    });
  }

  renderPrescriptionHistory(history);
}

function renderPrescriptionHistory(history) {
  let historySection = document.getElementById('prescription-history-section');
  if (!historySection) {
    historySection = document.createElement('div');
    historySection.id = 'prescription-history-section';
    historySection.innerHTML = '<h3>Prescription history</h3><ul id="prescription-history-list"></ul>';
    pendingPrescriptionsList.parentNode.appendChild(historySection);
  }

  const historyList = document.getElementById('prescription-history-list');
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<li style="border:none; color:#888;">No history yet.</li>';
    return;
  }

  history.forEach(function(rx) {
    const li = document.createElement('li');
    const statusClass = rx.status === 'approved' ? 'status-accepted' : 'status-pending';
    li.innerHTML = `<span>${rx.name} — ${rx.dosage} <span class="caregiver-status ${statusClass}">${rx.status}</span></span>`;
    historyList.appendChild(li);
  });
}

async function approvePrescription(rx) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  const { error: insertError } = await supabaseClient
    .from('medications')
    .insert({
      user_id: user.id,
      name: rx.name,
      dosage: rx.dosage,
      time: rx.time,
      frequency: rx.frequency,
      day_of_week: rx.day_of_week,
      day_of_month: rx.day_of_month,
      streak: 0,
      last_taken: null,
      history: [],
      from_prescription: true
    });

  if (insertError) {
    alert('Error approving prescription: ' + insertError.message);
    return;
  }

  await supabaseClient.from('prescriptions').update({ status: 'approved' }).eq('id', rx.id);

  loadStaffScreen();
  loadUserMedications();
}

function openPrescribeForm(patientId) {
  currentlyPrescribingToPatientId = patientId;
  prescribingForLabel.textContent = `Prescribing for patient`;
  prescribeFormSection.classList.remove('hidden');
}

cancelPrescriptionBtn.addEventListener('click', function() {
  prescribeFormSection.classList.add('hidden');
  currentlyPrescribingToPatientId = null;
});

prescribeFrequency.addEventListener('change', function() {
  prescribeDayOfWeek.classList.add('hidden');
  prescribeDayOfMonth.classList.add('hidden');

  if (prescribeFrequency.value === 'weekly') {
    prescribeDayOfWeek.classList.remove('hidden');
  } else if (prescribeFrequency.value === 'monthly') {
    prescribeDayOfMonth.classList.remove('hidden');
  }
});

submitPrescriptionBtn.addEventListener('click', async function() {
  const name = prescribeName.value.trim();
  const dosage = prescribeDosage.value.trim();
  const time = prescribeTime.value;
  const frequency = prescribeFrequency.value;
  const dayOfWeek = prescribeDayOfWeek.value;
  const dayOfMonth = prescribeDayOfMonth.value;
  const notes = prescribeNotes.value.trim();

  if (!name || !dosage || !time) {
    alert('Please fill in medication name, dosage, and time.');
    return;
  }

  const { data: { user } } = await supabaseClient.auth.getUser();

  const { error } = await supabaseClient
    .from('prescriptions')
    .insert({
      patient_id: currentlyPrescribingToPatientId,
      staff_id: user.id,
      name: name,
      dosage: dosage,
      time: time,
      frequency: frequency,
      day_of_week: frequency === 'weekly' ? parseInt(dayOfWeek) : null,
      day_of_month: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
      notes: notes,
      status: 'pending'
    });

  if (error) {
    alert('Error sending prescription: ' + error.message);
    return;
  }

  alert('Prescription sent successfully!');

  prescribeName.value = '';
  prescribeDosage.value = '';
  prescribeTime.value = '';
  prescribeFrequency.value = 'daily';
  prescribeDayOfWeek.classList.add('hidden');
  prescribeDayOfMonth.classList.add('hidden');
  prescribeNotes.value = '';
  prescribeFormSection.classList.add('hidden');
  currentlyPrescribingToPatientId = null;
});

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