const MOOD_EMOJI = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

function renderProgress() {
  requestAnimationFrame(drawAllProgressCharts);
  const names = exerciseNames();
  return `
    <div class="page">
      <h1 class="page-title">Progreso</h1>

      <div class="group-label">Adherencia a hábitos</div>
      <div class="card">${adherenceRows()}</div>

      <div class="group-label">Peso corporal</div>
      <div class="card">${weightData().length ? '<canvas id="weightCanvas"></canvas>' : emptyChart('Registra tu peso desde Hoy.')}</div>

      <div class="group-label">Volumen de entrenamiento (semanal)</div>
      <div class="card">${volumeWeeks().length ? '<canvas id="volumeCanvas"></canvas>' : emptyChart('Aún no hay sesiones registradas.')}</div>

      <div class="group-label">Fuerza por ejercicio</div>
      <div class="card">
        ${names.length ? `
          <select class="field" id="exercise-select" onchange="drawExerciseChart(this.value)" style="margin-bottom:12px">
            ${names.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')}
          </select>
          <canvas id="exerciseCanvas"></canvas>` : emptyChart('Registra sesiones de gym para ver tu progreso.')}
      </div>

      <div class="group-label">Agua</div>
      <div class="card">${waterData().length ? '<canvas id="waterCanvas"></canvas>' : emptyChart('Registra el agua desde Hoy.')}</div>

      <div class="group-label">Estado de ánimo</div>
      <div class="card">${moodData().length ? '<canvas id="moodCanvas"></canvas>' : emptyChart('Registra tu ánimo desde Hoy.')}</div>
    </div>`;
}

function emptyChart(msg) {
  return `<p class="empty-state" style="padding:20px 0">${msg}</p>`;
}

// ---- hábitos ----
function habitAdherence(days) {
  const habits = Store.data.habits;
  if (!habits.length) return null;
  let done = 0;
  lastNDays(days).forEach((d) => habits.forEach((h) => {
    if ((Store.data.habitLogs[h.id] || []).includes(d)) done++;
  }));
  return Math.round((done / (habits.length * days)) * 100);
}

function adherenceRows() {
  const week = habitAdherence(7);
  if (week === null) return `<p class="empty-state" style="padding:8px 0">Aún no tienes hábitos.</p>`;
  return `${adherenceBar('Últimos 7 días', week)}<div style="height:16px"></div>${adherenceBar('Últimos 30 días', habitAdherence(30))}`;
}

function adherenceBar(label, pct) {
  return `
    <div style="display:flex;justify-content:space-between;font-size:15px;margin-bottom:6px">
      <span>${label}</span><span style="color:var(--label-2)">${pct}%</span>
    </div>
    <div style="height:8px;background:var(--fill-track);border-radius:4px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:var(--green);border-radius:4px"></div>
    </div>`;
}

// ---- registro diario (peso / agua / ánimo) ----
function dailySeries(field) {
  return Object.entries(Store.data.daily)
    .filter(([, v]) => v && v[field] != null && v[field] !== '')
    .map(([d, v]) => ({ x: d, y: Number(v[field]) }))
    .sort((a, b) => a.x.localeCompare(b.x));
}
function weightData() { return dailySeries('weight'); }
function waterData() { return dailySeries('water'); }
function moodData() { return dailySeries('mood'); }

// ---- gym ----
function weekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - day);
  return todayStr(d);
}

function volumeWeeks() {
  const totals = {};
  Store.data.sessions.forEach((s) => {
    const wk = weekStart(s.date);
    const vol = s.entries.reduce((sum, e) => sum + e.sets.reduce((a, x) => a + x.reps * x.weight, 0), 0);
    totals[wk] = (totals[wk] || 0) + vol;
  });
  return Object.entries(totals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([wk, vol]) => ({ label: shortDate(wk), value: Math.round(vol) }));
}

function exerciseNames() {
  const set = new Set();
  Store.data.sessions.forEach((s) => s.entries.forEach((e) => set.add(e.exerciseName)));
  return [...set].sort();
}

function exerciseMaxSeries(name) {
  return Store.data.sessions
    .filter((s) => s.entries.some((e) => e.exerciseName === name))
    .map((s) => {
      const entry = s.entries.find((e) => e.exerciseName === name);
      return { x: s.date, y: Math.max(0, ...entry.sets.map((x) => x.weight)) };
    })
    .sort((a, b) => a.x.localeCompare(b.x));
}

function shortDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

// ---- dibujo ----
function drawAllProgressCharts() {
  const w = weightData();
  if (w.length) drawLineChart(document.getElementById('weightCanvas'), w, { formatY: (v) => v.toFixed(1) + ' kg', formatX: shortDate });

  const vol = volumeWeeks();
  if (vol.length) drawBarChart(document.getElementById('volumeCanvas'), vol);

  const names = exerciseNames();
  if (names.length) drawExerciseChart(names[0]);

  const water = waterData();
  if (water.length) drawLineChart(document.getElementById('waterCanvas'), water, { formatY: (v) => v + ' ml', formatX: shortDate });

  const mood = moodData();
  if (mood.length) drawLineChart(document.getElementById('moodCanvas'), mood, { color: cssVar('--orange'), formatY: (v) => MOOD_EMOJI[Math.round(v)] || v, formatX: shortDate });
}

function drawExerciseChart(name) {
  const canvas = document.getElementById('exerciseCanvas');
  if (!canvas) return;
  drawLineChart(canvas, exerciseMaxSeries(name), { formatY: (v) => v + ' kg', formatX: shortDate });
}
