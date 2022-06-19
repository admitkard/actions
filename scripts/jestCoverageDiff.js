#!/usr/bin/env node
// tslint:disable: no-console
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { runner } = require('./utils');
const __pwd = process.cwd();
console.log({ __pwd });
console.log('ls', execSync('ls -la').toString());
console.log('ls..', execSync('ls -la ..').toString());
console.log('ls..', execSync('git branch').toString());
const jestConfig = require(path.join(__pwd, 'jest.config.js'));
const packageJson = require(path.join(__pwd, 'package.json'));


const FILE_NAME_LIMIT = 40;
const MIN_COVERAGE = {
  statements: 50,
  lines: 50,
  functions: 25,
  branches: 25,
};
const COVERAGE_DIR = jestConfig.coverageDirectory;
const COVERAGE_SUMMARY = 'coverage-summary.json';
const COVERAGE_DIFF = 'coverage-diff.json';
const BASE_BRANCH = 'dev';
const CURRENT_BRANCH = execSync('git rev-parse --abbrev-ref HEAD').toString().split('\n')[0];
const DISALLOWED_FILES = [
  '.*\\.js',
  '.*\\.spec\\.tsx?',
  '.*\\.test\\.tsx?',
  '.*\\/index\\.tsx?',
  '.*\\/__mocks__\\/.*',
  '.*\\.json',
  '.*\\.lock',
  '\\..*',
];

let passed = true;
const filesStatus = {};
const changedFiles = [];

const disallowedFilesRegex = new RegExp(`^(${DISALLOWED_FILES.join('|')})$`, 'im')
const isFileDisallowed = (fileName) => {
  return disallowedFilesRegex.test(fileName);
}

const getTruncatedString = (str) => {
  if (str.length <= FILE_NAME_LIMIT) {
    return str;
  } else {
    const truncatedString = str.slice(str.length - FILE_NAME_LIMIT, str.length);
    return `...${truncatedString}`;
  }
};

const transformFilesMeta = (fileName, status) => {
  const fileDetails = {
    status,
  };

  const isMonorepo = !!packageJson.workspaces;
  if (isMonorepo) {
    const packageNameRegex = /packages\/(?<package>[a-zA-Z0-9]+)\/.*/;
    const pacakgeNameMatch = packageNameRegex.exec(fileName);
    const packageName = pacakgeNameMatch.groups.package;
    fileDetails.package = packageName;

    const fileNameWithoutPackage = fileName.replace(`packages/${packageName}/`, '');
    fileDetails.displayName = getTruncatedString(fileNameWithoutPackage);
  } else {
    fileDetails.displayName = getTruncatedString(fileName);
  }
  
  filesStatus[fileName] = fileDetails;
}

const getChangedFiles = () => {
  const changedFilesGit = execSync('git diff dev --name-status').toString().split('\n');
  const gitStatusRegex = /(?<status>\w+)\s+(?:.*\s+)?(?<fileName>.*)/m;
  changedFilesGit.forEach((line) => {
    const match = gitStatusRegex.exec(line);
    if (match) {
      const { groups: { status, fileName } } = match;
      if (isFileDisallowed(fileName)) {
        return;
      }
      changedFiles.push(fileName);
      transformFilesMeta(fileName, status);
    }
  });
};

const clearJestCache = async () => {
  await runner('npm run test --clearCache');
  await runner('rm -rf /tmp/jest*');
  await runner('rm -rf coverage');
}

