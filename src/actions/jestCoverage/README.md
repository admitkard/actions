# Action jestCoverage
Used to capture coverage difference from base branch.

Some of the key points related to this actions are:
- Works only for diff and cannot work on single branches as of now.
- It means that your workflow should have a base branch, i.e. it should trigger `on`: `pull_request`.


# Usage
```yaml
name: Jest Coverage
on:
  pull_request: # important
    branches: [ master, dev ]

jobs:
  ...
  unit_test:
    name: UT Coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: admitkard/actions@jestCoverage # use action here
```
