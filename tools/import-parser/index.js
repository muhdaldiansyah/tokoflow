#!/usr/bin/env node

const fs   = require('fs');
const path = require('path');
const { parseCSV }       = require('./lib/csv.js');
const { detectMarketplace } = require('./lib/detect.js');
const { parseShopee }    = require('./lib/parsers/shopee.js');
const { parseTikTok }    = require('./lib/parsers/tiktok.js');
const { parseTokopedia } = require('./lib/parsers/tokopedia.js');
const { writeReport }    = require('./lib/report.js');

const args = process.argv.slice(2);

if (!args.length || args.includes('--help')) {
  console.log(`
Tokoflow Import Parser v0.1
Usage: node index.js <input.csv> [--out <dir>]

Options:
  --out <dir>   Output directory (default: ./output)
  --help        Show help

Examples:
  node index.js samples/shopee_sample.csv
  node index.js samples/tiktok_sample.csv --out ./results
  node index.js /path/to/real_export.csv
`);
  process.exit(0);
}

const inputFile = args[0];
const outIdx    = args.indexOf('--out');
const outputDir = outIdx !== -1 ? args[outIdx + 1] : './output';

if (!fs.existsSync(inputFile)) {
  console.error(`Error: File not found: ${inputFile}`);
  process.exit(1);
}

const raw      = fs.readFileSync(inputFile, 'utf-8');
const filename = path.basename(inputFile);

console.log(`\nTokoflow Import Parser`);
console.log(`======================`);
console.log(`File : ${filename}`);
console.log(`Size : ${(raw.length / 1024).toFixed(1)} KB\n`);

const { headers, rows } = parseCSV(raw);
console.log(`Rows detected    : ${rows.length}`);
console.log(`Columns detected : ${headers.length}`);

const detection = detectMarketplace(headers, filename);
if (!detection) {
  console.error('\nCould not detect marketplace format.');
  console.error('First 5 headers:', headers.slice(0, 5).join(' | '));
  console.error('Tip: rename file with "shopee", "tiktok", or "tokopedia" prefix.\n');
  process.exit(1);
}

const { marketplace, confidence } = detection;
console.log(`Marketplace      : ${marketplace.toUpperCase()} (confidence: ${confidence}%)\n`);

const PARSERS = { shopee: parseShopee, tiktok: parseTikTok, tokopedia: parseTokopedia };
const result  = PARSERS[marketplace](rows, headers);

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
writeReport(result, marketplace, outputDir, filename);
