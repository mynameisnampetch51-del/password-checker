// วิเคราะห์รหัสผ่านด้วย pure function แต่ละตัว — เทส/แก้ไขทีละข้อได้อิสระ
// เหมือนแนวทางใน phishing-detector/rules.js

const COMMON_PASSWORDS = [
  'password', '123456', '12345678', '123456789', 'qwerty', 'letmein',
  'admin', 'iloveyou', 'monkey', 'dragon', 'football', 'baseball',
  'welcome', 'abc123', '111111', '123123', 'sunshine', 'princess',
  'login', 'passw0rd', 'trustno1', 'superman', '1q2w3e4r', 'starwars',
  'password1', 'qwertyuiop', 'zxcvbnm', 'asdfghjkl',
];

const KEYBOARD_ROWS = [
  '1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
];

function charsetSize(password) {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 32;
  return size || 1;
}

function rawEntropy(password) {
  if (!password) return 0;
  return password.length * Math.log2(charsetSize(password));
}

function longestRepeatedRun(password) {
  let longest = 1;
  let current = 1;
  for (let i = 1; i < password.length; i++) {
    current = password[i] === password[i - 1] ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return password.length ? longest : 0;
}

function longestSequentialRun(password) {
  let longest = 1;
  let current = 1;
  for (let i = 1; i < password.length; i++) {
    const diff = password.charCodeAt(i) - password.charCodeAt(i - 1);
    current = (diff === 1 || diff === -1) ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return password.length ? longest : 0;
}

function hasKeyboardRun(password, minLen = 4) {
  const lower = password.toLowerCase();
  return KEYBOARD_ROWS.some((row) => {
    for (let len = row.length; len >= minLen; len--) {
      for (let i = 0; i + len <= row.length; i++) {
        const chunk = row.slice(i, i + len);
        if (lower.includes(chunk) || lower.includes([...chunk].reverse().join(''))) {
          return true;
        }
      }
    }
    return false;
  });
}

function isCommonPassword(password) {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}

function classesUsed(password) {
  return [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
}

const LEVEL_THRESHOLDS = { weak: 36, medium: 60 };

function levelFromEntropy(bits) {
  if (bits < LEVEL_THRESHOLDS.weak) return 'weak';
  if (bits < LEVEL_THRESHOLDS.medium) return 'medium';
  return 'strong';
}

function evaluatePassword(password) {
  if (!password) {
    return { valid: false };
  }

  const checks = [];
  let entropy = rawEntropy(password);

  const common = isCommonPassword(password);
  checks.push({
    label: 'ไม่ใช่รหัสผ่านที่ใช้กันทั่วไป',
    triggered: !common,
    detail: common ? 'รหัสนี้อยู่ใน list รหัสผ่านที่คนใช้บ่อยที่สุด เดาได้ในไม่กี่วินาที' : 'ไม่พบใน list รหัสผ่านยอดฮิต',
  });
  if (common) entropy = Math.min(entropy, 10);

  const repeated = longestRepeatedRun(password) >= 3;
  checks.push({
    label: 'ไม่มีตัวอักษรซ้ำติดกันยาว',
    triggered: !repeated,
    detail: repeated ? 'มีตัวอักษรเดิมซ้ำติดกันตั้งแต่ 3 ตัวขึ้นไป (เช่น "aaa", "111")' : 'ไม่มีตัวอักษรซ้ำติดกันยาวผิดปกติ',
  });
  if (repeated) entropy -= 12;

  const sequential = longestSequentialRun(password) >= 4;
  checks.push({
    label: 'ไม่เรียงตัวอักษร/ตัวเลขต่อเนื่อง',
    triggered: !sequential,
    detail: sequential ? 'มีรูปแบบเรียงต่อเนื่องตั้งแต่ 4 ตัว (เช่น "abcd", "4321")' : 'ไม่มีรูปแบบเรียงต่อเนื่อง',
  });
  if (sequential) entropy -= 12;

  const keyboardRun = hasKeyboardRun(password);
  checks.push({
    label: 'ไม่ใช่รูปแบบปุ่มคีย์บอร์ดติดกัน',
    triggered: !keyboardRun,
    detail: keyboardRun ? 'มีรูปแบบปุ่มที่อยู่ติดกันบนคีย์บอร์ด (เช่น "qwerty", "asdf")' : 'ไม่มีรูปแบบปุ่มคีย์บอร์ดติดกัน',
  });
  if (keyboardRun) entropy -= 12;

  const classes = classesUsed(password);
  const fewClasses = classes <= 1;
  checks.push({
    label: 'ผสมตัวพิมพ์เล็ก/ใหญ่/ตัวเลข/สัญลักษณ์',
    triggered: !fewClasses,
    detail: `ใช้ตัวอักษร ${classes}/4 ประเภท (พิมพ์เล็ก, พิมพ์ใหญ่, ตัวเลข, สัญลักษณ์)`,
  });

  const tooShort = password.length < 8;
  checks.push({
    label: 'ความยาวอย่างน้อย 8 ตัวอักษร',
    triggered: !tooShort,
    detail: `ยาว ${password.length} ตัวอักษร`,
  });

  entropy = Math.max(entropy, 0);
  const level = levelFromEntropy(entropy);

  return {
    valid: true,
    password,
    entropy: Math.round(entropy),
    level,
    checks,
  };
}
