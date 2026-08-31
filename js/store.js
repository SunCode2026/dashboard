// Persistencia local: un único blob JSON en localStorage.
const STORAGE_KEY = 'dashboard-data-v1';
const THEME_KEY = 'dashboard-theme-v1';

// 'system' | 'light' | 'dark'. El <script> inline en <head> ya aplica esto
// antes del primer pintado para no dar un flash del tema equivocado.
function getThemePref() {
  return localStorage.getItem(THEME_KEY) || 'system';
}

function setThemePref(pref) {
  if (pref === 'system') {
    localStorage.removeItem(THEME_KEY);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem(THEME_KEY, pref);
    document.documentElement.dataset.theme = pref;
  }
  Store.notify();
}

function emptyData() {
  return {
    habits: [],       // {id, name, icon, createdAt}
    habitLogs: {},     // {habitId: ["2026-08-31", ...]}
    routines: [],      // {id, name, exercises: [{id, name}], days: [0-6, 0=domingo]}
    sessions: [],       // {id, date, routineId, routineName, entries:[{exerciseName, sets:[{reps, weight}]}]}
    daily: {},          // {date: {weight, water, mood}}
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return { ...emptyData(), ...JSON.parse(raw) };
  } catch {
    return emptyData();
  }
}

const Store = {
  data: load(),
  listeners: [],

  save() {
    this.saveQuiet();
    this.notify();
  },

  saveQuiet() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },

  notify() {
    this.listeners.forEach((fn) => fn());
  },

  onChange(fn) {
    this.listeners.push(fn);
  },
};

// ---- helpers compartidos ----
function uid() {
  return crypto.randomUUID();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function todayStr(d = new Date()) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10); // YYYY-MM-DD en hora local
}

function lastNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(todayStr(d));
  }
  return days;
}

function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const s = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function weekdayLetter(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
}

// racha de días consecutivos terminando hoy (o ayer si hoy aún no se marcó)
function currentStreak(habitId) {
  const dates = new Set(Store.data.habitLogs[habitId] || []);
  let streak = 0;
  let cursor = new Date();
  // si hoy no está marcado, la racha se cuenta desde ayer hacia atrás
  if (!dates.has(todayStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dates.has(todayStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
