const _console = console;
export const consoleFactory = () => {
  return {
    ...global.console,
    debug: (...args: any[]) => {
      let message = '';
      const isMultiLine = args.some((arg) => typeof arg === 'string' && arg.includes('\n'));
      if (isMultiLine) {
        message = args.map((arg) => JSON.stringify(arg)).join('\n');
      } else {
        message = args.map((arg) => JSON.stringify(arg)).join(' ');
      }
      _console.debug(`::debug::${message}`);
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
