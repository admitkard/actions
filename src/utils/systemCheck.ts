import kleur from "kleur";

/**
 * Function to do system check. Return false if system check fails.
 */
type SystemCheckFunction = () => undefined | string;

interface SystemCheckMeta {
  name: string;
  systemCheckFn: SystemCheckFunction;
};

const systemCheckFactory = () => {
  const systemChecks: SystemCheckMeta[] = []
  const addSystemCheck = (systemCheckName: string, systemCheckFn: SystemCheckFunction) => {
    systemChecks.push({systemCheckFn, name: systemCheckName});
  };
  const run = () => {
    let failed = false;
    for (const systemCheck of systemChecks) {
      const result = systemCheck.systemCheckFn();
      if (result) {
        failed = true;
        console.error(kleur.red(`SYSTEM_CHECK_FAILED: [${systemCheck.name}] -${result}`))
      } else {
        console.log(kleur.green(`SYSTEM_CHECK_PASSED: [${systemCheck.name}]`))
      }
    }
    if (failed) {
      console.error(kleur.red('SYSTEM_CHECK_FAILED: Please fix the above errors and try again.'));
    }
  };

  return {
    addSystemCheck,
    run,
  }
}

export const systemCheck = systemCheckFactory();
