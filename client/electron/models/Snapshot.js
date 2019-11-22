class Snapshot {
  constructor(publicKey, contact, projectId, commitId, fileHashes) {
    this.publicKey = publicKey;
    this.contact = contact;
    this.projectId = projectId;
    this.commitId = commitId;
    this.fileHashes = fileHashes;
  }

  package() {
    return JSON.stringify({
      // TODO: hash this, because of the public key size
      PublicKey: this.publicKey,
      AuthorID: this.authorId,
      ProjectID: this.projectId,
      CommitHash: this.commitId,
      FileHashes: this.fileHashes
    });
  }
}
