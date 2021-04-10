const inquirer = require("inquirer");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const childProcess = require("child_process");

let tags = [],
  versionType = ["补丁版本号", "次版本号", "主版本号"],
  tagVersionType = ["tag版本号", ...versionType],
  ans = {};

let pkgPath, pkg, pkgName, pkgVersion;

try {
  pkgPath = path.resolve("package.json");
  pkg = fs.readFileSync(pkgPath, "utf8");
  pkgName = JSON.parse(pkg).name;
  pkgVersion = JSON.parse(pkg).version;
} catch (err) {
  console.log(err);
}

function tagAsk() {
  let cmd = `npm info ${pkgName} dist-tags`;
  let rel = childProcess.execSync(cmd).toString();
  tags = buildTags(rel);
  let latestIndex = 0;
  tags.find((val, index) => {
    if (val.tag === "latest") {
      latestIndex = index;
      return true;
    }
  });

  let tmp = tags[latestIndex];
  tags[latestIndex] = tags[0];
  tags[0] = tmp;

  let tagQuestion = {
    type: "list",
    name: "tags",
    message: "选择所需要修改版本号的分支或标签: ",
    choices: tags,
    filter: (rel) => {
      return tags.find((val) => val.name === rel);
    },
  };

  inquirer.prompt([tagQuestion]).then((answers) => {
    ans = { ...answers };
    versionTypeAsk(answers.tags.version);
  });
}

function versionTypeAsk(version) {
  let versionArr = version.split(/[\.-]/g);
  let versionTypes = [];
  if (versionArr.length === 3) {
    versionTypes = versionType;
  }
  if (versionArr.length === 5) {
    versionTypes = tagVersionType;
  }
  let versionTypeQuestion = {
    type: "list",
    name: "versionType",
    message: "选择所需要修改的版本号类型: ",
    choices: versionTypes,
  };
  inquirer.prompt([versionTypeQuestion]).then((answers) => {
    ans = { ...ans, ...answers };
    let index = versionTypes.indexOf(answers.versionType);
    let relVersion;
    if (versionArr.length === 3) {
      versionArr[versionArr.length - 1 - index]++;
      relVersion = `${versionArr[0]}.${versionArr[1]}.${versionArr[2]}`;
    }
    if (versionArr.length === 5) {
      let tmpVersionArr = [
        versionArr[0],
        versionArr[1],
        versionArr[2],
        versionArr[4],
      ];
      tmpVersionArr[tmpVersionArr.length - 1 - index]++;
      relVersion = `${tmpVersionArr[0]}.${tmpVersionArr[1]}.${tmpVersionArr[2]}-${versionArr[3]}.${tmpVersionArr[3]}`;
    }
    let tmpPkg = JSON.parse(pkg);
    tmpPkg.version = relVersion;
    tmpPkg = JSON.stringify(tmpPkg, null, 2);
    fs.writeFileSync(pkgPath, tmpPkg);
    console.log("\n");
    console.log(
      chalk.blue("================================================\n")
    );
    console.log(chalk.green(`迭代版本号成功，当前版本号为： ${relVersion}\n`));
    console.log(
      chalk.blue("================================================\n")
    );
  });
}

function buildTags(str) {
  let tagsStr = str.replace(/[\s\'\"\\\/\b\f\n\r\t]/g, "");
  let arr = tagsStr.match(/{(.*)}/)[1].split(",");
  return arr.map((val) => {
    let tag = val.split(":");
    return { name: `${tag[0]}:   ${tag[1]}`, tag: tag[0], version: tag[1] };
  });
}

module.exports = () => {
  tagAsk();
};
