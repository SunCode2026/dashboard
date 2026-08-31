function openSheet(title, bodyHtml) {
  document.getElementById('sheet-root').innerHTML = `
    <div class="sheet" id="active-sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-header">
        <button class="btn-text" onclick="closeSheet()">Cancelar</button>
        <h2>${title}</h2>
        <span style="width:70px"></span>
      </div>
      <div class="sheet-body">${bodyHtml}</div>
    </div>`;
  const backdrop = document.getElementById('sheet-backdrop');
  backdrop.hidden = false;
  backdrop.onclick = closeSheet;
  requestAnimationFrame(() => {
    backdrop.classList.add('show');
    document.getElementById('active-sheet').classList.add('show');
  });
}

function closeSheet() {
  const sheet = document.getElementById('active-sheet');
  const backdrop = document.getElementById('sheet-backdrop');
  if (!sheet) return;
  sheet.classList.remove('show');
  backdrop.classList.remove('show');
  setTimeout(() => {
    document.getElementById('sheet-root').innerHTML = '';
    backdrop.hidden = true;
  }, 320);
}

const renderers = {
  today: () => (typeof renderToday === 'function' ? renderToday() : ''),
  habits: () => (typeof renderHabits === 'function' ? renderHabits() : ''),
  gym: () => (typeof renderGym === 'function' ? renderGym() : ''),
  progress: () => (typeof renderProgress === 'function' ? renderProgress() : ''),
};

function showTab(name) {
  document.querySelectorAll('.view').forEach((v) => {
    v.classList.toggle('active', v.dataset.view === name);
  });
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  renderTab(name);
  location.hash = name;
}

function renderTab(name) {
  const el = document.getElementById('view-' + name);
  if (el) el.innerHTML = renderers[name]();
}

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

Store.onChange(() => {
  const active = document.querySelector('.tab.active');
  if (active) renderTab(active.dataset.tab);
});

const startTab = ['today', 'habits', 'gym', 'progress'].includes(location.hash.slice(1))
  ? location.hash.slice(1)
  : 'today';
showTab(startTab);
