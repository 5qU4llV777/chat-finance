const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8').split(/\r?\n/).reduce((acc, line) => {
  const idx = line.indexOf('=');
  if (idx === -1) return acc;
  acc[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
  return acc;
}, {});
const key = env.GOOGLE_API_KEY || env.LOVABLE_API_KEY;
if (!key) {
  console.error('NO_KEY');
  process.exit(1);
}
const urls = [
  'https://api.openai.googleapis.com/v1/models',
  'https://openai.googleapis.com/v1/models',
  'https://api.openai.googleapis.com/v1/chat/completions',
  'https://openai.googleapis.com/v1/chat/completions',
];
(async () => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${key}` } });
      const text = await res.text();
      console.log('URL', url, 'STATUS', res.status, 'LENGTH', text.length);
      console.log(text.slice(0, 1000));
    } catch (e) {
      console.error('FAIL', url, e.message);
    }
  }
})();
