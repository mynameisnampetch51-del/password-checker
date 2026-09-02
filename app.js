const LEVEL_META = {
  weak: { label: 'อ่อน', bg: 'bg-accent-soft', text: 'text-accent-strong', ring: 'ring-accent', bar: 'bg-accent' },
  medium: { label: 'พอใช้', bg: 'bg-warn-soft', text: 'text-warn-ink', ring: 'ring-warn', bar: 'bg-warn' },
  strong: { label: 'แข็งแรง', bg: 'bg-good-soft', text: 'text-good-ink', ring: 'ring-good', bar: 'bg-good' },
};
const MAX_BAR_ENTROPY = 100;

const input = document.querySelector('#PasswordInput');
const toggleBtn = document.querySelector('#ToggleVisibility');
const resultEl = document.querySelector('#Result');

function renderResult(evaluation) {
  if (!evaluation.valid) {
    resultEl.innerHTML = '';
    return;
  }

  const meta = LEVEL_META[evaluation.level];
  const barPct = Math.min(100, Math.round((evaluation.entropy / MAX_BAR_ENTROPY) * 100));

  const card = document.createElement('div');
  card.className = `bg-surface border border-line rounded-2xl shadow-sm p-5 ring-1 ${meta.ring}`;

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between mb-3 gap-3';
  header.innerHTML = `
    <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${meta.bg} ${meta.text}">${meta.label}</span>
    <div class="text-right shrink-0">
      <div class="text-2xl font-display font-semibold">${evaluation.entropy}</div>
      <div class="text-xs text-ink-muted">bits ของ entropy</div>
    </div>
  `;
  card.appendChild(header);

  const barTrack = document.createElement('div');
  barTrack.className = 'h-2 rounded-full bg-surface-2 overflow-hidden mb-4';
  barTrack.innerHTML = `<div class="h-full ${meta.bar}" style="width:${barPct}%"></div>`;
  card.appendChild(barTrack);

  const list = document.createElement('ul');
  list.className = 'flex flex-col gap-2';
  evaluation.checks.forEach((c) => {
    const li = document.createElement('li');
    li.className = `flex gap-2 text-sm px-3 py-2 rounded-lg ${c.triggered ? 'bg-surface-2' : 'bg-accent-soft'}`;
    li.innerHTML = `
      <span class="${c.triggered ? 'text-good' : 'text-accent-strong'} font-bold shrink-0">${c.triggered ? '✓' : '✕'}</span>
      <span>
        <span class="font-medium">${c.label}</span>
        <span class="block text-ink-muted">${c.detail}</span>
      </span>
    `;
    list.appendChild(li);
  });
  card.appendChild(list);

  resultEl.innerHTML = '';
  resultEl.appendChild(card);
}

input.addEventListener('input', () => {
  const evaluation = evaluatePassword(input.value);
  renderResult(evaluation);
});

toggleBtn.addEventListener('click', () => {
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  toggleBtn.textContent = showing ? 'แสดง' : 'ซ่อน';
});
