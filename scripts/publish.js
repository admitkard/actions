#!/usr/bin/env node
const { execSync } = require('child_process');
const { runner } = require('./utils');
const k = require('kleur');

console.log(process.argv);
const actionName = process.argv[2];

const checkGitDirty = () => {
  const gitDirty = execSync('git diff --stat');
  if (gitDirty) {
    const errorMessage = 'Git tree is dirty, please commit changes first';
    console.log(k.red(errorMessage));
    throw new Error(errorMessage);
  }
  return true;
}

const publish = async () => {
  checkGitDirty();
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const checkoutActionBranch = execSync(`git checkout -B ${actionName}`);
  const build = await runner(`yarn build action=${actionName}`);
  execSync('git add -f dist');
  execSync(`git commit -m "Published ${actionName}"`);
  execSync(`git push origin ${actionName}`);
};

publish();
