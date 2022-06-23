// tslint:disable: no-console
import { spawn, SpawnOptions } from 'child_process';
import path from 'path';
import k from 'kleur';

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
  const packageName = info.package ? `📦 ${info.package}` : 'ℹ';
  return `${packageName} \`${command}\``;
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

export const setClear = () => {
  if (shouldClear) {
    console.log("\\033c");
    console.log("Console Cleared");
    shouldClear = false;
  } else {
    clearDebounce();
  }
}

interface RunnerMeta {
  info: Record<string, any>;
  silent: boolean;
  package: string;
  nodeBin: boolean;
  options: SpawnOptions;
}

const ignoreWarnings = [
  /.*PackFileCacheStrategy.*Skipped not serializable cache item 'CopyWebpackPlugin.*No serializer registered for RawSource/,
  /.*('bufferutil'|'utf-8-validate'|the request of a dependency is an expression).*/,
]
export const runner = (command: string, meta: Partial<RunnerMeta> = {}) => {
  return new Promise((resolve, reject) => {
    const [_command, ...args] = command.split(' ');
    let stdout = '';
    let stderr = '';

    const packageName = meta.package;
    const info: Record<string, any> = {
      ...(meta.info || {}),
      package: packageName,
    };

    const options = {
      shell: process.platform == 'win32',
      env: process.env,
      ...(meta.options || {}),
    };

    process.env.FORCE_COLOR = 'true';
    let raw = _command;
    if (meta.nodeBin) {
      raw = nodeBin(_command);
    }

    console.log(k.dim(printCommand(command, info)));
    
    const cmd = Array.isArray(args) ? spawn(raw, args, options) : spawn(raw, options);

    cmd.stdout.on('data', (data) => {
      stdout += data;
      process.stdout.write(`${printCommand(_command, info)}: ${data}\n`);
      if (info.onStdout) {
        info.onStdout(data);
      }
    });
    cmd.stderr.on('data', (data: string) => {
      shouldClear = false;
      stderr += data;
      const shouldPrint = ignoreWarnings.some((ignore) => !ignore.test(data));
      let command = `${printCommand(_command, info)}: ${data}`;
      if (data && data.toString().startsWith(`::`)) {
        command = data;
      }
      const withColor = Array.isArray(args) && args.includes('test') ? command : command;
      if (shouldPrint) {
        process.stderr.write(`${withColor}\n`);
      }
    });

    cmd.on('close', (code) => {
      if (code !== 0) {
        console.log(`${printCommand(_command, info)}: Process exited with error code ${code}`);
      }
      code === 0 ? resolve(stdout) : reject(stderr);
    });
  });
};
