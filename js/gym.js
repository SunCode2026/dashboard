let historyFilterDate = null;
const WEEKDAYS = [
  { d: 1, label: 'L' }, { d: 2, label: 'M' }, { d: 3, label: 'X' }, { d: 4, label: 'J' },
  { d: 5, label: 'V' }, { d: 6, label: 'S' }, { d: 0, label: 'D' },
];

function renderGym() {
  const routines = Store.data.routines;
  const sessions = [...Store.data.sessions].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = historyFilterDate ? sessions.filter((s) => s.date === historyFilterDate) : sessions;
  const records = exerciseRecords();

  return `
    <div class="page">
      <h1 class="page-title">Gym</h1>

      <div class="fab-row" style="padding-top:0">
        <button class="btn btn-primary" onclick="openLogSessionSheet()">+ Registrar sesión</button>
      </div>

      <div class="group-label">Rutinas</div>
      ${routines.length
        ? `<div class="group">${routines.map(routineRow).join('')}</div>`
        : `<p class="empty-state">Crea tu primera rutina.</p>`}
      <div class="fab-row">
        <button class="btn btn-text" onclick="openAddRoutineSheet()">+ Nueva rutina</button>
      </div>

      ${records.length ? `
        <div class="group-label">Récords</div>
        <div class="group">${records.map(([name, w]) => `
          <div class="row"><span class="row-title">${escapeHtml(name)}</span><span class="row-value">${w} kg</span></div>
        `).join('')}</div>` : ''}

      <div class="group-label">Historial</div>
      <div class="group">
        <div class="row">
          <span class="row-title">Filtrar por fecha</span>
          <input type="date" class="field" style="width:auto" value="${historyFilterDate || ''}" onchange="setHistoryFilter(this.value)">
        </div>
      </div>
      ${filtered.length
        ? `<div class="group" style="margin-top:12px">${filtered.map(sessionRow).join('')}</div>`
        : `<p class="empty-state">${historyFilterDate ? 'Sin sesiones ese día.' : 'Aún no hay sesiones registradas.'}</p>`}
    </div>`;
}

function routineRow(r) {
  return `
    <button class="row" style="width:100%" onclick="openEditRoutineSheet('${r.id}')">
      <span class="row-title">${escapeHtml(r.name)}</span>
      <span class="row-value">${r.exercises.length} ej.</span>
      <span class="chevron">›</span>
    </button>`;
}

function sessionRow(s) {
  return `
    <button class="row" style="width:100%" onclick="openSessionDetail('${s.id}')">
      <span class="row-title">
        <div>${formatDateLong(s.date)}</div>
        <div class="row-sub">${escapeHtml(s.routineName)} · ${s.entries.length} ejercicio${s.entries.length === 1 ? '' : 's'}</div>
      </span>
      <span class="chevron">›</span>
    </button>`;
}

function exerciseRecords() {
  const max = {};
  Store.data.sessions.forEach((s) => s.entries.forEach((e) => {
    const w = Math.max(0, ...e.sets.map((x) => x.weight));
    if (w > 0 && (!max[e.exerciseName] || w > max[e.exerciseName])) max[e.exerciseName] = w;
  }));
  return Object.entries(max).sort((a, b) => b[1] - a[1]);
}

function setHistoryFilter(v) {
  historyFilterDate = v || null;
  renderTab('gym');
}

// ---- rutinas ----
function openAddRoutineSheet() {
  openSheet('Nueva rutina', routineFormHtml());
}

function openEditRoutineSheet(id) {
  openSheet('Editar rutina', routineFormHtml(Store.data.routines.find((r) => r.id === id)));
}

function routineFormHtml(r) {
  const names = r ? r.exercises.map((e) => e.name) : [''];
  return `
    <div class="field-label">Nombre</div>
    <input class="field" id="routine-name" value="${r ? escapeHtml(r.name) : ''}" placeholder="Ej. Push">
    <div class="field-label">Ejercicios</div>
    <div id="exercise-fields">${names.map(exerciseFieldRow).join('')}</div>
    <button type="button" class="btn-text" onclick="document.getElementById('exercise-fields').insertAdjacentHTML('beforeend', exerciseFieldRow(''))">+ Añadir ejercicio</button>
    <div class="field-label">Días programados (opcional)</div>
    <div class="emoji-grid day-grid" id="day-grid">
      ${WEEKDAYS.map(({ d, label }) => `<button type="button" class="emoji-pick ${r && (r.days || []).includes(d) ? 'selected' : ''}" data-day="${d}" onclick="this.classList.toggle('selected')">${label}</button>`).join('')}
    </div>
    <div style="padding-top:24px">
      <button class="btn btn-primary" onclick="saveRoutineForm(${r ? `'${r.id}'` : 'null'})">Guardar</button>
    </div>
    ${r ? `<div style="padding-top:8px"><button class="btn btn-destructive" style="width:100%" onclick="deleteRoutine('${r.id}')">Eliminar rutina</button></div>` : ''}`;
}

function exerciseFieldRow(name) {
  return `<div style="display:flex;gap:8px;margin-bottom:8px">
    <input class="field" style="flex:1" value="${escapeHtml(name)}" placeholder="Ej. Press banca">
    <button type="button" class="btn-text" onclick="this.parentElement.remove()" aria-label="Quitar ejercicio">✕</button>
  </div>`;
}

