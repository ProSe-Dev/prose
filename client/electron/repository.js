var git = require('nodegit-kit');

/**
 * opens a repo, if path currently isnt a repo, initalize it
 * @param {String} path - absolute path to repo 
 */
function openRepo(path) {
  console.log('openRepo');
  return git.open(path, { 'init': false })
    .then((nodegitRepo) => { 
      console.log('opening repo', nodegitRepo);
      return new Repository(nodegitRepo)
    })
    .catch((err) => {
      console.log(err);
    });
}

class Repository {
  constructor(nodegitRepo) {
    this.repo = nodegitRepo;
    this.head = null;
  }

  commit(message) {
    return git.commit(this.repo, { message })
      .then((oid) => {
        this.head = oid;
      })
  }

  header() {
    return new Promise((resolve, reject) => {
      if (this.head) {
        resolve(this.head);
      }

      this.repo.getHeadCommit()
        .then((commit) => {
          this.head = {
            id: commit.id().tostrS(),
            message: commit.message()
          }
          resolve(this.head);
        })
        .catch((err) => {
          reject(err);
        })
    });
  }
}

module.exports = {
  openRepo,
};
