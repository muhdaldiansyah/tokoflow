function parseTokopedia(rows, headers) {
  return {
    rows: [],
    cancelled: [],
    missingFields: ['all'],
    colCoverage: {},
    totalRows: rows.length,
    error: 'Tokopedia parser belum diimplementasi. Kirim sample file real ke operator untuk analisis format.',
  };
}

module.exports = { parseTokopedia };
