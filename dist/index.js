/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 391:
/***/ ((module) => {



let FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM, isTTY=true;
if (typeof process !== 'undefined') {
	({ FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env);
	isTTY = process.stdout && process.stdout.isTTY;
}

const $ = {
	enabled: !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== 'dumb' && (
		FORCE_COLOR != null && FORCE_COLOR !== '0' || isTTY
	),

	// modifiers
	reset: init(0, 0),
	bold: init(1, 22),
	dim: init(2, 22),
	italic: init(3, 23),
	underline: init(4, 24),
	inverse: init(7, 27),
	hidden: init(8, 28),
	strikethrough: init(9, 29),

	// colors
	black: init(30, 39),
	red: init(31, 39),
	green: init(32, 39),
	yellow: init(33, 39),
	blue: init(34, 39),
	magenta: init(35, 39),
	cyan: init(36, 39),
	white: init(37, 39),
	gray: init(90, 39),
	grey: init(90, 39),

	// background colors
	bgBlack: init(40, 49),
	bgRed: init(41, 49),
	bgGreen: init(42, 49),
	bgYellow: init(43, 49),
	bgBlue: init(44, 49),
	bgMagenta: init(45, 49),
	bgCyan: init(46, 49),
	bgWhite: init(47, 49)
};

function run(arr, str) {
	let i=0, tmp, beg='', end='';
	for (; i < arr.length; i++) {
		tmp = arr[i];
		beg += tmp.open;
		end += tmp.close;
		if (!!~str.indexOf(tmp.close)) {
			str = str.replace(tmp.rgx, tmp.close + tmp.open);
		}
	}
	return beg + str + end;
}

function chain(has, keys) {
	let ctx = { has, keys };

	ctx.reset = $.reset.bind(ctx);
	ctx.bold = $.bold.bind(ctx);
	ctx.dim = $.dim.bind(ctx);
	ctx.italic = $.italic.bind(ctx);
	ctx.underline = $.underline.bind(ctx);
	ctx.inverse = $.inverse.bind(ctx);
	ctx.hidden = $.hidden.bind(ctx);
	ctx.strikethrough = $.strikethrough.bind(ctx);

	ctx.black = $.black.bind(ctx);
	ctx.red = $.red.bind(ctx);
	ctx.green = $.green.bind(ctx);
	ctx.yellow = $.yellow.bind(ctx);
	ctx.blue = $.blue.bind(ctx);
	ctx.magenta = $.magenta.bind(ctx);
	ctx.cyan = $.cyan.bind(ctx);
	ctx.white = $.white.bind(ctx);
	ctx.gray = $.gray.bind(ctx);
	ctx.grey = $.grey.bind(ctx);

	ctx.bgBlack = $.bgBlack.bind(ctx);
	ctx.bgRed = $.bgRed.bind(ctx);
	ctx.bgGreen = $.bgGreen.bind(ctx);
	ctx.bgYellow = $.bgYellow.bind(ctx);
	ctx.bgBlue = $.bgBlue.bind(ctx);
	ctx.bgMagenta = $.bgMagenta.bind(ctx);
	ctx.bgCyan = $.bgCyan.bind(ctx);
	ctx.bgWhite = $.bgWhite.bind(ctx);

	return ctx;
}

function init(open, close) {
	let blk = {
		open: `\x1b[${open}m`,
		close: `\x1b[${close}m`,
		rgx: new RegExp(`\\x1b\\[${close}m`, 'g')
	};
	return function (txt) {
		if (this !== void 0 && this.has !== void 0) {
			!!~this.has.indexOf(open) || (this.has.push(open),this.keys.push(blk));
			return txt === void 0 ? this : $.enabled ? run(this.keys, txt+'') : txt+'';
		}
		return txt === void 0 ? chain([open], [blk]) : $.enabled ? run([blk], txt+'') : txt+'';
	};
}

module.exports = $;


/***/ }),

/***/ 865:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DISALLOWED_FILES = exports.COVERAGE_DIFF = exports.COVERAGE_SUMMARY = exports.BASE_BRANCH = exports.MIN_COVERAGE = exports.FILE_NAME_LIMIT = void 0;
exports.FILE_NAME_LIMIT = 40;
exports.MIN_COVERAGE = {
    statements: 50,
    lines: 50,
    functions: 25,
    branches: 25,
};
exports.BASE_BRANCH = process.env.GITHUB_BASE_REF || 'dev';
exports.COVERAGE_SUMMARY = 'coverage-summary.json';
exports.COVERAGE_DIFF = 'coverage-diff.json';
exports.DISALLOWED_FILES = [
    '.*\\.js',
    '.*\\.spec\\.tsx?',
    '.*\\.test\\.tsx?',
    '.*\\/index\\.tsx?',
    '.*\\/__mocks__\\/.*',
    '.*\\.json',
    '.*\\.lock',
    '\\..*',
];


/***/ }),

