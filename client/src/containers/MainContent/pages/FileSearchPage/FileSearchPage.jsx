import React from 'react';
import { SYNC_CREATE_PROJECT_CH } from 'shared/constants.js';
import Dropzone from 'components/Dropzone';
import TitleBar from 'components/TitleBar';

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;

class FileSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: {},
      searchResults: [],
    };
  }
  render() {
    return (
      <div>
        <TitleBar 
          title="IP Check"
          subtitle="This is where you can do an IP verification on a file. Information will be displayed if the file exists on the blockchain"
          color="blue"
        />
        <Dropzone parent={this}/>
        <button
        style={{
          float: 'left',
          margin: '15px',
        }}
          type="button"
          className="btn btn-success"
          onClick={() => {
            console.log('request: ' + '13.93.197.68:8080/search?filehash=' + this.state.selectedFile.hash);
            fetch('http://13.93.197.68:8080/search?filehash=' + this.state.selectedFile.hash)
            .then(res => {
              console.log("Got " + res ); res.text()
            })
            .then(result => this.setState({ searchResults: result}))
          }}
        >
          {"SEARCH for " + this.state.selectedFile.path}
        </button>
      </div>
    );
  }
};

export default FileSearchPage;