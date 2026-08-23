// ===================== DATA & STORAGE =====================
const STORAGE_KEY = 'gymTracker_v1';

const DEFAULT_EXERCISES = [
  { id: 'leg-press', name: 'Leg Press', category: 'Legs', type: 'strength' },
  { id: 'incline-barbell-bench', name: 'Incline Barbell Bench Press', category: 'Chest', type: 'strength' },
  { id: 'standing-calf', name: 'Standing Calf Raise Machine', category: 'Legs', type: 'strength' },
  { id: 'seated-machine-fly', name: 'Seated Machine Fly', category: 'Chest', type: 'strength' },
  { id: 'crunch-machine', name: 'Crunch Machine', category: 'Abs', type: 'strength' },
  { id: 'cable-curl', name: 'Cable Curl', category: 'Biceps', type: 'strength' },
  { id: 'rope-pushdown', name: 'Rope Push Down', category: 'Triceps', type: 'strength' },
  { id: 'seated-machine-curl', name: 'Seated Machine Curl', category: 'Biceps', type: 'strength' },
  { id: 'seated-tricep-ext', name: 'Seated Tricep Extension Machine', category: 'Triceps', type: 'strength' },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl Machine', category: 'Legs', type: 'strength' },
  { id: 'adductor', name: 'Adductor Machine', category: 'Legs', type: 'strength' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', type: 'strength' },
  { id: 'shoulder-press', name: 'Shoulder Press Machine', category: 'Shoulders', type: 'strength' },
  { id: 'vertical-row', name: 'Vertical Row', category: 'Back', type: 'strength' },
  { id: 'leg-extension', name: 'Leg Extension Machine', category: 'Legs', type: 'strength' },
  { id: 'seated-chest-press', name: 'Seated Machine Chest Press', category: 'Chest', type: 'strength' },
  { id: 'stationary-bike', name: 'Stationary Bike', category: 'Cardio', type: 'cardio' },
  { id: 'elliptical', name: 'Elliptical Trainer', category: 'Cardio', type: 'cardio' },
  { id: 'pilates', name: 'Pilates', category: 'Legs', type: 'cardio' },
  { id: 'basketball', name: 'Basketball', category: 'Cardio', type: 'cardio' },
];

let state = {
  exercises: [],
  sets: [],
  xp: 0,
  level: 1,
  streak: 0,
  lastWorkoutDate: null,
  badges: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      state.exercises = state.exercises || [];
      state.sets = state.sets || [];
      state.badges = state.badges || [];
    } else {
      state.exercises = [...DEFAULT_EXERCISES];
      saveState();
    }
  } catch (e) {
    console.error(e);
    state.exercises = [...DEFAULT_EXERCISES];
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ===================== HELPERS =====================
function getExercise(idOrName) {
  return state.exercises.find(e => e.id === idOrName || e.name === idOrName);
}

function volumeOf(set) {
  if (set.weight && set.reps) return set.weight * set.reps;
  return 0;
}

function formatDate(d) {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

function getCategories() {
  const cats = [...new Set(state.exercises.map(e => e.category))].sort();
  return cats;
}

function populateCategorySelects() {
  const cats = getCategories();
  const options = '<option value="">All</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');

  ['log-category', 'progress-category', 'history-category', 'exercises-filter-category'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const current = el.value;
      el.innerHTML = options;
      if (current && cats.includes(current)) el.value = current;
    }
  });
}