/***/ 846:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

//#!/usr/bin/env node

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.main = void 0;
const tslib_1 = __webpack_require__(655);
// tslint:disable: no-console
const utils_1 = __webpack_require__(928);
const github_1 = __webpack_require__(732);
const git_1 = __webpack_require__(997);
const jestConstants_1 = __webpack_require__(865);
const jestUtils_1 = __webpack_require__(409);
const repo_1 = __webpack_require__(557);
const jestReportUtils_1 = __webpack_require__(793);
4;
const kleur_1 = tslib_1.__importDefault(__webpack_require__(391));
let passed = true;
const getFileDisplayName = (fileName) => {
    const isRepoMonorepo = (0, repo_1.isMonorepo)();
    const fileDetails = {};
    if (isRepoMonorepo) {
        const packageNameRegex = /packages\/(?<package>[a-zA-Z0-9]+)\/.*/;
        const packageNameMatch = packageNameRegex.exec(fileName);
        if (packageNameMatch && packageNameMatch.groups) {
            const packageName = packageNameMatch.groups.package;
            fileDetails.package = packageName;
            const fileNameWithoutPackage = fileName.replace(`packages/${packageName}/`, '');
            fileDetails.displayName = (0, utils_1.truncateString)(fileNameWithoutPackage, jestConstants_1.FILE_NAME_LIMIT);
        }
        else {
            fileDetails.displayName = (0, utils_1.truncateString)(fileName, jestConstants_1.FILE_NAME_LIMIT);
        }
    }
    else {
        fileDetails.displayName = (0, utils_1.truncateString)(fileName, jestConstants_1.FILE_NAME_LIMIT);
    }
    return fileDetails;
};
const fetchRequiredBranches = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    git_1.git.base = jestConstants_1.BASE_BRANCH;
    git_1.git.head = process.env.GITHUB_HEAD_REF || git_1.git.current;
    // const requiredBranches = [git.base, git.head];
    // echo ${GITHUB_HEAD_REF} ${GITHUB_BASE_REF} ${{ github.event.pull_request.head.sha }}
    yield (0, utils_1.runner)(`git fetch --all`);
    // await runner(`git fetch --no-tags --depth=0 origin ${git.base}`);
    yield (0, utils_1.runner)(`git switch ${git_1.git.base}`);
    // await runner(`git fetch --no-tags --depth=0 origin ${git.head}`);
    yield (0, utils_1.runner)(`git switch ${git_1.git.head}`);
});
const getChangedFiles = () => {
    const filteredChangedFiles = git_1.git.changedFiles.filter((changedFile) => !(0, jestUtils_1.isFileDisallowed)(changedFile.fileName));
    console.debug({ changedFiles: git_1.git.changedFiles, filteredChangedFiles });
    return filteredChangedFiles;
};
const transformGitFiles = (changedFiles) => {
    return changedFiles.map((changedFile) => (Object.assign(Object.assign({}, changedFile), getFileDisplayName(changedFile.fileName))));
};
const getJestChangedFilesCoverage = (changedFiles) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield (0, utils_1.runner)((0, repo_1.getNpmRunnerCommand)('install'));
    const fileCoverages = {};
    const coverage = yield (0, jestUtils_1.getJestCoverage)();
    fileCoverages.total = coverage.total;
    changedFiles.forEach((changedFile) => {
        fileCoverages[changedFile.fileName] = coverage[changedFile.fileName];
    });
    console.debug({ fileCoverages, changedFiles });
    return fileCoverages;
});
const getCurrentBranchJestCoverage = (changedFiles) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    console.debug(kleur_1.default.blue('Getting jest coverage of current branch...'));
    const fileCoverages = yield getJestChangedFilesCoverage(changedFiles);
    console.debug(kleur_1.default.blue('Jest coverage done for current branch.'));
    return fileCoverages;
});
const getBaseBranchJestCoverage = (changedFiles) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    console.debug(kleur_1.default.blue('Getting jest coverage of base branch...'));
    git_1.git.checkout(jestConstants_1.BASE_BRANCH);
    const fileCoverages = yield getJestChangedFilesCoverage(changedFiles);
    git_1.git.checkout(git_1.git.head);
    console.debug(kleur_1.default.blue('Jest coverage done for base branch.'));
    return fileCoverages;
});
const getMetricCoverageDiff = (currentCoverage, baseCoverage, metricName) => {
    const metricDiff = {
        total: { current: currentCoverage && currentCoverage[metricName].total, base: baseCoverage && baseCoverage[metricName].total },
        covered: { current: currentCoverage && currentCoverage[metricName].covered, base: baseCoverage && baseCoverage[metricName].covered },
        skipped: { current: currentCoverage && currentCoverage[metricName].skipped, base: baseCoverage && baseCoverage[metricName].skipped },
        pct: { current: currentCoverage && currentCoverage[metricName].pct, base: baseCoverage && baseCoverage[metricName].pct },
    };
    return metricDiff;
};
const mergeJestCoverage = (currentJestCoverage, baseJestCoverage) => {
    const fileCoverage = {};
    console.log({ currentJestCoverage, baseJestCoverage });
    Object.keys(currentJestCoverage).forEach((fileName) => {
        const currentCoverage = currentJestCoverage[fileName];
        const baseCoverage = baseJestCoverage[fileName];
        fileCoverage[fileName] = {
            lines: getMetricCoverageDiff(currentCoverage, baseCoverage, 'lines'),
            branches: getMetricCoverageDiff(currentCoverage, baseCoverage, 'branches'),
            functions: getMetricCoverageDiff(currentCoverage, baseCoverage, 'functions'),
            statements: getMetricCoverageDiff(currentCoverage, baseCoverage, 'statements'),
        };
    });
    return fileCoverage;
};
const convertDiffToMarkdownTable = (transformedGitFiles, jestCoverageDiff) => {
    const table = (0, github_1.createMarkdownTable)({
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
            status: (0, github_1.getFileStatusIcon)(gitFile.status),
            file: fileDisplayName,
            functions: (0, jestReportUtils_1.convertCoverageToReportCell)(coverageDiff.lines, jestConstants_1.MIN_COVERAGE.functions, gitFile.status),
            branches: (0, jestReportUtils_1.convertCoverageToReportCell)(coverageDiff.branches, jestConstants_1.MIN_COVERAGE.branches, gitFile.status),
            statements: (0, jestReportUtils_1.convertCoverageToReportCell)(coverageDiff.statements, jestConstants_1.MIN_COVERAGE.statements, gitFile.status),
        });
    });
    const tableMd = table.toString();
    return tableMd;
};
const coverageMessage = (transformedGitFiles, jestCoverageDiff) => {
    const tableMd = convertDiffToMarkdownTable(transformedGitFiles, jestCoverageDiff);
    const additionalInfoBefore = [];
    additionalInfoBefore.push(`Status: ${passed ? '🟢 Well Done' : '🔴'}`);
    const additionalInfoAfter = [];
    return `${additionalInfoBefore.join('\n')}\n\n${tableMd}\n\n${additionalInfoAfter.join('\n')}`;
};
const getCoverage = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield fetchRequiredBranches();
    const gitChangedFiles = getChangedFiles();
    const transformedGitFiles = transformGitFiles(gitChangedFiles);
    const currentJestCoverage = yield getCurrentBranchJestCoverage(transformedGitFiles);
    const baseJestCoverage = yield getBaseBranchJestCoverage(transformedGitFiles);
    const jestCoverageDiff = mergeJestCoverage(currentJestCoverage, baseJestCoverage);
    (0, jestUtils_1.saveCoverageDiff)(jestCoverageDiff);
    const message = coverageMessage(transformedGitFiles, jestCoverageDiff);
    console.log(message);
});
const main = () => {
    getCoverage();
};
exports.main = main;


