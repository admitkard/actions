import kleur from 'kleur';

const _console = console;
export const consoleFactory = () => {
  return {
    ...global.console,
    debug: (...args: any[]) => {
      let message = '';
      if (args.length === 1) {
        args = args[0];
      }
      try {
        message = JSON.stringify(args, null, 2);
      } catch {
        const isMultiLine = args.some((arg) => typeof arg === 'string' && arg.includes('\n'));
        message = args.map((arg) => JSON.stringify(arg)).join(isMultiLine ? '\n' : ' ');
      }
      const debugMessage = process.env.GITHUB_ACTIONS ? `::debug::${message}` : kleur.blue(message);
      _console.debug(debugMessage);
    },
    group: (groupName: string) => {
      _console.log(`::group::${groupName}`);
    },
    groupEnd: () => {
      _console.log(`::endgroup::`);
    }
  }
}

global.console = consoleFactory();
