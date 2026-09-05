const CHARSETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}',
};

function secureRandomInt(maxExclusive) {
  const bytesNeeded = Math.max(1, Math.ceil(Math.log2(maxExclusive) / 8));
  const maxRange = 256 ** bytesNeeded;
  const maxValid = maxRange - (maxRange % maxExclusive);
  let value;
  do {
    const buf = new Uint8Array(bytesNeeded);
    crypto.getRandomValues(buf);
    value = buf.reduce((acc, b) => acc * 256 + b, 0);
  } while (value >= maxValid);
  return value % maxExclusive;
}

function generatePassword(length, options) {
  const pools = Object.keys(options).filter((k) => options[k]).map((k) => CHARSETS[k]);
  if (pools.length === 0) return '';

  const allChars = pools.join('');
  let result = '';
  for (let i = 0; i < length; i++) {
    result += allChars[secureRandomInt(allChars.length)];
  }
  return result;
}
