import { globalState } from '../../utils';
import { JestItemDiff } from './jestUtils';

const withTitle = (text: string, title: string, htmlEl: string = 'span') => {
  return `<${htmlEl} title="${title}">${text}</${htmlEl}>`
};

const getIndicator = (status: string, minCoverage: number, data?: JestItemDiff) => {
  const failureReason = globalState.get<string[]>('failureReason');
  let result = {
    indicator: '',
    passed: globalState.get('passed'),
  };

  // New file has not UTs
  if (status === 'A' && (!data || (data.pct.current < minCoverage))) {
    result.indicator = withTitle('😡 ', 'No test coverage for new file'); // 🚨
    result.passed = false;
    failureReason.push('No test coverage for new file.');
    globalState.set({ failureReason });
    return result;
  }

  // No Coverage
  if (!data?.pct?.base && !data?.pct?.current) {
    result.indicator = withTitle('👻 ', 'No Tests Found');
    return result;
  }

  if (!data?.pct?.base) { // No base coverage
    if (data.pct.current >= minCoverage) { // Current Coverage above threshold
      result.indicator += '💚 ';
      return result
    }
    if (data.pct.current < minCoverage) { // Current coverage below threshold
      result.indicator += withTitle('🍋 ', `Current coverage is less than threshold of ${minCoverage}%`);
      return result;
    }
  }

  // Coverage Reduced
  if (data.pct.current < data.pct.base) {
    result.indicator += withTitle('🔻 ', 'Coverage is reduced');
    result.passed = false;
    failureReason.push('Coverage is reduced.');
    globalState.set({ failureReason });
    return result;
  }

  // Coverage increased, but still below threshold
  if (data.pct.current >= data.pct.base && data.pct.current < minCoverage) {
    result.indicator = withTitle('🍋 ', `Coverage is less than threshold of ${minCoverage}%`);
    return result;
  }

  // Coverage increased, and above threshold
  if (data.pct.current >= data.pct.base && data.pct.current >= minCoverage) {
    result.indicator = '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Increase.svg/2054px-Increase.svg.png" alt="🟩"/> ';
  }

  return result;
}

const getCoverageString = (pct: number, covered: number, total: number, htmlEl: string = 'span') => {
  return pct ? withTitle(`${Math.floor(pct)}%`, `${pct} (${covered}/${total}`, htmlEl) : 'NA'; 
}

export const convertCoverageToReportCell = (status: string, minCoverage: number, data?: JestItemDiff) => {
  const indicator = getIndicator(status, minCoverage, data);
  let passed = indicator.passed;
  let failureReason = globalState.get('failureReason');
  let cell = indicator.indicator;
  
  if (data) {
    cell += getCoverageString(data.pct.current, data.covered.current, data.total.current, 'b');
    if (status !== 'A') {
      cell += '←'
      cell += getCoverageString(data.pct.base, data.covered.base, data.total.base, 'i');
    }
  }

  if (!passed) {
    console.debug(`Coverage failure, setting passed as false. [${JSON.stringify(failureReason)}]`);
  }

  return cell;
};