function getExercisesByCategory(category) {
  if (!category) return [...state.exercises].sort((a, b) => a.name.localeCompare(b.name));
  return state.exercises
    .filter(e => e.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Estimated 1RM (Epley formula)
function e1rm(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// ===================== GAMIFICATION =====================
function calcXP(set) {
  if (set.weight && set.reps) {
    return Math.round((set.weight * set.reps) / 8);
  }
  if (set.time) return 30;
  return 10;
}

function addXP(amount) {
  state.xp += amount;
  const needed = state.level * 500;
  while (state.xp >= needed) {
    state.xp -= needed;
    state.level++;
    showToast(`Level up! You are now level ${state.level}`);
  }
  updateStreak();
  checkBadges();
  saveState();
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (!state.lastWorkoutDate) {
    state.streak = 1;
  } else {
    const last = new Date(state.lastWorkoutDate);
    const diff = Math.floor((new Date(today) - last) / 86400000);
    if (diff === 1) state.streak++;
    else if (diff > 1) state.streak = 1;
  }
  state.lastWorkoutDate = today;
}

function checkBadges() {
  const badges = new Set(state.badges);
  if (state.streak >= 3) badges.add('streak3');
  if (state.streak >= 7) badges.add('streak7');
  if (state.level >= 5) badges.add('level5');
  if (state.sets.length >= 50) badges.add('sets50');
  if (state.sets.length >= 200) badges.add('sets200');
  state.badges = [...badges];
}

const BADGE_INFO = {
  streak3: { icon: '🔥', name: '3-Day Streak' },
  streak7: { icon: '🔥', name: '7-Day Streak' },
  level5: { icon: '⭐', name: 'Level 5' },
  sets50: { icon: '💪', name: '50 Sets' },
  sets200: { icon: '🏋️', name: '200 Sets' },
  firstPR: { icon: '🏆', name: 'First PR' }
};

// ===================== NAV =====================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelector(`[data-page="${name}"]`)?.classList.add('active');

  if (name === 'dashboard') renderDashboard();
  if (name === 'history') renderHistory();
  if (name === 'progress') renderProgressPage();
  if (name === 'exercises') renderExercises();
  if (name === 'log') prepareLogForm();
}

// ===================== DASHBOARD =====================
function renderDashboard() {
  document.getElementById('stat-level').textContent = state.level;
  document.getElementById('stat-xp').textContent = state.xp;
  document.getElementById('stat-streak').textContent = state.streak;
  document.getElementById('stat-sets').textContent = state.sets.length;
  const headerLevel = document.getElementById('header-level');
  if (headerLevel) headerLevel.textContent = 'Lv ' + state.level;

  const needed = state.level * 500;
  document.getElementById('xp-fill').style.width = Math.min(100, (state.xp / needed) * 100) + '%';
  document.getElementById('xp-text').textContent = `${state.xp} / ${needed} XP`;

  const recent = [...state.sets].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const cont = document.getElementById('recent-sets');
  if (recent.length === 0) {
    cont.innerHTML = '<div class="empty">No workouts yet. Log your first set!</div>';
  } else {
    cont.innerHTML = recent.map(s => {
      const ex = getExercise(s.exerciseId);
      const name = ex ? ex.name : s.exerciseName || 'Unknown';
      let detail = '';
      if (s.weight && s.reps) detail = `${s.weight} kg × ${s.reps}`;
      else if (s.time) detail = s.time;
      else if (s.distance) detail = `${s.distance} ${s.distanceUnit || ''}`;
      return `<div class="set-item">
        <div><span class="exercise-name">${name}</span><br><span class="set-details">${formatDate(s.date)}</span></div>
        <div class="set-details">${detail}</div>
      </div>`;
    }).join('');
  }

  const badgeCont = document.getElementById('badge-list');
  badgeCont.innerHTML = Object.entries(BADGE_INFO).map(([id, info]) => {
    const earned = state.badges.includes(id);
    return `<div class="badge ${earned ? 'earned' : ''}">${info.icon} ${info.name}</div>`;
  }).join('');
}

// ===================== LOG =====================
function prepareLogForm() {
  populateCategorySelects();
  updateLogExerciseList();
  document.getElementById('log-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('log-weight').value = '';
  document.getElementById('log-reps').value = '';
  document.getElementById('log-comment').value = '';
  document.getElementById('log-distance').value = '';
  document.getElementById('log-time').value = '';
  toggleLogFields();
}

function updateLogExerciseList() {
  const cat = document.getElementById('log-category').value;
  const list = getExercisesByCategory(cat);
  const sel = document.getElementById('log-exercise');
  const prev = sel.value;
  sel.innerHTML = list.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  if (prev && list.some(e => e.id === prev)) sel.value = prev;
  toggleLogFields();
}

function toggleLogFields() {
  const id = document.getElementById('log-exercise').value;
  const ex = getExercise(id);
  const isCardio = ex && ex.type === 'cardio';
  document.getElementById('strength-fields').classList.toggle('hidden', isCardio);
  document.getElementById('cardio-fields').classList.toggle('hidden', !isCardio);
}

function logSet() {
  const exerciseId = document.getElementById('log-exercise').value;
  const date = document.getElementById('log-date').value;
  const weight = parseFloat(document.getElementById('log-weight').value) || null;
  const reps = parseInt(document.getElementById('log-reps').value) || null;
  const distance = parseFloat(document.getElementById('log-distance').value) || null;
  const time = document.getElementById('log-time').value || null;
  const comment = document.getElementById('log-comment').value || null;

  if (!exerciseId || !date) {
    showToast('Please select exercise and date');
    return;
  }

  const ex = getExercise(exerciseId);
  const set = {
    id: uid(),
    date,
    exerciseId,
    exerciseName: ex ? ex.name : '',
    weight,
    reps,
    distance,
    distanceUnit: distance ? 'km' : null,
    time,
    comment,
    volume: weight && reps ? weight * reps : 0
  };

  let isPR = false;
  if (weight && reps) {
    const prev = state.sets.filter(s => s.exerciseId === exerciseId && s.weight);
    const maxW = prev.reduce((m, s) => Math.max(m, s.weight || 0), 0);
    if (weight > maxW) {
      isPR = true;
      if (!state.badges.includes('firstPR')) state.badges.push('firstPR');
    }
  }

  state.sets.push(set);
  const xpGained = calcXP(set);
  addXP(xpGained);
  saveState();

  showToast(isPR ? `🏆 New PR! +${xpGained} XP` : `Set logged! +${xpGained} XP`);
  prepareLogForm();
}

// ===================== HISTORY =====================
function renderHistory() {
  populateCategorySelects();
  const catFilter = document.getElementById('history-category').value;
  const cont = document.getElementById('history-list');

  let sets = state.sets;
  if (catFilter) {
    const exIds = new Set(state.exercises.filter(e => e.category === catFilter).map(e => e.id));
    sets = sets.filter(s => exIds.has(s.exerciseId));
  }

  if (sets.length === 0) {
    cont.innerHTML = '<div class="empty">No history yet</div>';
    return;
  }

  const byDate = {};
  sets.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  cont.innerHTML = dates.map(date => {
    const daySets = byDate[date];
    const totalVol = daySets.reduce((sum, s) => sum + (s.volume || 0), 0);
    return `<div class="workout-day">
      <div class="day-header">
        <span>${formatDate(date)}</span>
        <span class="text-muted">${daySets.length} sets${totalVol ? ' · ' + Math.round(totalVol) + ' kg vol' : ''}</span>
      </div>
      ${daySets.map(s => {
        const ex = getExercise(s.exerciseId);
        const name = ex ? ex.name : s.exerciseName || 'Unknown';
        let detail = '';
        if (s.weight && s.reps) detail = `${s.weight} kg × ${s.reps}`;
        else if (s.time) detail = s.time + (s.distance ? ` · ${s.distance}${s.distanceUnit || ''}` : '');
        else if (s.distance) detail = `${s.distance} ${s.distanceUnit || ''}`;
        return `<div class="set-item">
          <div>
            <span class="exercise-name">${name}</span>
            ${ex ? `<span class="category-tag">${ex.category}</span>` : ''}
            ${s.comment ? `<br><span class="set-details">${s.comment}</span>` : ''}
          </div>
          <div class="set-details">${detail}</div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}

// ===================== PROGRESS / GRAPHS =====================
let progressChart = null;

function renderProgressPage() {
  populateCategorySelects();
  updateProgressExerciseList();
  // hide detail cards until exercise selected
  document.getElementById('pr-card').style.display = 'none';
  document.getElementById('ex-history-card').style.display = 'none';
  if (progressChart) {
    progressChart.destroy();
    progressChart = null;
  }
}

function updateProgressExerciseList() {
  const cat = document.getElementById('progress-category').value;
  const list = getExercisesByCategory(cat).filter(e => e.type === 'strength');
  const sel = document.getElementById('progress-exercise');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Select exercise…</option>' +
    list.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  if (prev && list.some(e => e.id === prev)) {
    sel.value = prev;
    updateChart();
  }
}

function getSessionAggregates(exerciseId) {
  // Group sets by date for this exercise → one "session" per day
  const relevant = state.sets
    .filter(s => s.exerciseId === exerciseId && s.weight && s.reps)
    .sort((a, b) => a.date.localeCompare(b.date));

  const byDate = {};
  relevant.forEach(s => {
    if (!byDate[s.date]) {
      byDate[s.date] = {
        date: s.date,
        maxWeight: 0,
        maxReps: 0,
        volume: 0,
        totalReps: 0,
        sets: [],
        bestE1rm: 0,
        maxWeightAt8: 0   // max weight where reps >= 8
      };
    }
    const d = byDate[s.date];
    d.maxWeight = Math.max(d.maxWeight, s.weight);
    d.maxReps = Math.max(d.maxReps, s.reps);
    d.volume += s.volume;
    d.totalReps += s.reps;
    d.sets.push(s);
    d.bestE1rm = Math.max(d.bestE1rm, e1rm(s.weight, s.reps));
    if (s.reps >= 8) d.maxWeightAt8 = Math.max(d.maxWeightAt8, s.weight);
  });

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

function updateChart() {
  const exerciseId = document.getElementById('progress-exercise').value;
  const metric = document.getElementById('progress-metric').value;
  const ctx = document.getElementById('progress-chart').getContext('2d');

  if (progressChart) {
    progressChart.destroy();
    progressChart = null;
  }

  if (!exerciseId) {
    document.getElementById('pr-card').style.display = 'none';
    document.getElementById('ex-history-card').style.display = 'none';
    return;
  }

  const sessions = getSessionAggregates(exerciseId);
  if (sessions.length === 0) {
    showToast('No strength data for this exercise yet');
    document.getElementById('pr-card').style.display = 'none';
    document.getElementById('ex-history-card').style.display = 'none';
    return;
  }

  const labels = sessions.map(s => s.date.slice(5)); // MM-DD
  let data, label, color;

  switch (metric) {
    case 'maxWeight':
      data = sessions.map(s => s.maxWeight);
      label = 'Max Weight (kg)';
      color = '#3b82f6';
      break;
    case 'e1rm':
      data = sessions.map(s => s.bestE1rm);
      label = 'Estimated 1RM (kg)';
      color = '#22c55e';
      break;
    case 'maxReps':
      data = sessions.map(s => s.maxReps);
      label = 'Max Reps';
      color = '#f59e0b';
      break;
    case 'sessionVolume':
      data = sessions.map(s => Math.round(s.volume));
      label = 'Session Volume (kg)';
      color = '#8b5cf6';
      break;
    case 'sessionReps':
      data = sessions.map(s => s.totalReps);
      label = 'Session Total Reps';
      color = '#ec4899';
      break;
    case 'maxWeightAtReps':
      data = sessions.map(s => s.maxWeightAt8 || null);
      label = 'Max Weight @ ≥8 reps (kg)';
      color = '#06b6d4';
      break;
    default:
      data = sessions.map(s => s.maxWeight);
      label = 'Max Weight (kg)';
      color = '#3b82f6';
  }

  progressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: color + '33',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => sessions[items[0].dataIndex].date
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#9aa0a6', maxRotation: 45 },
          grid: { color: '#2e333d' }
        },
        y: {
          ticks: { color: '#9aa0a6' },
          grid: { color: '#2e333d' },
          beginAtZero: false
        }
      }
    }
  });

  // Render PRs + history for this exercise
  renderExerciseDetails(exerciseId, sessions);
}

function renderExerciseDetails(exerciseId, sessions) {
  const ex = getExercise(exerciseId);
  const prCard = document.getElementById('pr-card');
  const histCard = document.getElementById('ex-history-card');
  prCard.style.display = 'block';
  histCard.style.display = 'block';

  // Calculate lifetime PRs
  let allTimeMaxWeight = 0;
  let allTimeMaxVolume = 0;
  let allTimeBestE1rm = 0;
  let allTimeMaxReps = 0;
  let bestWeightAt8 = 0;
  let prDateWeight = '', prDateVol = '', prDateE1rm = '';

  sessions.forEach(s => {
    if (s.maxWeight > allTimeMaxWeight) {
      allTimeMaxWeight = s.maxWeight;
      prDateWeight = s.date;
    }
    if (s.volume > allTimeMaxVolume) {
      allTimeMaxVolume = s.volume;
      prDateVol = s.date;
    }
    if (s.bestE1rm > allTimeBestE1rm) {
      allTimeBestE1rm = s.bestE1rm;
      prDateE1rm = s.date;
    }
    allTimeMaxReps = Math.max(allTimeMaxReps, s.maxReps);
    bestWeightAt8 = Math.max(bestWeightAt8, s.maxWeightAt8 || 0);
  });

  document.getElementById('pr-list').innerHTML = `
    <div class="set-item"><div>Max Weight</div><div class="pr">${allTimeMaxWeight} kg <span class="text-muted">(${prDateWeight})</span></div></div>
    <div class="set-item"><div>Best Est. 1RM</div><div class="pr">${allTimeBestE1rm} kg <span class="text-muted">(${prDateE1rm})</span></div></div>
    <div class="set-item"><div>Best Session Volume</div><div class="pr">${Math.round(allTimeMaxVolume)} kg <span class="text-muted">(${prDateVol})</span></div></div>
    <div class="set-item"><div>Max Reps (any set)</div><div class="pr">${allTimeMaxReps}</div></div>
    <div class="set-item"><div>Max Weight @ ≥8 reps</div><div class="pr">${bestWeightAt8 || '—'} kg</div></div>
  `;

  // Recent history (last 8 sessions)
  const recentSessions = [...sessions].reverse().slice(0, 8);
  document.getElementById('ex-history-list').innerHTML = recentSessions.map(s => {
    const setSummary = s.sets.map(set => `${set.weight}×${set.reps}`).join(', ');
    return `<div class="set-item">
      <div>
        <span class="exercise-name">${formatDate(s.date)}</span><br>
        <span class="set-details">${setSummary}</span>
      </div>
      <div class="set-details" style="text-align:right">
        Vol ${Math.round(s.volume)} kg<br>
        Max ${s.maxWeight} kg
      </div>
    </div>`;
  }).join('');
}

// ===================== EXERCISES =====================
function renderExercises() {
  populateCategorySelects();
  const catFilter = document.getElementById('exercises-filter-category').value;
  const cont = document.getElementById('exercise-list');
  let list = getExercisesByCategory(catFilter);

  // Group by category for nicer display when "All"
  if (!catFilter) {
    const byCat = {};
    list.forEach(e => {
      if (!byCat[e.category]) byCat[e.category] = [];
      byCat[e.category].push(e);
    });
    cont.innerHTML = Object.keys(byCat).sort().map(cat => `
      <div style="margin-bottom:14px">
        <div class="card-title" style="margin-bottom:6px">${cat}</div>
        ${byCat[cat].map(e => exerciseItemHtml(e)).join('')}
      </div>
    `).join('');
  } else {
    cont.innerHTML = list.map(e => exerciseItemHtml(e)).join('');
  }
}

function exerciseItemHtml(e) {
  return `<div class="exercise-item">
    <div>
      <strong>${e.name}</strong>
      <span class="category-tag">${e.category}</span>
      <div class="text-muted" style="font-size:0.75rem">${e.type}</div>
    </div>
    <button class="btn btn-sm btn-secondary" onclick="deleteExercise('${e.id}')">Delete</button>
  </div>`;
}

function addExercise() {
  const name = document.getElementById('new-ex-name').value.trim();
  const category = document.getElementById('new-ex-category').value;
  const type = document.getElementById('new-ex-type').value;
  if (!name) {
    showToast('Enter a name');
    return;
  }
  if (state.exercises.some(e => e.name.toLowerCase() === name.toLowerCase())) {
    showToast('Exercise already exists');
    return;
  }
  state.exercises.push({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    category,
    type
  });
  saveState();
  document.getElementById('new-ex-name').value = '';
  populateCategorySelects();
  renderExercises();
  showToast('Exercise added');
}

function deleteExercise(id) {
  if (!confirm('Delete this exercise? Existing sets will keep the name but lose the link.')) return;
  state.exercises = state.exercises.filter(e => e.id !== id);
  saveState();
  populateCategorySelects();
  renderExercises();
}

// ===================== IMPORT / EXPORT =====================
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gym-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported!');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.sets && data.exercises) {
        state = data;
        saveState();
        showToast(`Imported ${state.sets.length} sets`);
        showPage('dashboard');
      } else {
        showToast('Invalid backup file');
      }
    } catch {
      showToast('Could not parse JSON');
    }
  };
  reader.readAsText(file);
}

