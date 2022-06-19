import { JestItemDiff } from './jestUtils';

export const convertCoverageToReportCell = (data: JestItemDiff, minCoverage: number, status: string) => {
  let passed = false;
  let cell = '';
  let indicatorAdded = false;
  if (!indicatorAdded && status === 'A' && (data.pct.current < minCoverage)) { // New file no coverage
    cell += '<b title="No test coverage for new file">🚨 </b>';
    passed = false;
    indicatorAdded = true;
  }
  if (!indicatorAdded && data.pct.current < data.pct.base) { // Coverage reduced
    cell += '<b title="Coverage is reduced">🔴 </b>';
    passed = false;
    indicatorAdded = true;
  }
  if (!indicatorAdded && data.pct.current >= data.pct.base && data.pct.current < minCoverage) { // Coverage less than threshbase
    cell += `<b title="Coverage is less than threshold of ${minCoverage}%">⚠️ </b>`;
    indicatorAdded = true;
  }
  if (!indicatorAdded && data.pct.current >= data.pct.base) { // Coverage improved
    cell += '🟢 ';
    indicatorAdded = true;
  }
  cell += data.pct.current ? `<b title="${data.pct.current} (${data.covered.current}/${data.total.current})">**${Math.floor(data.pct.current)}%**</b>` : 'NA';
  if (status !== 'A') {
    cell += '←'
    cell += data.covered.base ? `<i title="${data.pct.base} (${data.covered.base}/${data.total.base})">_${Math.floor(data.pct.base)}%_</i>` : 'NA';
  }

  console.log(passed);
  return cell;
};