/***/ }),

/***/ 793:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertCoverageToReportCell = void 0;
const convertCoverageToReportCell = (data, minCoverage, status) => {
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
        cell += '←';
        cell += data.covered.base ? `<i title="${data.pct.base} (${data.covered.base}/${data.total.base})">_${Math.floor(data.pct.base)}%_</i>` : 'NA';
    }
    console.log(passed);
    return cell;
};
exports.convertCoverageToReportCell = convertCoverageToReportCell;


/***/ }),

/***/ 409:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isReportPassed = exports.saveCoverageDiff = exports.getJestCoverage = exports.isFileDisallowed = void 0;
const tslib_1 = __webpack_require__(655);
const utils_1 = __webpack_require__(928);
const path_1 = tslib_1.__importDefault(__webpack_require__(17));
const fs_1 = __webpack_require__(147);
const jestConstants_1 = __webpack_require__(865);
const repo_1 = __webpack_require__(557);
const systemCheck_1 = __webpack_require__(762);
const __pwd = process.cwd();
const disallowedFilesRegex = new RegExp(`^(${jestConstants_1.DISALLOWED_FILES.join('|')})$`, 'im');
const isFileDisallowed = (fileName) => {
    return disallowedFilesRegex.test(fileName);
};
exports.isFileDisallowed = isFileDisallowed;
let COVERAGE_DIR = '';
const getJestCoverageDir = () => {
    if (!COVERAGE_DIR) {
        const jestConfig = require(path_1.default.resolve(__pwd, 'jest.config.js'));
        COVERAGE_DIR = jestConfig.coverageDirectory;
    }
    return COVERAGE_DIR;
};
systemCheck_1.systemCheck.addSystemCheck('checkJestConfigExists', () => {
    const jestConfigExists = (0, fs_1.existsSync)(path_1.default.join(__pwd, 'jest.config.js'));
    if (!jestConfigExists) {
        return 'jest.config.js not found';
    }
    return '';
});
systemCheck_1.systemCheck.addSystemCheck('checkTestCommandInPackageJson', () => {
    const getPackageJson = (0, repo_1.getJsonFile)('package.json');
    const testCommand = getPackageJson.scripts.test;
    if (!testCommand) {
        return '`test` command not found. This action needs the `test` script in package.json';
    }
    return '';
});
const clearJestCache = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield (0, utils_1.runner)((0, repo_1.getNpmRunnerCommand)('test --clearCache'));
    yield (0, utils_1.runner)('rm -rf /tmp/jest*');
    yield (0, utils_1.runner)('rm -rf coverage');
});
const getJestCoverageFile = () => {
    const COVERAGE_FILE_PATH = path_1.default.join(getJestCoverageDir(), jestConstants_1.COVERAGE_SUMMARY);
    const coverage = (0, repo_1.getJsonFile)(COVERAGE_FILE_PATH);
    return coverage;
};
const getJestCoverage = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    yield clearJestCache();
    const jestCoverageCommand = (0, utils_1.runner)((0, repo_1.getNpmRunnerCommand)('test --coverage'));
    return jestCoverageCommand.then(() => {
        const coverage = getJestCoverageFile();
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
});
exports.getJestCoverage = getJestCoverage;
const saveCoverageDiff = (filesStatus) => {
    (0, fs_1.writeFileSync)(path_1.default.join(__pwd, getJestCoverageDir(), jestConstants_1.COVERAGE_DIFF), JSON.stringify(filesStatus, null, 2));
};
exports.saveCoverageDiff = saveCoverageDiff;
const isReportPassed = () => {
};
exports.isReportPassed = isReportPassed;


