import React from 'react';
import Timeline from "./Timeline";
// import fetch from 'fetch';
import './App.css';

const RELAY_ADDRESS = process.env.RELAY_ADDRESS || 'http://localhost:8080';

async function requestBlockchain() {
  // let res = await fetch(RELAY_ADDRESS);
  let res = {}
  res.status = 200;
  res.json = () => require('./samples/blockchain.json');
  return res;   
}

function blocksToTimelineEvent(blocks) {
  return blocks.map(b => {
    return {
      ts: b.Timestamp,
      text: b.CommitHash,
      highlighted: b.isNewBlock,
      highlightedText: "NEW BLOCK"
    };
  });
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      blockchain: [],
      blockMap: {}
    }
    this.fetchBlockChain = this.fetchBlockChain.bind(this);
  }

  async componentDidMount() {
    await this.fetchBlockChain();
    setInterval(async () => {
      await this.fetchBlockChain();
    }, 1000);
  }

  async fetchBlockChain() {
    let res = await requestBlockchain();

    if (res.status === 200) {
      let blockchain = await res.json();
      let newBlockMap = {...this.state.blockMap};
      // do nothing if blockchain hasn't grown
      if (blockchain.length === this.state.blockchain.length) {
        return;
      }
      // loop over to mark newly added blocks
      for (const block of blockchain) {
        if (!(block.CommitHash in newBlockMap)) {
          newBlockMap[block.CommitHash] = block;
          block.isNewBlock = true;
        }  else {
          block.isNewBlock = false;
        }
      }
      this.setState({ blockchain, blockMap: newBlockMap });
    }
  }

  render() {
    const { blockchain } = this.state;

    return (
      <div className="App">
        <div/>
        <div>
          <Timeline items={blocksToTimelineEvent(blockchain)} />
        </div>
      </div>
    );
  }
}

export default App;
