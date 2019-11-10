var git = require('nodegit-kit');
var nodegit = require('nodegit');

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
          resolve(head);
        })
        .catch((err) => {
          reject(err);
        })
    });
  }
}

module.exports = Repository;
