#!/usr/bin/env node
// tslint:disable: no-console
import { runner, truncateString } from '../../utils';
import { createMarkdownTable, getFileStatusIcon } from '../../utils/github';
import { git, GitChangedFile } from '../../utils/git';
import { BASE_BRANCH, FILE_NAME_LIMIT, MIN_COVERAGE } from './jestConstants';
import { getJestCoverage, isFileDisallowed, JestCoverageDiff, JestCoverageSummary, saveCoverageDiff } from './jestUtils';
import { getNpmRunnerCommand, isMonorepo } from '../../utils/repo';
import { convertCoverageToReportCell } from './jestReportUtils'; 4
import k from 'kleur';

let passed = true;
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
  await runner(`git fetch --no-tags --depth=1 origin ${git.base}`);
  await runner(`git checkout -b ${git.base}`);
  await runner(`git checkout ${git.head}`);
}

const getChangedFiles = () => {
  const filteredChangedFiles = git.changedFiles.filter((changedFile) => !isFileDisallowed(changedFile.fileName));
  console.debug({changedFiles: git.changedFiles, filteredChangedFiles});
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
  console.debug({ fileCoverages, changedFiles });
  return fileCoverages;
};

const getCurrentBranchJestCoverage = async (changedFiles: FileDetails[]) => {
  console.debug(k.blue('Getting jest coverage of current branch...'));
  const fileCoverages = await getJestChangedFilesCoverage(changedFiles);
  console.debug(k.blue('Jest coverage done for current branch.'));
  return fileCoverages;
};

const getBaseBranchJestCoverage = async (changedFiles: FileDetails[]) => {
  console.debug(k.blue('Getting jest coverage of base branch...'));
  git.checkout(BASE_BRANCH);
  const fileCoverages = await getJestChangedFilesCoverage(changedFiles);
  git.checkout(git.head);
  console.debug(k.blue('Jest coverage done for base branch.'));
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
  console.log({ currentJestCoverage, baseJestCoverage });
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
  additionalInfoBefore.push(`Status: ${passed ? '🟢 Well Done' : '🔴'}`);
  const additionalInfoAfter = [];
  return `${additionalInfoBefore.join('\n')}\n\n${tableMd}\n\n${additionalInfoAfter.join('\n')}`;
}

const getCoverage = async () => {
  await fetchRequiredBranches();
  const gitChangedFiles = getChangedFiles();
  const transformedGitFiles = transformGitFiles(gitChangedFiles);
  const currentJestCoverage = await getCurrentBranchJestCoverage(transformedGitFiles);
  const baseJestCoverage = await getBaseBranchJestCoverage(transformedGitFiles);
  const jestCoverageDiff = mergeJestCoverage(currentJestCoverage, baseJestCoverage);
  saveCoverageDiff(jestCoverageDiff);
  const message = coverageMessage(transformedGitFiles, jestCoverageDiff);
  console.log(message);
};

export const main = () => {
  getCoverage();
}
