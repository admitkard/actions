// tslint:disable: no-console
const { spawn, SpawnOptions } = require('child_process');
const path = require('path');

const CONSOLE_CLEAR_TIMEOUT = 15; // seconds
/**
 * Get Node Binary Path
 * @param {string} binary Name of binary
 * @returns {string} Whole path of binary
 */
function nodeBin(binary) {
  return path.join(__dirname, '..', '..', 'node_modules', '.bin', binary);
}

function printCommand(command, info) {
  const package = info.package ? `📦 ${info.package}` : 'ℹ';
  return `${package} \`${command}\``;
}

function debounce(func, delay) {
  let debounceTimer;
  return function(...args){
    // eslint-disable-next-line prefer-rest-params
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(...args), delay);
  };
};

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
    console.log("\033c");
    console.log("Console Cleared");
    shouldClear = false;
  } else {
    clearDebounce();
  }
}
/**
 * Runner meta object that can contain cwd, 
 * @typedef {Object} RunnerMeta
 * @property {Object} [info] - Info related to the command being run
 * @property {string} [package] - Package name under which the command is running
 * @property {boolean} [nodeBin] - Run command from node_modules/.bin instead of raw CLI
 * @property {SpawnOptions} [options] - SpawnOptions related the spawned children.
 */

/**
 * @typedef 
 * @param {string} command CLI command to run, give args separated by space
 * @param {RunnerMeta} meta CLI arguments, or SpawnOptions
 * @returns {Promise<string>} Promise that will return exit code, or stderr on exit
 */

const ignoreWarnings = [
  /.*PackFileCacheStrategy.*Skipped not serializable cache item 'CopyWebpackPlugin.*No serializer registered for RawSource/,
  /.*('bufferutil'|'utf-8-validate'|the request of a dependency is an expression).*/,
]
const runner = (command, meta = {}) => {
  return new Promise((resolve, reject) => {
    const [ _command, ...args] = command.split(' ');

    const package = meta.package;
    const info = {
      ...(meta.info || {}),
      package: package,
    };

    const options = {
      shell: process.platform == 'win32',
      env: process.env,
      ...(meta.options || {}),
    };

    process.env.FORCE_COLOR = true;
    let raw = _command;
    if (meta.nodeBin) {
      raw = nodeBin(_command);
    }

    console.debug({ args });
    
    const cmd = Array.isArray(args) ? spawn(raw, args, options) : spawn(raw, options);

    cmd.stdout.on('data', (data) => {
      process.stdout.write(`${printCommand(_command, info)}: ${data}`);
      if (info.onStdout) {
        info.onStdout(data);
      }
      setClear();
    });
    cmd.stderr.on('data', (data) => {
      shouldClear = false;
      const shouldPrint = ignoreWarnings.some((ignore) => !ignore.test(data));
      const command = `${printCommand(_command, info)}: ${data}`;
      const withColor = Array.isArray(args) && args.includes('test') ? command : command;
      if (shouldPrint) {
        process.stderr.write(withColor);
      }
      setClear();
    });

    cmd.on('close', (code) => {
      console.log(`${printCommand(_command, info)}: Process exited with error code ${code}`);
      code === 0 ? resolve() : reject(code);
    });
  });
};

module.exports = {
  runner: runner
};
