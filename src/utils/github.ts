export const getFileStatusIcon = (status = '') => {
  if (status === 'A') {
    return '<b title="Added">🟩</b>';
  }
  if (status === 'M') {
    return '<b title="Modified">🟨</b>';
  }
  if (status === 'D') {
    return '<b title="Deleted">🟥</b>';
  }
  if (status.indexOf('R') === 0) {
    return '<b title="Renamed">🟫</b>';
  }
  return status;
}

const convertRowDataToRow = (columns) => {
  return `| ${columns.join(' | ')} |`;
}

export const createMarkdownTable = <T extends Record<string, string>>(headers: T) => {
  const headerKeys = Object.keys(headers) as (keyof T)[];
  const rows: (string | number | boolean | symbol)[][] = [headerKeys];
  rows.push(headerKeys.map(() => `--------`));

  const addRow = (row: Record<keyof T, string | number | boolean>) => {
    const rowData = headerKeys.map((headerKey) => row[headerKey]);
    rows.push(rowData);
  };

  const toString = () => {
    return rows.map(convertRowDataToRow).join('\n');
  }

  const table = {
    addRow,
    toString,
  }

  return table;
};
