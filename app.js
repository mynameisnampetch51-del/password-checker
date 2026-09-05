const GAUGE_MAX_BITS = 120;
const GAUGE_CX = 120;
const GAUGE_CY = 150;
const GAUGE_R = 95;
const GAUGE_HALF_SWEEP = 120; // degrees each side of straight-up

const LEVEL_LABELS = { weak: 'อ่อน', medium: 'พอใช้', strong: 'แข็งแรง' };

const input = document.querySelector('#PasswordInput');
const toggleBtn = document.querySelector('#ToggleVisibility');
const copyBtn = document.querySelector('#CopyButton');
const gaugeSvg = document.querySelector('#Gauge');
const bitsValueEl = document.querySelector('#BitsValue');
const statusEl = document.querySelector('#StatusLabel');
const NS = 'http://www.w3.org/2000/svg';

// angle convention: 0deg = straight up, positive = clockwise (matches SVG rotate())
function bitsToAngle(bits) {
  const clamped = Math.max(0, Math.min(GAUGE_MAX_BITS, bits));
  return -GAUGE_HALF_SWEEP + (clamped / GAUGE_MAX_BITS) * (GAUGE_HALF_SWEEP * 2);
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function buildGauge() {
  const zoneR = GAUGE_R;
  const zones = [
    { from: 0, to: LEVEL_THRESHOLDS.weak, color: 'var(--danger)' },
    { from: LEVEL_THRESHOLDS.weak, to: LEVEL_THRESHOLDS.medium, color: 'var(--warn)' },
    { from: LEVEL_THRESHOLDS.medium, to: GAUGE_MAX_BITS, color: 'var(--signal)' },
  ];
  zones.forEach((z) => {
    const path = svgEl('path', {
      class: 'zone',
      d: arcPath(GAUGE_CX, GAUGE_CY, zoneR, bitsToAngle(z.from), bitsToAngle(z.to)),
      stroke: z.color,
      'stroke-width': 14,
    });
    gaugeSvg.appendChild(path);
  });

  for (let bits = 0; bits <= GAUGE_MAX_BITS; bits += 5) {
    const isMajor = bits % 20 === 0;
    const angle = bitsToAngle(bits);
    const outer = polarToCartesian(GAUGE_CX, GAUGE_CY, zoneR - 9, angle);
    const inner = polarToCartesian(GAUGE_CX, GAUGE_CY, zoneR - (isMajor ? 20 : 15), angle);
    gaugeSvg.appendChild(svgEl('line', {
      class: 'tick',
      x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y,
      'stroke-width': isMajor ? 2 : 1,
    }));
    if (isMajor) {
      const labelPos = polarToCartesian(GAUGE_CX, GAUGE_CY, zoneR - 32, angle);
      const label = svgEl('text', { class: 'tick-label', x: labelPos.x, y: labelPos.y + 4 });
      label.textContent = bits;
      gaugeSvg.appendChild(label);
    }
  }

  const needle = svgEl('g', { class: 'needle', style: `transform-origin:${GAUGE_CX}px ${GAUGE_CY}px` });
  needle.appendChild(svgEl('line', { x1: GAUGE_CX, y1: GAUGE_CY, x2: GAUGE_CX, y2: GAUGE_CY - 78 }));
  needle.appendChild(svgEl('circle', { cx: GAUGE_CX, cy: GAUGE_CY, r: 7 }));
  gaugeSvg.appendChild(needle);

  return needle;
}

const needleEl = buildGauge();

function setNeedle(bits) {
  needleEl.style.transform = `rotate(${bitsToAngle(bits)}deg)`;
}

function renderEmpty() {
  setNeedle(0);
  bitsValueEl.textContent = '—';
  statusEl.textContent = 'พิมพ์รหัสผ่านเพื่อเริ่ม';
  statusEl.className = 'status status--empty';
}

function renderResult(evaluation) {
  setNeedle(evaluation.entropy);
  bitsValueEl.textContent = evaluation.entropy;
  statusEl.textContent = LEVEL_LABELS[evaluation.level];
  statusEl.className = `status status--${evaluation.level}`;
}

function runCheck() {
  const value = input.value;
  if (!value) {
    renderEmpty();
    return;
  }
  renderResult(evaluatePassword(value));
}

input.addEventListener('input', runCheck);

toggleBtn.addEventListener('click', () => {
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  toggleBtn.textContent = showing ? 'แสดง' : 'ซ่อน';
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    input.value = chip.dataset.value;
    input.focus();
    runCheck();
  });
});

copyBtn.addEventListener('click', async () => {
  if (!input.value) return;
  try {
    await navigator.clipboard.writeText(input.value);
    const original = copyBtn.textContent;
    copyBtn.textContent = 'คัดลอกแล้ว';
    setTimeout(() => { copyBtn.textContent = original; }, 1500);
  } catch (err) {
    copyBtn.textContent = 'คัดลอกไม่สำเร็จ';
    setTimeout(() => { copyBtn.textContent = 'คัดลอก'; }, 1500);
  }
});

renderEmpty();
