import { execSync } from "child_process";
import { runner } from "./cmd";

const DEFAULT_BASE_BRANCH = 'dev';
const getCurrentBranch = () => {
  return execSync('git rev-parse --abbrev-ref HEAD').toString().split('\n')[0];
};

export interface GitChangedFile {
  status: string;
  fileName: string;
}

const getGitChangedFiles = (baseBranch = DEFAULT_BASE_BRANCH) => {
  const changedFilesGit = execSync(`git diff ${baseBranch} --name-status`).toString().split('\n');
  const changedFiles: GitChangedFile[] = [];
  const gitStatusRegex = /(?<status>\w+)\s+(?:.*\s+)?(?<fileName>.*)/m;
  changedFilesGit.forEach((line) => {
    const match = gitStatusRegex.exec(line);
    if (match) {
      const { groups: { status, fileName } } = match;
      changedFiles.push({ status, fileName });
    }
  });
  
  return changedFiles;
};

const gitCheckout = (branchName: string) => {
  return runner(`git checkout ${branchName}`);
}

const gitFactory = () => {
  let gitBaseBranch = '';
  let head = '';
  const git = {
    get base() {
      return gitBaseBranch;
    },
    set base(baseBranch: string) {
      gitBaseBranch = baseBranch;
    },
    get current() {
      return getCurrentBranch();
    },
    get head() {
      return head;
    },
    set head(branchName: string) {
      head = branchName;
    },
    get changedFiles() {
      return getGitChangedFiles(git.base);
    },
    checkout: gitCheckout,
  }
  return git;
}

export const git = gitFactory();