function saveRoutineForm(id) {
  const name = document.getElementById('routine-name').value.trim();
  const exerciseNames = [...document.querySelectorAll('#exercise-fields input')].map((i) => i.value.trim()).filter(Boolean);
  const days = [...document.querySelectorAll('#day-grid .selected')].map((b) => Number(b.dataset.day));
  if (!name || !exerciseNames.length) return;
  if (id) {
    const r = Store.data.routines.find((x) => x.id === id);
    r.name = name;
    r.exercises = exerciseNames.map((n) => ({ id: uid(), name: n }));
    r.days = days;
  } else {
    Store.data.routines.push({ id: uid(), name, exercises: exerciseNames.map((n) => ({ id: uid(), name: n })), days });
  }
  Store.save();
  closeSheet();
}

function deleteRoutine(id) {
  if (!confirm('¿Eliminar esta rutina? Las sesiones ya registradas se conservan.')) return;
  Store.data.routines = Store.data.routines.filter((r) => r.id !== id);
  Store.save();
  closeSheet();
}

// ---- registrar sesión ----
function openLogSessionSheet() {
  const rows = Store.data.routines.map((r) => `
    <button class="row" style="width:100%" onclick="openSessionForm('${r.id}')">
      <span class="row-title">${escapeHtml(r.name)}</span>
      <span class="chevron">›</span>
    </button>`).join('');
  openSheet('Elegir rutina', `
    <div class="group">
      ${rows}
      <button class="row" style="width:100%" onclick="openSessionForm(null)">
        <span class="row-title">Sesión libre</span>
        <span class="chevron">›</span>
      </button>
    </div>`);
}

function openSessionForm(routineId) {
  const routine = routineId ? Store.data.routines.find((r) => r.id === routineId) : null;
  const names = routine ? routine.exercises.map((e) => e.name) : [''];
  openSheet(routine ? escapeHtml(routine.name) : 'Sesión libre', `
    <div class="field-label">Fecha</div>
    <input class="field" type="date" id="session-date" value="${todayStr()}" max="${todayStr()}">
    <div class="field-label">Ejercicios</div>
    <div id="session-exercises">${names.map(exerciseLogBlock).join('')}</div>
    <button type="button" class="btn-text" onclick="addFreeExercise()">+ Añadir ejercicio</button>
    <div style="padding-top:24px">
      <button class="btn btn-primary" onclick="saveSession(${routine ? `'${routine.id}'` : 'null'})">Guardar sesión</button>
    </div>`);
}

function exerciseLogBlock(name) {
  return `<div class="card exercise-log" style="margin-bottom:12px">
    <input class="field" style="font-weight:600;margin-bottom:10px" value="${escapeHtml(name)}" placeholder="Nombre del ejercicio">
    <div class="set-rows">${setRowHtml(1)}</div>
    <button type="button" class="btn-text" onclick="addSetRow(this)">+ Serie</button>
  </div>`;
}

function setRowHtml(n) {
  return `<div class="set-row" style="display:flex;gap:8px;margin-bottom:6px;align-items:center">
    <span style="width:20px;flex-shrink:0;color:var(--label-2);font-size:13px">${n}</span>
    <input class="field" type="number" inputmode="numeric" min="0" placeholder="Reps" style="flex:1">
    <input class="field" type="number" inputmode="decimal" min="0" step="0.5" placeholder="Kg" style="flex:1">
  </div>`;
}

function addSetRow(btn) {
  const rows = btn.closest('.exercise-log').querySelector('.set-rows');
  rows.insertAdjacentHTML('beforeend', setRowHtml(rows.children.length + 1));
}

function addFreeExercise() {
  document.getElementById('session-exercises').insertAdjacentHTML('beforeend', exerciseLogBlock(''));
}

function saveSession(routineId) {
  const routine = routineId ? Store.data.routines.find((r) => r.id === routineId) : null;
  const date = document.getElementById('session-date').value || todayStr();
  const entries = [...document.querySelectorAll('.exercise-log')].map((card) => {
    const name = card.querySelector('input.field').value.trim();
    const sets = [...card.querySelectorAll('.set-row')].map((row) => {
      const [repsInput, weightInput] = row.querySelectorAll('input');
      const reps = parseFloat(repsInput.value) || 0;
      const weight = parseFloat(weightInput.value) || 0;
      return reps || weight ? { reps, weight } : null;
    }).filter(Boolean);
    return name && sets.length ? { exerciseName: name, sets } : null;
  }).filter(Boolean);
  if (!entries.length) { alert('Registra al menos un ejercicio con series.'); return; }
  Store.data.sessions.push({
    id: uid(), date,
    routineId: routine ? routine.id : null,
    routineName: routine ? routine.name : 'Sesión libre',
    entries,
  });
  Store.save();
  closeSheet();
}

// ---- historial ----
function openSessionDetail(id) {
  const s = Store.data.sessions.find((x) => x.id === id);
  const body = s.entries.map((e) => `
    <div class="card" style="margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:6px">${escapeHtml(e.exerciseName)}</div>
      ${e.sets.map((set, i) => `<div class="row-sub">Serie ${i + 1}: ${set.reps} reps × ${set.weight} kg</div>`).join('')}
    </div>`).join('');
  openSheet(formatDateLong(s.date), `
    <div class="field-label" style="padding-top:0">${escapeHtml(s.routineName)}</div>
    ${body}
    <button class="btn btn-destructive" style="width:100%;margin-top:8px" onclick="deleteSession('${s.id}')">Eliminar sesión</button>`);
}

function deleteSession(id) {
  if (!confirm('¿Eliminar esta sesión?')) return;
  Store.data.sessions = Store.data.sessions.filter((s) => s.id !== id);
  Store.save();
  closeSheet();
}