function importFitNotesCSV(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      showToast('Empty or invalid CSV');
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const dateIdx = headers.indexOf('Date');
    const exIdx = headers.indexOf('Exercise');
    const catIdx = headers.indexOf('Category');
    const wIdx = headers.indexOf('Weight');
    const rIdx = headers.indexOf('Reps');
    const dIdx = headers.indexOf('Distance');
    const tIdx = headers.indexOf('Time');
    const cIdx = headers.indexOf('Comment');

    let added = 0;
    const exerciseMap = {};
    state.exercises.forEach(e => { exerciseMap[e.name.toLowerCase()] = e.id; });

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const get = (idx) => {
        if (idx < 0 || idx >= cols.length) return '';
        return cols[idx].replace(/^"|"$/g, '').trim();
      };

      const date = get(dateIdx);
      const name = get(exIdx);
      const category = get(catIdx) || 'Other';
      if (!date || !name) continue;

      let exerciseId = exerciseMap[name.toLowerCase()];
      if (!exerciseId) {
        const type = (category === 'Cardio' || /bike|run|elliptical|pilates|basketball/i.test(name)) ? 'cardio' : 'strength';
        exerciseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        state.exercises.push({ id: exerciseId, name, category, type });
        exerciseMap[name.toLowerCase()] = exerciseId;
      }

      const weight = parseFloat(get(wIdx)) || null;
      const reps = parseInt(parseFloat(get(rIdx))) || null;
      const distance = parseFloat(get(dIdx)) || null;
      const time = get(tIdx) || null;
      const comment = get(cIdx) || null;

      state.sets.push({
        id: uid(),
        date,
        exerciseId,
        exerciseName: name,
        weight,
        reps,
        distance,
        distanceUnit: distance ? (get(headers.indexOf('Distance Unit')) || 'km') : null,
        time,
        comment,
        volume: weight && reps ? weight * reps : 0
      });
      added++;
    }

    state.xp = Math.min(state.sets.reduce((sum, s) => sum + calcXP(s), 0), 8000);
    state.level = Math.max(1, Math.floor(state.xp / 450) + 1);
    checkBadges();
    saveState();
    populateCategorySelects();
    showToast(`Imported ${added} sets from FitNotes!`);
    showPage('dashboard');
  };
  reader.readAsText(file);
}

