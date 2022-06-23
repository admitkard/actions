#!/usr/bin/env node
// tslint:disable: no-console
import { globalState, runner, truncateString } from '../../utils';
import { addOrRenewCommentOnPR, createMarkdownTable, getFileStatusIcon } from '../../utils/github';
import { git, GitChangedFile } from '../../utils/git';
import { BASE_BRANCH, FILE_NAME_LIMIT, MIN_COVERAGE } from './jestConstants';
import { getJestCoverage, isFileDisallowed, JestCoverageDiff, JestCoverageSummary, saveCoverageDiff } from './jestUtils';
import { getNpmRunnerCommand, isMonorepo } from '../../utils/repo';
import { convertCoverageToReportCell } from './jestReportUtils'; 4
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

const transformGitFiles = (changedFiles: GitChangedFile[]) => {
  return changedFiles.map((changedFile) => ({
    ...changedFile,
    ...getFileDisplayName(changedFile.fileName),
  } as FileDetails));
};


const getChangedFiles = () => {
  console.group('Changed Files');
  const filteredGitFiles = git.changedFiles.filter((changedFile) => !isFileDisallowed(changedFile.fileName));
  console.debug({changedFiles: git.changedFiles, filteredChangedFiles: filteredGitFiles});
  if (filteredGitFiles.length === 0) {
    addOrRenewCommentOnPR(`No testable files found in the PR.`, 'Action:JestCoverage')
    process.exit(0);
  }
  const transformedGitFiles = transformGitFiles(filteredGitFiles);
  console.groupEnd();
  return transformedGitFiles;
};

export const getJestChangedFilesCoverage = async (changedFiles: FileDetails[]) => {
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

const getJestFilesCoverage = async () => {
  await runner(getNpmRunnerCommand('install'));
  const coverage = await getJestCoverage();
  console.debug({ coverage });
  return coverage;
};

const getCurrentBranchJestCoverage = async () => {
  console.group('Jest coverage of current branch');
  console.debug('Getting jest coverage of current branch...');
  const fileCoverages = await getJestFilesCoverage();
  console.info('Jest coverage done for current branch.');
  console.groupEnd();
  return fileCoverages;
};

const getBaseBranchJestCoverage = async () => {
  console.group('Jest coverage of base branch');
  console.debug('Getting jest coverage of base branch...');
  git.checkout(BASE_BRANCH);
  const fileCoverages = await getJestFilesCoverage();
  git.checkout(git.head);
  console.info('Jest coverage done for base branch.');
  console.groupEnd();
  return fileCoverages;
};

const getFilesWithChangedCoverage = (currentFilesCoverage: Record<string, JestCoverageSummary>, baseFilesCoverage: Record<string, JestCoverageSummary>) => {
  const changedFiles: string[] = [];
  Object.keys(currentFilesCoverage).forEach((fileName) => {
    const currentCoverage = currentFilesCoverage[fileName];
    const baseCoverage = baseFilesCoverage[fileName];
    let hasDiff = true;
    if (
      (currentCoverage && baseCoverage) && (
        (currentCoverage.lines.pct === baseCoverage.lines.pct) &&
        (currentCoverage.branches.pct === baseCoverage.branches.pct) &&
        (currentCoverage.functions.pct === baseCoverage.functions.pct) &&
        (currentCoverage.statements.pct === baseCoverage.statements.pct)
      )
    ) {
      hasDiff = false;
    }
    if (hasDiff) {
      changedFiles.push(fileName);
    }
  });
  console.debug({ finalChangedFiles: changedFiles });
  return changedFiles;
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
  const changedFiles = getFilesWithChangedCoverage(currentJestCoverage, baseJestCoverage);
  changedFiles.forEach((fileName) => {
    const currentCoverage = currentJestCoverage[fileName];
    const baseCoverage = baseJestCoverage[fileName];
    fileCoverage[fileName] = {
      lines: getMetricCoverageDiff(currentCoverage, baseCoverage, 'lines'),
      branches: getMetricCoverageDiff(currentCoverage, baseCoverage, 'branches'),
      functions: getMetricCoverageDiff(currentCoverage, baseCoverage, 'functions'),
      statements: getMetricCoverageDiff(currentCoverage, baseCoverage, 'statements'),
    }
  });
  console.debug({ fileCoverage });
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
    try {
      table.addRow({
        status: getFileStatusIcon(gitFile.status),
        file: fileDisplayName,
        functions: convertCoverageToReportCell(gitFile.status, MIN_COVERAGE.functions, coverageDiff.functions),
        branches: convertCoverageToReportCell(gitFile.status, MIN_COVERAGE.branches, coverageDiff.branches),
        statements: convertCoverageToReportCell(gitFile.status, MIN_COVERAGE.statements, coverageDiff.statements),
      });
    } catch (e) {
      console.error(`Cannot add row for file: ${gitFile.status}::${gitFile.fileName}`);
      if (gitFile.status !== 'D') {
        console.error(e);
      }
    }
  });

  const changedCoverageFiles = Object.keys(jestCoverageDiff);
  const changedCoverageFilesStatus = changedCoverageFiles.map((fileName) => ({ status: 'U', fileName }));

  const transformedChangedCoverageFiles = transformGitFiles(changedCoverageFilesStatus);
  transformedChangedCoverageFiles.forEach((gitFile) => {
    if (transformedGitFiles.find((file) => file.fileName === gitFile.fileName)) {
      return;
    }
    const coverageDiff = jestCoverageDiff[gitFile.fileName];
    const fileDisplayName = (gitFile.package ? `${gitFile.package}/${gitFile.displayName}` : gitFile.displayName) || gitFile.fileName;
    try {
      table.addRow({
        status: getFileStatusIcon(gitFile.status),
        file: fileDisplayName,
        functions: convertCoverageToReportCell(gitFile.status, MIN_COVERAGE.functions, coverageDiff.functions),
        branches: convertCoverageToReportCell(gitFile.status, MIN_COVERAGE.branches, coverageDiff.branches),
        statements: convertCoverageToReportCell(gitFile.status, MIN_COVERAGE.statements, coverageDiff.statements),
      });
    } catch (e) {
      console.error(`Cannot add row for changed coverage file: ${gitFile.status}::${gitFile.fileName}`);
      if (gitFile.status !== 'D') {
        console.error(e);
      }
    }
  });

  const tableMd = table.toString();
  console.debug({ tableMd });
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

