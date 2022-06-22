# Action: `jestCoverage`
Used it to capture Unit test coverage difference from base branch.

## Restrictions
Some of the key points related to this actions are:
- Only works with `.tsx?` files, ignores `.js` files in test
- Works only for pull requests and cannot work on single branches as of now.
- It means that your workflow should have a base branch, i.e. it should trigger `on`: `pull_request`.


## Requirements
1. Minimum `jest` version is `28.1.1`.
2. Jest should be part of your package.json
3. There should be `test` script in your package.json.
5. Three should be a `jest.config.js` in your root directory.

## Usage
To use this action following things need to be done:
1. Add `jest` package to your repo (or upgrade to 28.1.1 if already added)
```bash
yarn add --dev jest
or
npm install --save-dev jest
```

2. Add `test` script to your package.json
```json
"scripts": {
  "test": "jest"
}
```

3. Add `.github/workflows/pr_builder.yml` to your repo<br/>
```yml
name: PR Builder
on:
  pull_request:
    branches: [ master, dev ] # or any branch you want to activate on
jobs:
  ...
  unit_test: # job id
    name: UT Coverage # Friendly Name
    runs-on: ubuntu-latest
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }} # needed for @admitkard/* packages

    steps:
      - uses: actions/checkout@v2
      - uses: admitkard/actions@jestCoverage
        with:
          token: ${{ secrets.PUSH_TO_PROTECTED_BRANCH_BOT }} # don't change it
```

## Features
- Reports changed files
 
Status: 🟢 Well Done

|  | File | Functions | Branches | Statements |
| -------- | -------- | -------- | -------- | -------- |
| <b title="Modified">🟨</b> | odyssey/...VisaApplications/EditVisaApplication.tsx | 🟢 <b title="94.44 (17/18)">**94%**</b>←<i title="94.44 (17/18)">_94%_</i> | 🟢 <b title="72.22 (13/18)">**72%**</b>←<i title="72.22 (13/18)">_72%_</i> | 🟢 <b title="95.23 (20/21)">**95%**</b>←<i title="95.23 (20/21)">_95%_</i> |

- Annotates failed tests

![](https://aws1.discourse-cdn.com/github/optimized/2X/f/fc706d492f8e7c6e328e17d0eb412b89eb120d54_2_690x390.png)