const getJestCoverage = async () => {
  await clearJestCache();
  const jestCoverageCommand = runner('yarn test --coverage');
  return jestCoverageCommand.then(() => {
    runner('ls -la');
    runner('ls -la coverage');
    const COVERAGE_FILE_PATH = path.join(__pwd, COVERAGE_DIR, COVERAGE_SUMMARY);
    delete require.cache[require.resolve(COVERAGE_FILE_PATH)]
    const coverage = require(COVERAGE_FILE_PATH);
    const transformedCoverage = {};

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

const getCurrentBranchJestCoverage = async () => {
  await runner(`yarn install`);
  return getJestCoverage().then((coverage) => {
    filesStatus.total = { coverage: {} };
    filesStatus.total.coverage.new = coverage.total;
    changedFiles.forEach((fileName) => {
      filesStatus[fileName].coverage = {};
      filesStatus[fileName].coverage.new = coverage[fileName];
    });
  })
}

const getBaseBranchJestCoverage = async () => {
  await runner(`git checkout ${BASE_BRANCH}`);
  await runner(`yarn install`);
  return getJestCoverage().then((coverage) => {
    if (!filesStatus.total) {
      filesStatus.total = { coverage: {} };
    }
    filesStatus.total.coverage.old = coverage.total;
    changedFiles.forEach((fileName) => {
      if (!filesStatus[fileName].coverage) {
        filesStatus[fileName].coverage = {};
      }
      filesStatus[fileName].coverage.old = coverage[fileName];
    });
    console.log({ filesStatus });
  }).then(() => {
    runner(`git checkout ${CURRENT_BRANCH}`);
  });
}

const printCoverageDiffToFile = () => {
  fs.writeFileSync(path.join(__pwd, COVERAGE_DIR, COVERAGE_DIFF), JSON.stringify(filesStatus, null, 2));
};

const convertRowDataToRow = (columns) => {
  return `| ${columns.join(' | ')} |`;
}
const covertTableDataToCell = (old, current, dataKey, status) => {
  const oldData = old ? old[dataKey] : null;
  const currentData = current ? current[dataKey] : null;
  let cell = '';
  let indcatorAdded = false;
  if (!indcatorAdded && status === 'A' && (!currentData || currentData.pct < MIN_COVERAGE[dataKey])) { // New file no coverage
    cell += '<b title="No test coverage for new file">🚨 </b>';
    passed = false;
    indcatorAdded = true;
  }
  if (!indcatorAdded && oldData && currentData && currentData.pct < oldData.pct) { // Coverage reduced
    cell += '<b title="Coverage is reduced">🔴 </b>';
    passed = false;
    indcatorAdded = true;
  }
  if (!indcatorAdded && oldData && currentData && currentData.pct >= oldData.pct && currentData.pct < MIN_COVERAGE[dataKey]) { // Coverage less than threshold
    cell += `<b title="Coverage is less than threshold of ${MIN_COVERAGE[dataKey]}%">⚠️ </b>`;
    indcatorAdded = true;
  }
  if (!indcatorAdded && oldData && currentData && currentData.pct >= oldData.pct) { // Coverage improved
    cell += '🟢 ';
    indcatorAdded = true;
  }
  cell += currentData ? `<b title="${currentData.pct} (${currentData.covered}/${currentData.total})">**${Math.floor(currentData.pct)}%**</b>` : 'NA';
  if (status !== 'A') {
    cell += '←'
    cell += oldData ? `<i title="${oldData.pct} (${oldData.covered}/${oldData.total})">_${Math.floor(oldData.pct)}%_</i>` : 'NA';
  }
  return cell;
};

const getStatus = (status = '') => {
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
const convertDiffToMarkdownTable = () => {
  const table = [];
  const headers = ['', 'File', 'Functions', 'Branches', 'Statements'];
  table.push(headers);
  table.push(headers.map(() => `--------`));
  Object.keys(filesStatus).forEach((fileName) => {
    const fileData = filesStatus[fileName];
    const fileDisplayName = (fileData.package ? `${fileData.package}/${fileData.displayName}` : fileData.displayName) || fileName;
    const old = fileData.coverage.old;
    const current = fileData.coverage.new;
    table.push([
      getStatus(fileData.status),
      fileDisplayName,
      covertTableDataToCell(old, current, 'functions', fileData.status),
      covertTableDataToCell(old, current, 'branches', fileData.status),
      covertTableDataToCell(old, current, 'statements', fileData.status),
    ]);
  });
  const tableMd = table.map(convertRowDataToRow).join('\n');
  return tableMd;
};

const coverageMessage = () => {
  const tableMd = convertDiffToMarkdownTable();
  const additionalInfoBefore = [];
  additionalInfoBefore.push(`Status: ${passed ? '🟢 Well Done' : '🔴'}`);
  const additionalInfoAfter = [];
  return `${additionalInfoBefore.join('\n')}\n\n${tableMd}\n\n${additionalInfoAfter.join('\n')}`;
}

const getCoverage = async () => {
  getChangedFiles();
  await getCurrentBranchJestCoverage();
  await getBaseBranchJestCoverage();
  printCoverageDiffToFile();
  const message = coverageMessage();
  console.log(message);
};

getCoverage();
