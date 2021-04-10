#!/usr/bin/env node

const { program } = require("commander");

program.version(`iv ${require("./package.json").version}`);

program
  .command("add")
  .description("迭代版本号")
  .action(() => {
    require("./src/iteration")();
  });

program.parse(process.argv);