/***/ }),

/***/ 898:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.runner = void 0;
// tslint:disable: no-console
const child_process_1 = __webpack_require__(81);
const path_1 = __importDefault(__webpack_require__(17));
const kleur_1 = __importDefault(__webpack_require__(391));
const CONSOLE_CLEAR_TIMEOUT = 15; // seconds
/**
 * Get Node Binary Path
 * @param {string} binary Name of binary
 * @returns {string} Whole path of binary
 */
function nodeBin(binary) {
    return path_1.default.join(__dirname, '..', '..', 'node_modules', '.bin', binary);
}
function printCommand(command, info) {
    const packageName = info.package ? `📦 ${info.package}` : 'ℹ';
    return `${packageName} \`${command}\``;
}
function debounce(func, delay) {
    let debounceTimer;
    return function (...args) {
        // eslint-disable-next-line prefer-rest-params
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func(...args), delay);
    };
}
;
let shouldClear = false;
const clearDebounce = debounce(() => {
    const optionArgs = process.argv.slice(3);
    if (!optionArgs.includes('--noclear')) {
        shouldClear = true;
        console.log("Console will be cleared with next iteration");
    }
}, CONSOLE_CLEAR_TIMEOUT * 1000);
const setClear = () => {
    if (shouldClear) {
        console.log("\\033c");
        console.log("Console Cleared");
        shouldClear = false;
    }
    else {
        clearDebounce();
    }
};
const ignoreWarnings = [
    /.*PackFileCacheStrategy.*Skipped not serializable cache item 'CopyWebpackPlugin.*No serializer registered for RawSource/,
    /.*('bufferutil'|'utf-8-validate'|the request of a dependency is an expression).*/,
];
const runner = (command, meta = {}) => {
    return new Promise((resolve, reject) => {
        const [_command, ...args] = command.split(' ');
        let output = '';
        const packageName = meta.package;
        const info = Object.assign(Object.assign({}, (meta.info || {})), { package: packageName });
        const options = Object.assign({ shell: process.platform == 'win32', env: process.env }, (meta.options || {}));
        process.env.FORCE_COLOR = 'true';
        let raw = _command;
        if (meta.nodeBin) {
            raw = nodeBin(_command);
        }
        console.debug(kleur_1.default.dim(printCommand(command, info)));
        const cmd = Array.isArray(args) ? (0, child_process_1.spawn)(raw, args, options) : (0, child_process_1.spawn)(raw, options);
        cmd.stdout.on('data', (data) => {
            if (meta.silent) {
                output += data;
            }
            else {
                process.stdout.write(`${printCommand(_command, info)}: ${data}`);
                if (info.onStdout) {
                    info.onStdout(data);
                }
            }
            setClear();
        });
        cmd.stderr.on('data', (data) => {
            shouldClear = false;
            if (!meta.silent) {
                const shouldPrint = ignoreWarnings.some((ignore) => !ignore.test(data));
                const command = `${printCommand(_command, info)}: ${data}`;
                const withColor = Array.isArray(args) && args.includes('test') ? command : command;
                if (shouldPrint) {
                    process.stderr.write(withColor);
                }
            }
            setClear();
        });
        cmd.on('close', (code) => {
            if (code !== 0) {
                console.log(`${printCommand(_command, info)}: Process exited with error code ${code}`);
            }
            code === 0 ? resolve(output) : reject(code);
        });
    });
};
exports.runner = runner;


