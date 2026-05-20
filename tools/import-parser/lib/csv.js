function stripBOM(str) {
  return str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str;
}

function parseRow(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields.map(f => f.trim());
}

// Shopee often prepends metadata rows before the actual header. Skip them.
function findHeader(lines) {
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const fields = parseRow(lines[i]);
    const meaningful = fields.filter(f => f && /[a-zA-Z-ɏ]/.test(f));
    if (meaningful.length >= 4) return { headerIdx: i, headers: fields };
  }
  return { headerIdx: 0, headers: parseRow(lines[0]) };
}

function parseCSV(raw) {
  const text = stripBOM(raw).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter(l => l.trim());

  const { headerIdx, headers } = findHeader(lines);

  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.every(v => !v)) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] ?? ''; });
    rows.push(obj);
  }

  return { headers, rows };
}

module.exports = { parseCSV };
