#!/usr/bin/env node
// tslint:disable: no-console
import { globalState, runner, truncateString } from '../../utils';
import { addCommentOnPR, addNewSingletonComment, createMarkdownTable, getFileStatusIcon } from '../../utils/github';
import { git, GitChangedFile } from '../../utils/git';
import { BASE_BRANCH, FILE_NAME_LIMIT, MIN_COVERAGE } from './jestConstants';
import { getJestCoverage, isFileDisallowed, JestCoverageDiff, JestCoverageSummary, saveCoverageDiff } from './jestUtils';
import { getNpmRunnerCommand, isMonorepo } from '../../utils/repo';
import { convertCoverageToReportCell } from './jestReportUtils'; 4
import k from 'kleur';
import stripAnsi from 'strip-ansi';

interface FileDetails {
  status?: string;
  fileName?: string;
  displayName?: string;
  package?: string;
}


const getFileDisplayName = (fileName: string) => {
  const isRepoMonorepo = isMonorepo();
  const fileDetails: FileDetails = {};
  if (isRepoMonorepo) {
    const packageNameRegex = /packages\/(?<package>[a-zA-Z0-9]+)\/.*/;
    const packageNameMatch = packageNameRegex.exec(fileName);
    if (packageNameMatch && packageNameMatch.groups) {
      const packageName = packageNameMatch.groups.package;
      fileDetails.package = packageName;
      
      const fileNameWithoutPackage = fileName.replace(`packages/${packageName}/`, '');
      fileDetails.displayName = truncateString(fileNameWithoutPackage, FILE_NAME_LIMIT);
    } else {
      fileDetails.displayName = truncateString(fileName, FILE_NAME_LIMIT);
    }
  } else {
    fileDetails.displayName = truncateString(fileName, FILE_NAME_LIMIT);
  }
  return fileDetails;
}

const fetchRequiredBranches = async () => {
  git.base = BASE_BRANCH;
  git.head = process.env.GITHUB_HEAD_REF || git.current;
  // const requiredBranches = [git.base, git.head];
  // echo ${GITHUB_HEAD_REF} ${GITHUB_BASE_REF} ${{ github.event.pull_request.head.sha }}
  await runner(`git fetch --all`);
  // await runner(`git fetch --no-tags --depth=0 origin ${git.base}`);
  await runner(`git switch ${git.base}`);
  // await runner(`git fetch --no-tags --depth=0 origin ${git.head}`);
  await runner(`git switch ${git.head}`);
}

const getChangedFiles = () => {
  const filteredChangedFiles = git.changedFiles.filter((changedFile) => !isFileDisallowed(changedFile.fileName));
  console.debug({changedFiles: git.changedFiles, filteredChangedFiles});
  if (filteredChangedFiles.length === 0) {
    addCommentOnPR(`No testable files found in the PR.`, '`Action:JestCoverage`')
    process.exit(0);
  }
  return filteredChangedFiles;
};

const transformGitFiles = (changedFiles: GitChangedFile[]) => {
  return changedFiles.map((changedFile) => ({
    ...changedFile,
    ...getFileDisplayName(changedFile.fileName),
  } as FileDetails));
};

const getJestChangedFilesCoverage = async (changedFiles: FileDetails[]) => {
  await runner(getNpmRunnerCommand('install'));

  const fileCoverages: Record<string, JestCoverageSummary> = {};
  const coverage = await getJestCoverage();

  fileCoverages.total = coverage.total;
  changedFiles.forEach((changedFile) => {
    fileCoverages[changedFile.fileName] = coverage[changedFile.fileName];
  });
  console.debug({ fileCoverages });
  return fileCoverages;
};

const getCurrentBranchJestCoverage = async (changedFiles: FileDetails[]) => {
  console.group('Jest coverage of current branch');
  console.debug(k.blue('Getting jest coverage of current branch...'));
  const fileCoverages = await getJestChangedFilesCoverage(changedFiles);
  console.info(k.blue('Jest coverage done for current branch.'));
  console.groupEnd();
  return fileCoverages;
};

const getBaseBranchJestCoverage = async (changedFiles: FileDetails[]) => {
  console.group('Jest coverage of base branch');
  console.debug(k.blue('Getting jest coverage of base branch...'));
  git.checkout(BASE_BRANCH);
  const fileCoverages = await getJestChangedFilesCoverage(changedFiles);
  git.checkout(git.head);
  console.info(k.blue('Jest coverage done for base branch.'));
  console.groupEnd();
  return fileCoverages;
};

const getMetricCoverageDiff = (currentCoverage: JestCoverageSummary, baseCoverage: JestCoverageSummary, metricName: string) => {
  const metricDiff = {
    total: { current: currentCoverage && currentCoverage[metricName].total, base: baseCoverage && baseCoverage[metricName].total },
    covered: { current: currentCoverage && currentCoverage[metricName].covered, base: baseCoverage && baseCoverage[metricName].covered },
    skipped: { current: currentCoverage && currentCoverage[metricName].skipped, base: baseCoverage && baseCoverage[metricName].skipped },
    pct: { current: currentCoverage && currentCoverage[metricName].pct, base: baseCoverage && baseCoverage[metricName].pct },
  };
  return metricDiff;
}

