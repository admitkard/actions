import { main } from './jestCoverageDiff';

console.log('process.env.CI', process.env.CI);
if (process.env.CI === 'true') {
  console.log('executing main');
  main();
}
