const HABIT_EMOJIS = ['💧', '🏃', '📖', '🧘', '😴', '🥗', '💊', '✍️', '🎯', '☀️', '🦷', '🚶'];
let selectedEmoji = HABIT_EMOJIS[0];

function renderHabits() {
  const habits = Store.data.habits;
  return `
    <div class="page">
      <h1 class="page-title">Hábitos</h1>
      ${habits.length
        ? `<div class="group">${habits.map(habitRow).join('')}</div>`
        : `<p class="empty-state">Aún no tienes hábitos.<br>Añade el primero.</p>`}
      <div class="fab-row">
        <button class="btn btn-primary" onclick="openAddHabitSheet()">+ Añadir hábito</button>
      </div>
    </div>`;
}

function habitRow(h) {
  const done = (Store.data.habitLogs[h.id] || []).includes(todayStr());
  const streak = currentStreak(h.id);
  const doneDates = new Set(Store.data.habitLogs[h.id] || []);
  const dots = lastNDays(7)
    .map((d) => `<span class="dot ${doneDates.has(d) ? 'done' : ''}">${weekdayLetter(d)}</span>`)
    .join('');
  return `
    <div class="row">
      <div class="row-icon">${h.icon}</div>
      <button class="row-title-btn" onclick="openEditHabitSheet('${h.id}')" aria-label="Editar ${escapeHtml(h.name)}">
        <div class="row-title">${escapeHtml(h.name)}</div>
        <div class="row-sub">${streak > 0 ? `🔥 ${streak} día${streak === 1 ? '' : 's'} seguidos` : 'Sin racha'}</div>
        <div class="dots-row" style="margin-top:8px">${dots}</div>
      </button>
      <button class="check-circle ${done ? 'done' : ''}"
        aria-label="${done ? 'Marcado hoy' : 'Marcar hoy'}: ${escapeHtml(h.name)}"
        onclick="toggleHabitToday('${h.id}', this)">
        <svg viewBox="0 0 24 24"><path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5z"/></svg>
      </button>
    </div>`;
}

function toggleHabitToday(id, btn) {
  const today = todayStr();
  const logs = Store.data.habitLogs[id] || (Store.data.habitLogs[id] = []);
  const i = logs.indexOf(today);
  const nowDone = i < 0;
  nowDone ? logs.push(today) : logs.splice(i, 1);
  btn.classList.toggle('done', nowDone); // toggle en el nodo real para que la animación se vea
  Store.saveQuiet();
  clearTimeout(toggleHabitToday._t); // reflejar racha/puntos tras la animación, no antes
  toggleHabitToday._t = setTimeout(() => Store.notify(), 220);
}

function openAddHabitSheet() {
  selectedEmoji = HABIT_EMOJIS[0];
  openSheet('Nuevo hábito', habitFormHtml());
  selectEmoji(selectedEmoji);
}

function openEditHabitSheet(id) {
  const h = Store.data.habits.find((x) => x.id === id);
  selectedEmoji = h.icon;
  openSheet('Editar hábito', habitFormHtml(h));
  selectEmoji(h.icon);
}

function habitFormHtml(h) {
  return `
    <div class="field-label">Nombre</div>
    <input class="field" id="habit-name" value="${h ? escapeHtml(h.name) : ''}" placeholder="Ej. Beber agua" maxlength="40">
    <div class="field-label">Icono</div>
    <div class="emoji-grid">
      ${HABIT_EMOJIS.map((e) => `<button type="button" class="emoji-pick" data-emoji="${e}" onclick="selectEmoji('${e}')">${e}</button>`).join('')}
    </div>
    <div style="padding-top:24px">
      <button class="btn btn-primary" onclick="saveHabitForm(${h ? `'${h.id}'` : 'null'})">Guardar</button>
    </div>
    ${h ? `<div style="padding-top:8px"><button class="btn btn-destructive" style="width:100%" onclick="deleteHabit('${h.id}')">Eliminar hábito</button></div>` : ''}`;
}

function selectEmoji(e) {
  selectedEmoji = e;
  document.querySelectorAll('.emoji-pick').forEach((b) => b.classList.toggle('selected', b.dataset.emoji === e));
}

function saveHabitForm(id) {
  const name = document.getElementById('habit-name').value.trim();
  if (!name) return;
  if (id) {
    const h = Store.data.habits.find((x) => x.id === id);
    h.name = name;
    h.icon = selectedEmoji;
  } else {
    Store.data.habits.push({ id: uid(), name, icon: selectedEmoji, createdAt: todayStr() });
  }
  Store.save();
  closeSheet();
}

function deleteHabit(id) {
  if (!confirm('¿Eliminar este hábito y su historial?')) return;
  Store.data.habits = Store.data.habits.filter((h) => h.id !== id);
  delete Store.data.habitLogs[id];
  Store.save();
  closeSheet();
}
