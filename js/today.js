function renderToday() {
  const daily = Store.data.daily[todayStr()] || {};
  return `
    <div class="page">
      <h1 class="page-title">${greeting()}</h1>
      <p style="color:var(--label-2);margin:-8px 0 20px;font-size:15px">${formatDateLong(todayStr())}</p>

      ${habitSummaryCard()}
      ${todayRoutineCard()}

      <div class="group-label">Registro rápido</div>
      <div class="card">
        <div class="field-label" style="padding-top:0">Peso corporal (kg)</div>
        <input class="field" type="number" step="0.1" inputmode="decimal" placeholder="Ej. 72.5" value="${daily.weight ?? ''}" onchange="setDaily('weight', this.value)">

        <div class="field-label">Agua (ml)</div>
        <input class="field" type="number" step="50" inputmode="numeric" placeholder="Ej. 2000" value="${daily.water ?? ''}" onchange="setDaily('water', this.value)">

        <div class="field-label">Estado de ánimo</div>
        <div class="emoji-grid" style="grid-template-columns:repeat(5,1fr)">
          ${[1, 2, 3, 4, 5].map((v) => `<button type="button" class="emoji-pick ${Number(daily.mood) === v ? 'selected' : ''}" onclick="setDaily('mood', ${v})">${MOOD_EMOJI[v]}</button>`).join('')}
        </div>
      </div>

      ${appearanceCard()}
    </div>`;
}

function appearanceCard() {
  const pref = getThemePref();
  const options = [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']];
  return `
    <div class="group-label">Apariencia</div>
    <div class="card">
      <div class="emoji-grid" style="grid-template-columns:repeat(3,1fr)">
        ${options.map(([v, label]) => `<button type="button" class="emoji-pick ${pref === v ? 'selected' : ''}" style="font-size:15px;font-weight:500" onclick="setThemePref('${v}')">${label}</button>`).join('')}
      </div>
    </div>`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function habitSummaryCard() {
  const habits = Store.data.habits;
  if (!habits.length) return '';
  const today = todayStr();
  const done = habits.filter((h) => (Store.data.habitLogs[h.id] || []).includes(today)).length;
  const total = habits.length;
  const c = 2 * Math.PI * 40;
  const offset = c * (1 - (total ? done / total : 0));
  return `
    <button class="card" style="width:100%;display:flex;align-items:center;gap:16px;margin-bottom:12px;border:none;text-align:left;cursor:pointer;font:inherit" onclick="showTab('habits')">
      <div class="ring-wrap">
        <svg viewBox="0 0 88 88">
          <circle class="ring-bg" cx="44" cy="44" r="40"></circle>
          <circle class="ring-fg" cx="44" cy="44" r="40" stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="ring-text">${done}/${total}</div>
      </div>
      <div>
        <div style="font-size:17px;font-weight:600">Hábitos de hoy</div>
        <div class="row-sub">${done === total ? '¡Todos completados!' : `${total - done} pendiente${total - done === 1 ? '' : 's'}`}</div>
      </div>
    </button>`;
}

function todayRoutineCard() {
  const dow = new Date().getDay();
  const routine = Store.data.routines.find((r) => (r.days || []).includes(dow));
  if (!routine) return '';
  return `
    <div class="card" style="margin-bottom:12px">
      <div style="font-size:13px;color:var(--label-2);margin-bottom:4px">Hoy toca</div>
      <div style="font-size:17px;font-weight:600;margin-bottom:12px">${escapeHtml(routine.name)}</div>
      <button class="btn btn-primary" onclick="openSessionForm('${routine.id}')">Registrar sesión</button>
    </div>`;
}

function setDaily(field, value) {
  const d = todayStr();
  const day = Store.data.daily[d] || (Store.data.daily[d] = {});
  day[field] = value === '' ? null : Number(value);
  Store.save();
}
