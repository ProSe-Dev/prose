var git = require("nodegit-kit");
var Repository = require('./Repository.js');

function open(path) {
  return git.init('.projects/test_project', { 'init': true });
}

async function main() {
  try {
    nodegitRepo = await open('.projects/test_project');
    repo = new Repository(nodegitRepo);
    head = await repo.header();
    console.log(head);
  } catch (err) {
    console.log(err);
  }
}

main()