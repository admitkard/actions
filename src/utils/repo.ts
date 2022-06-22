import { existsSync, readFileSync } from 'fs';
import kleur from 'kleur';
import path from 'path';
const __pwd = process.cwd();

/**
 * Checks if the repo is a monorepo. Uses `workspaces` key in package.json
 * @returns boolean;
 */
export const isMonorepo = () => {
  const packageJson = getJsonFile('package.json');
  return !!packageJson.workspaces;
}

export const getJsonFile = (filePath: string) => {
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(__pwd, filePath);
  }
  const fileExists = existsSync(filePath);
  if (!fileExists) {
    const errMessage = `Could not find file: '${filePath}'.`;
    console.error(kleur.red(errMessage));
    throw new Error(errMessage);
  }
  const fileContent = readFileSync(filePath).toString();
  const fileJson = JSON.parse(fileContent);
  return fileJson;
};

/**
 * Gets the packageManager runner. `yarn` or `npm`.
 * If no lock file is found, `yarn` is default.
 * @returns {String} 'yarn' | 'npm'
 */
export const getNpmRunner = () => {
  const hasPackageLock = existsSync(path.join(__pwd, 'package-lock.json'));
  if (hasPackageLock) {
    return 'npm';
  }
  return 'yarn';
}

const NPM_RESERVED_COMMANDS = ['access', 'adduser', 'audit', 'bin', 'bugs', 'c', 'cache', 'ci', 'cit', 'clean-install', 'clean-install-test', 'completion', 'config', 'create', 'ddp', 'dedupe', 'deprecate', 'dist-tag', 'docs', 'doctor', 'edit', 'explore', 'get', 'help', 'help-search', 'hook', 'i', 'init', 'install', 'install-ci-test', 'install-test', 'it', 'link', 'list', 'ln', 'login', 'logout', 'ls', 'org', 'outdated', 'owner', 'pack', 'ping', 'prefix', 'profile', 'prune', 'publish', 'rb', 'rebuild', 'repo', 'restart', 'root', 'run', 'run-script', 's', 'se', 'search', 'set', 'shrinkwrap', 'star', 'stars', 'start', 'stop', 't', 'team', 'test', 'token', 'tst', 'un', 'uninstall', 'unpublish', 'unstar', 'up', 'update', 'v', 'version', 'view', 'whoami'];

const NPM_COMMAND_MAPPER = {
  'install': 'ci',
};

const YARN_COMMAND_MAPPER = {
  'install': 'install --frozen-lockfile',
}
export const getNpmRunnerCommand = (command: string, args?: string[]) => {
  const commandParts = command.split(' ');
  const npmCommand = commandParts[0];
  const npmRunner = getNpmRunner();
  if (npmRunner === 'yarn') {
    const finalCommand = YARN_COMMAND_MAPPER[command] || command;
    return `${npmRunner} ${finalCommand} ${args}`;
  }
  if (NPM_RESERVED_COMMANDS.includes(npmCommand)) {
    const finalCommand = NPM_COMMAND_MAPPER[command] || command;
    return `${npmRunner} ${finalCommand} -- ${args}`;
  }
  return `${npmRunner} run ${command} -- ${args}`;
};
