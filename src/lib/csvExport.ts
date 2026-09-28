/**
 * Utility functions for exporting application data to formatted CSV files.
 */

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If field contains quotes, commas, or newlines, wrap in quotes and escape quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsvField).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
