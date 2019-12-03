# ProSe

[![Golang Documentation](https://godoc.org/github.com/ProSe-Dev/prose?status.svg)](https://godoc.org/github.com/ProSe-Dev/prose) [![Build Status](https://travis-ci.com/ProSe-Dev/prose.svg)](https://travis-ci.com/ProSe-Dev/prose) [![Go Report Card](https://goreportcard.com/badge/github.com/ProSe-Dev/prose)](https://goreportcard.com/report/github.com/ProSe-Dev/prose)

ProSe is a prototype blockchain for online intellectual property protection. As a service, it provides an untamperable recording of idea ownership as files are modified over time. Ownership can be easily retrieved using verified timestamps. Additionally, ProSe does not receive or store actual file content; only [file hashes](https://en.wikipedia.org/wiki/Hash_function). We integrate with Git for local file versioning so that file changes are stored and versioned, though no knowledge of Git is required.

ProSe is named as wordplay on "Pro Se", which is to represent oneself in court and "prose" being a mundane, prosaic application for its apparent simplicity to users.

## Usage

See the latest ProSe client binaries under [releases](https://github.com/ProSe-Dev/prose/releases).

See the FAQ page within the client for usage instructions.

## Blockchain hosting

See the latest ProSe CLI binary under [releases](https://github.com/ProSe-Dev/prose/releases).

Sample cluster configurations can be found in the examples directory at `prose/examples`.

## Contributing

To contribute to ProSe, a few special dependencies are required.

- Install [protoc](https://github.com/protocolbuffers/protobuf/releases) - make sure that you also execute `go get -u github.com/golang/protobuf/protoc-gen-go` and add $GOPATH/bin to $PATH.
- Install [noise](https://github.com/perlin-network/noise/) - at the time of writing, we are using the `cleanup` branch; after executing `go get` make sure you checkout the correct branch
- Install [tmuxp](https://github.com/tmux-python/tmuxp) - `pip install --user tmuxp` - this is used for example execution in `prose/examples`
