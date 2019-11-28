## Relay server
The relay server implemented here acts essentially as a frontend for the blockchain and allows clients to interact with the blockchain through HTTP requests.

### How to run
To execute a non-distributed standalone relay server for testing:
```
./relay start 8080 3000 -c trivial
```

## CURL request samples
### GET / returns entire blockchain
`curl <ip.address>:8080`

### GET /search returns list of projects that have matching file hash
`curl <ip.address>:8080/search?filehash=<hash>`

### GET /transaction submits data to the blockchain
`curl <ip.address>:8080/transaction -X POST -d @sample_payload.json`
`curl <ip.address>:8080/transaction -X POST -d @sample_payload2.json`

### Note
* You can get the SHA256 of a file with `sha256sum -b <FILE>`
