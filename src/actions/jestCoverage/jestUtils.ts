import { runner } from '../../utils';
import path from 'path';
import { existsSync, writeFileSync } from 'fs';
import { COVERAGE_DIFF, COVERAGE_SUMMARY, DISALLOWED_FILES } from './jestConstants';
import { getJsonFile, getNpmRunnerCommand } from '../../utils/repo';
import { systemCheck } from '../../utils/systemCheck';

declare function __non_webpack_require__(...args: any[]): any;
const __pwd = process.cwd();

const disallowedFilesRegex = new RegExp(`^(${DISALLOWED_FILES.join('|')})$`, 'im')
export const isFileDisallowed = (fileName: string) => {
  return disallowedFilesRegex.test(fileName);
}

let COVERAGE_DIR = 'coverage';
const getJestCoverageDir = () => {
  if (!COVERAGE_DIR) {
    const jestConfig = __non_webpack_require__(path.resolve(__pwd, 'jest.config.js'));
    COVERAGE_DIR = jestConfig.coverageDirectory || COVERAGE_DIR;
  }
  return COVERAGE_DIR;
}

systemCheck.addSystemCheck('checkJestConfigExists', () => {
  const jestConfigExists = existsSync(path.join(__pwd, 'jest.config.js'));
  if (!jestConfigExists) {
    return 'jest.config.js not found';
  }
  return '';
});

systemCheck.addSystemCheck('checkTestCommandInPackageJson', () => {
  const getPackageJson = getJsonFile('package.json');
  const testCommand = getPackageJson.scripts.test;
  if (!testCommand) {
    return '`test` command not found. This action needs the `test` script in package.json';
  }
  return '';
});

const clearJestCache = async () => {
  await runner(getNpmRunnerCommand('test', '--clearCache'));
  await runner('rm -rf /tmp/jest*');
  await runner('rm -rf coverage');
}

interface JestCoverageSummaryParameters {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface JestCoverageSummary {
  lines: JestCoverageSummaryParameters;
  functions: JestCoverageSummaryParameters;
  statements: JestCoverageSummaryParameters;
  branches: JestCoverageSummaryParameters;
}

const getJestCoverageFile = () => {
  const COVERAGE_FILE_PATH = path.join(getJestCoverageDir(), COVERAGE_SUMMARY);
  const coverage = getJsonFile(COVERAGE_FILE_PATH) as Record<string, JestCoverageSummary>;
  return coverage; 
}

export const getJestCoverage = async () => {
  await clearJestCache();
  const coverageReporters = ['json', 'text', 'json-summary'].map((r) => `--coverageReporters=${r}`).join(' ');
  const reporters = ['default', 'github-actions'].map((r) => `--reporters=${r}`).join(' ');
  const jestOptions = `${reporters} ${coverageReporters}`;
  const jestCoverageCommand = runner(getNpmRunnerCommand('test', '--coverage --runInBand', jestOptions));
  return jestCoverageCommand.then(() => {
    const coverage = getJestCoverageFile();
    const transformedCoverage: Record<string, JestCoverageSummary> = {};

    transformedCoverage.total = coverage.total;
    Object.keys(coverage).forEach((fullFileName) => {
      if (fullFileName !== 'total') {
        const relativeFileName = fullFileName.replace(`${__pwd}/`, '');
        transformedCoverage[relativeFileName] = coverage[fullFileName];
      }
    });
    return transformedCoverage;
  });
}

export interface JestItemDiff {
  total: {
    base: number;
    current: number;
  };
  covered: {
    base: number;
    current: number;
  };
  skipped: {
    base: number;
    current: number;
  };
  pct: {
    base: number;
    current: number;
  };
}

export interface JestCoverageDiff {
  lines: JestItemDiff;
  functions: JestItemDiff;
  statements: JestItemDiff;
  branches: JestItemDiff;
}

export const saveCoverageDiff = (filesStatus) => {
  try {
    writeFileSync(path.join(__pwd, getJestCoverageDir(), COVERAGE_DIFF), JSON.stringify(filesStatus, null, 2));
    console.debug('Saved coverage diff');
  } catch (e) {
    console.error('Unable to save coverage diff', e);
  }
};

export const isReportPassed = () => {

};

