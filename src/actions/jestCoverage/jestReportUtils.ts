import { globalState } from '../../utils';
import { JestItemDiff } from './jestUtils';

export const convertCoverageToReportCell = (status: string, minCoverage: number, data?: JestItemDiff) => {
  let passed = globalState.get('passed');
  let failureReason = globalState.get('failureReason');
  let cell = '';
  let indicatorAdded = false;
  if (!indicatorAdded && status === 'A' && (!data || (data.pct.current < minCoverage))) { // New file no coverage
    cell += '<b title="No test coverage for new file">🚨 </b>';
    passed = false;
    failureReason += '- No test coverage for new file.\n';
    indicatorAdded = true;
  }
  if (data) {
    if (!indicatorAdded && data.pct.current < data.pct.base) { // Coverage reduced
      cell += '<b title="Coverage is reduced">🔴 </b>';
      passed = false;
      failureReason += '- Coverage is reduced.\n';
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
  }

  if (!passed) {
    console.debug(`Coverage failure, setting passed as false. [${failureReason}]`);
  }

  globalState.set({ passed, failureReason });
  return cell;
};