/***/ }),

/***/ 997:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.git = void 0;
const child_process_1 = __webpack_require__(81);
const cmd_1 = __webpack_require__(898);
const DEFAULT_BASE_BRANCH = 'dev';
const getCurrentBranch = () => {
    return (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD').toString().split('\n')[0];
};
const getGitChangedFiles = (baseBranch = DEFAULT_BASE_BRANCH) => {
    const changedFilesGit = (0, child_process_1.execSync)(`git diff ${baseBranch} --name-status`).toString().split('\n');
    const changedFiles = [];
    const gitStatusRegex = /(?<status>\w+)\s+(?:.*\s+)?(?<fileName>.*)/m;
    changedFilesGit.forEach((line) => {
        const match = gitStatusRegex.exec(line);
        if (match) {
            const { groups: { status, fileName } } = match;
            changedFiles.push({ status, fileName });
        }
    });
    return changedFiles;
};
const gitCheckout = (branchName) => {
    return (0, cmd_1.runner)(`git checkout ${branchName}`);
};
const gitFactory = () => {
    let gitBaseBranch = '';
    let head = '';
    const git = {
        get base() {
            return gitBaseBranch;
        },
        set base(baseBranch) {
            gitBaseBranch = baseBranch;
        },
        get current() {
            return getCurrentBranch();
        },
        get head() {
            return head;
        },
        set head(branchName) {
            head = branchName;
        },
        get changedFiles() {
            return getGitChangedFiles(git.base);
        },
        checkout: gitCheckout,
    };
    return git;
};
exports.git = gitFactory();


/***/ }),

