import { systemCheck } from '../../utils/systemCheck';
import { main } from './jestCoverageDiff';

if (process.env.CI === 'true') {
  systemCheck.run();
  main();
} else {
  console.error('This script is meant to be run on CI only. Use CI=true to run locally.');
}
