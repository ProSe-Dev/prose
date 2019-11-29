class Snapshot {
  constructor(publicKey, contact, projectID, commitId, fileHashes) {
    this.publicKey = publicKey;
    this.contact = contact;
    this.projectID = projectID;
    this.commitId = commitId;
    this.fileHashes = fileHashes;
  }

  package() {
    return JSON.stringify({
      // TODO: hash this, because of the public key size
      PublicKey: this.publicKey,
      AuthorID: this.authorId,
      ProjectID: this.projectID,
      CommitHash: this.commitId,
      FileHashes: this.fileHashes
    });
  }
}