/***/ 732:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createMarkdownTable = exports.getFileStatusIcon = void 0;
const getFileStatusIcon = (status = '') => {
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
};
exports.getFileStatusIcon = getFileStatusIcon;
const convertRowDataToRow = (columns) => {
    return `| ${columns.join(' | ')} |`;
};
const createMarkdownTable = (headers) => {
    const headerKeys = Object.keys(headers);
    const rows = [headerKeys];
    rows.push(headerKeys.map(() => `--------`));
    const addRow = (row) => {
        const rowData = headerKeys.map((headerKey) => row[headerKey]);
        rows.push(rowData);
    };
    const toString = () => {
        return rows.map(convertRowDataToRow).join('\n');
    };
    const table = {
        addRow,
        toString,
    };
    return table;
};
exports.createMarkdownTable = createMarkdownTable;


/***/ }),

/***/ 928:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(898), exports);
__exportStar(__webpack_require__(732), exports);
__exportStar(__webpack_require__(997), exports);
__exportStar(__webpack_require__(275), exports);


/***/ }),

/***/ 557:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getNpmRunnerCommand = exports.getNpmRunner = exports.getJsonFile = exports.isMonorepo = void 0;
const fs_1 = __webpack_require__(147);
const kleur_1 = __importDefault(__webpack_require__(391));
const path_1 = __importDefault(__webpack_require__(17));
const __pwd = process.cwd();
/**
 * Checks if the repo is a monorepo. Uses `workspaces` key in package.json
 * @returns boolean;
 */
const isMonorepo = () => {
    const packageJson = (0, exports.getJsonFile)('package.json');
    return !!packageJson.workspaces;
};
exports.isMonorepo = isMonorepo;
const getJsonFile = (filePath) => {
    if (!path_1.default.isAbsolute(filePath)) {
        filePath = path_1.default.join(__pwd, filePath);
    }
    const fileExists = (0, fs_1.existsSync)(filePath);
    if (!fileExists) {
        const errMessage = `Could not find file: '${filePath}'.`;
        console.error(kleur_1.default.red(errMessage));
        throw new Error(errMessage);
    }
    const fileContent = (0, fs_1.readFileSync)(filePath).toString();
    const fileJson = JSON.parse(fileContent);
    return fileJson;
};
exports.getJsonFile = getJsonFile;
/**
 * Gets the packageManager runner. `yarn` or `npm`.
 * If no lock file is found, `yarn` is default.
 * @returns {String} 'yarn' | 'npm'
 */
const getNpmRunner = () => {
    const hasPackageLock = (0, fs_1.existsSync)(path_1.default.join(__pwd, 'package-lock.json'));
    if (hasPackageLock) {
        return 'npm run';
    }
    return 'yarn';
};
exports.getNpmRunner = getNpmRunner;
const NPM_RESERVED_COMMANDS = ['access', 'adduser', 'audit', 'bin', 'bugs', 'c', 'cache', 'ci', 'cit', 'clean - install', 'clean - install - test', 'completion', 'config', 'create', 'ddp', 'dedupe', 'deprecate', 'dist - tag', 'docs', 'doctor', 'edit', 'explore', 'get', 'help', 'help - search', 'hook', 'i', 'init', 'install', 'install - ci - test', 'install - test', 'it', 'link', 'list', 'ln', 'login', 'logout', 'ls', 'org', 'outdated', 'owner', 'pack', 'ping', 'prefix', 'profile', 'prune', 'publish', 'rb', 'rebuild', 'repo', 'restart', 'root', 'run', 'run - script', 's', 'se', 'search', 'set', 'shrinkwrap', 'star', 'stars', 'start', 'stop', 't', 'team', 'test', 'token', 'tst', 'un', 'uninstall', 'unpublish', 'unstar', 'up', 'update', 'v', 'version', 'view', 'whoami'];
const getNpmRunnerCommand = (command) => {
    const commandParts = command.split(' ');
    const npmCommand = commandParts[0];
    const npmRunner = (0, exports.getNpmRunner)();
    if (npmRunner === 'yarn') {
        return `${npmRunner} ${command}`;
    }
    if (NPM_RESERVED_COMMANDS.includes(npmCommand)) {
        return `${npmRunner} ${command}`;
    }
    return `${npmRunner} run ${command}`;
};
exports.getNpmRunnerCommand = getNpmRunnerCommand;


