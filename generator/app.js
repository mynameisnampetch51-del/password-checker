const lengthSlider = document.querySelector('#GenLength');
const lengthValueEl = document.querySelector('#LengthValue');
const switches = document.querySelectorAll('.switch');
const plate = document.querySelector('#Plate');
const forgeBtn = document.querySelector('#ForgeButton');
const copyBtn = document.querySelector('#CopyButton');
const warningEl = document.querySelector('#Warning');

let currentPassword = '';

lengthSlider.addEventListener('input', () => {
  lengthValueEl.textContent = lengthSlider.value;
});

switches.forEach((sw) => {
  sw.addEventListener('click', () => {
    const pressed = sw.getAttribute('aria-pressed') === 'true';
    sw.setAttribute('aria-pressed', String(!pressed));
  });
});

function activeCharsets() {
  const options = {};
  switches.forEach((sw) => {
    options[sw.dataset.charset] = sw.getAttribute('aria-pressed') === 'true';
  });
  return options;
}

function stampPassword(password) {
  plate.innerHTML = '';
  [...password].forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.style.animationDelay = `${i * 25}ms`;
    span.textContent = ch;
    plate.appendChild(span);
  });
}

forgeBtn.addEventListener('click', () => {
  const options = activeCharsets();
  const password = generatePassword(Number(lengthSlider.value), options);
  if (!password) {
    warningEl.textContent = 'เลือกอย่างน้อย 1 ประเภทตัวอักษร';
    return;
  }
  warningEl.textContent = '';
  currentPassword = password;
  stampPassword(password);
});

copyBtn.addEventListener('click', async () => {
  if (!currentPassword) return;
  try {
    await navigator.clipboard.writeText(currentPassword);
    const original = copyBtn.textContent;
    copyBtn.textContent = 'คัดลอกแล้ว';
    setTimeout(() => { copyBtn.textContent = original; }, 1500);
  } catch (err) {
    copyBtn.textContent = 'คัดลอกไม่สำเร็จ';
    setTimeout(() => { copyBtn.textContent = 'คัดลอก'; }, 1500);
  }
});