export const parseErrorMessage = (_err: string) => {
  console.info('Parsing error message');
  let commentMessage = `Status: 🔴 An unknown failure occurred. Please check the test run.`;
  console.debug({ commentMessage });
  console.debug({ _err });
  const err = stripAnsi(_err).replace(/\\n/gim, '\n');
  const testSummaryRegex = /(Test Suites:(?:.*\n)+.*Time:\s+[\d.]+ s)/gm;
  const testSummaryMatch = testSummaryRegex.exec(err);
  if (testSummaryMatch) {
    let testSummary = testSummaryMatch[1];
    testSummary.replace(/^\s+/gm, '');
    testSummary.replace(/(\d+ failed)/gm, '**$1**');
    commentMessage = `Status: 🔴 Some failures are reported\n> ${testSummary}`;
  }
  return commentMessage;
}

const getCoverage = async () => {
  await fetchRequiredBranches();
  const gitChangedFiles = getChangedFiles();
  let commentMessage = '';
  try {
    const currentJestCoverage = await getCurrentBranchJestCoverage();
    const baseJestCoverage = await getBaseBranchJestCoverage();
    const jestCoverageDiff = mergeJestCoverage(currentJestCoverage, baseJestCoverage);
    saveCoverageDiff(jestCoverageDiff);
    commentMessage = coverageMessage(gitChangedFiles, jestCoverageDiff);
  } catch (err) {
    console.debug('An error occurred in getCoverage, setting passed false');
    globalState.set({ passed: false });
    commentMessage = parseErrorMessage(err);
  }
  console.debug({ commentMessage });
  await addOrRenewCommentOnPR(commentMessage, 'Action:JestCoverage');
  console.debug({ passed: globalState.get('passed') });
  let exitCode = 0;
  if (!globalState.get('passed')) {
    exitCode = 1;
  }
  console.debug({ exitCode });
  process.exit(exitCode);
};

export const main = () => {
  getCoverage();
}