/***/ }),

/***/ 275:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.truncateString = void 0;
const truncateString = (str, length) => {
    if (str.length <= length) {
        return str;
    }
    else {
        const truncatedString = str.slice(str.length - length, str.length);
        return `...${truncatedString}`;
    }
};
exports.truncateString = truncateString;


/***/ }),

/***/ 762:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.systemCheck = void 0;
const kleur_1 = __importDefault(__webpack_require__(391));
;
const systemCheckFactory = () => {
    const systemChecks = [];
    const addSystemCheck = (systemCheckName, systemCheckFn) => {
        systemChecks.push({ systemCheckFn, name: systemCheckName });
    };
    const run = () => {
        let failed = false;
        for (const systemCheck of systemChecks) {
            const result = systemCheck.systemCheckFn();
            if (result) {
                failed = true;
                console.error(kleur_1.default.red(`SYSTEM_CHECK_FAILED: [${systemCheck.name}] -${result}`));
            }
            else {
                console.log(kleur_1.default.green(`SYSTEM_CHECK_PASSED: [${systemCheck.name}]`));
            }
        }
        if (failed) {
            console.error(kleur_1.default.red('SYSTEM_CHECK_FAILED: Please fix the above errors and try again.'));
        }
    };
    return {
        addSystemCheck,
        run,
    };
};
exports.systemCheck = systemCheckFactory();


/***/ }),

/***/ 655:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "__assign": () => (/* binding */ __assign),
/* harmony export */   "__asyncDelegator": () => (/* binding */ __asyncDelegator),
/* harmony export */   "__asyncGenerator": () => (/* binding */ __asyncGenerator),
/* harmony export */   "__asyncValues": () => (/* binding */ __asyncValues),
/* harmony export */   "__await": () => (/* binding */ __await),
/* harmony export */   "__awaiter": () => (/* binding */ __awaiter),
/* harmony export */   "__classPrivateFieldGet": () => (/* binding */ __classPrivateFieldGet),
/* harmony export */   "__classPrivateFieldIn": () => (/* binding */ __classPrivateFieldIn),
/* harmony export */   "__classPrivateFieldSet": () => (/* binding */ __classPrivateFieldSet),
/* harmony export */   "__createBinding": () => (/* binding */ __createBinding),
/* harmony export */   "__decorate": () => (/* binding */ __decorate),
/* harmony export */   "__exportStar": () => (/* binding */ __exportStar),
/* harmony export */   "__extends": () => (/* binding */ __extends),
/* harmony export */   "__generator": () => (/* binding */ __generator),
/* harmony export */   "__importDefault": () => (/* binding */ __importDefault),
/* harmony export */   "__importStar": () => (/* binding */ __importStar),
/* harmony export */   "__makeTemplateObject": () => (/* binding */ __makeTemplateObject),
/* harmony export */   "__metadata": () => (/* binding */ __metadata),
/* harmony export */   "__param": () => (/* binding */ __param),
/* harmony export */   "__read": () => (/* binding */ __read),
/* harmony export */   "__rest": () => (/* binding */ __rest),
/* harmony export */   "__spread": () => (/* binding */ __spread),
/* harmony export */   "__spreadArray": () => (/* binding */ __spreadArray),
/* harmony export */   "__spreadArrays": () => (/* binding */ __spreadArrays),
/* harmony export */   "__values": () => (/* binding */ __values)
/* harmony export */ });
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});

function __exportStar(m, o) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

/** @deprecated */
function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/** @deprecated */
function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

function __classPrivateFieldIn(state, receiver) {
    if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
    return typeof state === "function" ? receiver === state : state.has(receiver);
}


/***/ }),

/***/ 81:
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ 147:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const systemCheck_1 = __webpack_require__(762);
const jestCoverageDiff_1 = __webpack_require__(846);
if (process.env.CI === 'true') {
    systemCheck_1.systemCheck.run();
    (0, jestCoverageDiff_1.main)();
}
else {
    console.error('This script is meant to be run on CI only. Use CI=true to run locally.');
}

})();

/******/ })()
;