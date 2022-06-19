#!/usr/bin/env node
const { runner } = require('./utils');

const build = async () => {
  const actionName = process.argv[2];
  const build = await runner(`yarn _build action=${actionName}`);
};

build();
