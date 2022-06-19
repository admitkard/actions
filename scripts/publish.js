#!/usr/bin/env node
const { execSync } = require('child_process');
const { runner } = require('./utils');
const k = require('kleur');

const checkGitDirty = () => {
  const gitDirty = execSync('git diff --stat').toString().trim();
  if (gitDirty) {
    const errorMessage = 'Git tree is dirty, please commit changes first';
    console.log(k.red(errorMessage));
    throw new Error(errorMessage);
  }
  return true;
}

const publish = async () => {
  checkGitDirty();
  const actionName = process.argv[2];
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const checkoutActionBranch = execSync(`git checkout -B ${actionName}`);
  console.debug('Building...');
  const build = await runner(`yarn build ${actionName}`);
  execSync('chmod +x dist/*');
  execSync(`cp src/actions/${actionName}/action.yml action.yml`);
  execSync('git add -f dist action.yml');
  execSync(`git commit -m "Published ${actionName}"`);
  console.debug('Pushing to git remote...');
  execSync(`git push origin ${actionName}`);
  console.info(k.green('Published'));
};

publish();
