# ProSe

## Overview
ProSe is a prototype blockchain for online intellectual property protection. It is an untamperable recording of cross-repository commit history and uses verified timestamps to establish ownership of ideas and files. Backed with Git, it enables streamlined workflows and versioned non-repudiability.

## Getting Started
* Install [protoc](https://github.com/protocolbuffers/protobuf/releases)
`wget https://github.com/protocolbuffers/protobuf/releases/download/v3.10.0/protoc-3.10.0-linux-x86_64.zip`
* Install [noise](https://github.com/perlin-network/noise/) (temporary branch, see repo status)
`go get github.com/perlin-network/noise && cd $GOPATH/src/github.com/perlin-network/noise && git fetch && git checkout cleanup`
* Install [tmuxp](https://github.com/tmux-python/tmuxp)
`pip install tmuxp`

See execution instructions in `prose/examples`.


