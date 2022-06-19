export const FILE_NAME_LIMIT = 40;
export const MIN_COVERAGE = {
  statements: 50,
  lines: 50,
  functions: 25,
  branches: 25,
};
export const BASE_BRANCH = 'master';

export const COVERAGE_SUMMARY = 'coverage-summary.json';
export const COVERAGE_DIFF = 'coverage-diff.json';
export const DISALLOWED_FILES = [
  '.*\\.js',
  '.*\\.spec\\.tsx?',
  '.*\\.test\\.tsx?',
  '.*\\/index\\.tsx?',
  '.*\\/__mocks__\\/.*',
  '.*\\.json',
  '.*\\.lock',
  '\\..*',
];