function loadProvidedFitNotes() {
  if (!confirm('This will add ~535 sets from your FitNotes export into the app (existing data stays). Continue?')) return;
  if (window.FITNOTES_DATA) {
    processFitNotesArray(window.FITNOTES_DATA);
  } else {
    showToast('Data not embedded. Use the CSV import button instead.');
  }
}

function processFitNotesArray(arr) {
  const exerciseMap = {};
  state.exercises.forEach(e => { exerciseMap[e.name.toLowerCase()] = e.id; });

  let added = 0;
  arr.forEach(row => {
    const name = row.exercise;
    let exerciseId = exerciseMap[name.toLowerCase()];
    if (!exerciseId) {
      const type = (row.category === 'Cardio' || /bike|run|elliptical|pilates|basketball/i.test(name)) ? 'cardio' : 'strength';
      exerciseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      state.exercises.push({ id: exerciseId, name, category: row.category || 'Other', type });
      exerciseMap[name.toLowerCase()] = exerciseId;
    }

    state.sets.push({
      id: uid(),
      date: row.date,
      exerciseId,
      exerciseName: name,
      weight: row.weight,
      reps: row.reps,
      distance: row.distance,
      distanceUnit: row.distanceUnit,
      time: row.time,
      comment: row.comment,
      volume: row.weight && row.reps ? row.weight * row.reps : 0
    });
    added++;
  });

  state.xp = Math.min(state.sets.reduce((s, x) => s + calcXP(x), 0), 8000);
  state.level = Math.max(1, Math.floor(state.xp / 450) + 1);
  checkBadges();
  saveState();
  populateCategorySelects();
  showToast(`Loaded ${added} sets from your FitNotes data!`);
  showPage('dashboard');
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  populateCategorySelects();
  showPage('dashboard');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  // Log page
  document.getElementById('log-category').addEventListener('change', updateLogExerciseList);
  document.getElementById('log-exercise').addEventListener('change', toggleLogFields);
  document.getElementById('btn-log').addEventListener('click', logSet);

  // History filter
  document.getElementById('history-category').addEventListener('change', renderHistory);

  // Progress
  document.getElementById('progress-category').addEventListener('change', updateProgressExerciseList);
  document.getElementById('progress-exercise').addEventListener('change', updateChart);
  document.getElementById('progress-metric').addEventListener('change', updateChart);

  // Exercises
  document.getElementById('btn-add-exercise').addEventListener('click', addExercise);
  document.getElementById('exercises-filter-category').addEventListener('change', renderExercises);

  // Data
  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('import-json').addEventListener('change', e => {
    if (e.target.files[0]) importJSON(e.target.files[0]);
  });
  document.getElementById('import-csv').addEventListener('change', e => {
    if (e.target.files[0]) importFitNotesCSV(e.target.files[0]);
  });
  document.getElementById('btn-load-fitnotes').addEventListener('click', loadProvidedFitNotes);

  document.getElementById('btn-clear').addEventListener('click', () => {
    if (confirm('Delete ALL data? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      state = { exercises: [...DEFAULT_EXERCISES], sets: [], xp: 0, level: 1, streak: 0, lastWorkoutDate: null, badges: [] };
      saveState();
      populateCategorySelects();
      showToast('Data cleared');
      showPage('dashboard');
    }
  });
});