const mergeJestCoverage = (currentJestCoverage: Record<string, JestCoverageSummary>, baseJestCoverage: Record<string, JestCoverageSummary>) => {
  const fileCoverage: Record<string, JestCoverageDiff> = {}; 
  console.group('Merging jest coverage');
  console.debug({ currentJestCoverage, baseJestCoverage });
  Object.keys(currentJestCoverage).forEach((fileName) => {
    const currentCoverage = currentJestCoverage[fileName];
    const baseCoverage = baseJestCoverage[fileName];
    fileCoverage[fileName] = {
      lines: getMetricCoverageDiff(currentCoverage, baseCoverage, 'lines'),
      branches: getMetricCoverageDiff(currentCoverage, baseCoverage, 'branches'),
      functions: getMetricCoverageDiff(currentCoverage, baseCoverage, 'functions'),
      statements: getMetricCoverageDiff(currentCoverage, baseCoverage, 'statements'),
    }
  });
  console.groupEnd();
  return fileCoverage;
}


const convertDiffToMarkdownTable = (transformedGitFiles: FileDetails[], jestCoverageDiff: Record<string, JestCoverageDiff>) => {
  const table = createMarkdownTable({
    status: '',
    file: 'File',
    functions: 'Functions',
    branches: 'Branches',
    statements: 'Statements',
  });

  transformedGitFiles.forEach((gitFile) => {
    const coverageDiff = jestCoverageDiff[gitFile.fileName];
    const fileDisplayName = (gitFile.package ? `${gitFile.package}/${gitFile.displayName}` : gitFile.displayName) || gitFile.fileName;
    table.addRow({
      status: getFileStatusIcon(gitFile.status),
      file: fileDisplayName,
      functions: convertCoverageToReportCell(coverageDiff.lines, MIN_COVERAGE.functions, gitFile.status),
      branches: convertCoverageToReportCell(coverageDiff.branches, MIN_COVERAGE.branches, gitFile.status),
      statements: convertCoverageToReportCell(coverageDiff.statements, MIN_COVERAGE.statements, gitFile.status),
    });
  });
  const tableMd = table.toString();
  return tableMd;
};

const coverageMessage = (transformedGitFiles: FileDetails[], jestCoverageDiff: Record<string, JestCoverageDiff>) => {
  const tableMd = convertDiffToMarkdownTable(transformedGitFiles, jestCoverageDiff);
  const additionalInfoBefore = [];
  additionalInfoBefore.push(`Status: ${globalState.get('passed') ? '🟢 Well Done' : '🔴 Some failures are reported'}`);
  if (globalState.get('failureReason')) {
    additionalInfoBefore.push(`Failure Reasons:\n${globalState.get('failureReason')}`);
  }
  const additionalInfoAfter = [];
  const message = `${additionalInfoBefore.join('\n')}\n\n${tableMd}\n\n${additionalInfoAfter.join('\n')}`;
  console.group('Jest coverage-diff message');
  console.debug(message);
  console.groupEnd();
  return message;
}

const parseErrorMessage = (_err: string) => {
  let commentMessage = `Status: 🔴 An unknown failure occurred. Please check the test run.`;
  const err = stripAnsi(_err).replace(/\\n/gim, '\n');
  const testSummaryRegex = /(Test Suites:(?:.*\n)+.*Time:\s+[\d.]+ s)/gm;
  const testSummaryMatch = testSummaryRegex.exec(err);
  if (testSummaryMatch) {
    let testSummary = testSummaryMatch[1];
    testSummary.replace(/^\s+/gm, '');
    testSummary.replace(/(\d+ failed)/g, '**$1**');
    commentMessage = `Status: 🔴 Some failures are reported\n${testSummary}`;
  }
  return commentMessage;
}

const getCoverage = async () => {
  await fetchRequiredBranches();
  console.group('Changed Files');
  const gitChangedFiles = getChangedFiles();
  const transformedGitFiles = transformGitFiles(gitChangedFiles);
  console.groupEnd();
  let commentMessage = '';
  try {
    globalState.set(({ passed: false }));
    const currentJestCoverage = await getCurrentBranchJestCoverage(transformedGitFiles);
    const baseJestCoverage = await getBaseBranchJestCoverage(transformedGitFiles);
    const jestCoverageDiff = mergeJestCoverage(currentJestCoverage, baseJestCoverage);
    saveCoverageDiff(jestCoverageDiff);
    commentMessage = coverageMessage(transformedGitFiles, jestCoverageDiff);
  } catch (_err) {
    commentMessage = parseErrorMessage(_err);
    process.exit(1);
  }
  console.debug({ commentMessage });
  await addNewSingletonComment(commentMessage, '`Action:JestCoverage`');
  if (globalState.get('passed')) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

export const main = () => {
  getCoverage();
}
