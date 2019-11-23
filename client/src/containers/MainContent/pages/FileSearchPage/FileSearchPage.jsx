import React from 'react';
import { SYNC_CREATE_PROJECT_CH } from 'shared/constants.js';
import Dropzone from 'components/Dropzone';
import TitleBar from 'components/TitleBar';

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;

class FileSearchPage extends React.Component {
  render() {
    return (
      <div>
        <TitleBar 
          title="IP Check"
          subtitle="This is where you can do an IP verification on a file. Information will be displayed if the file exists on the blockchain"
          color="blue"
        />
        <Dropzone/>
        <button
        style={{
          float: 'left',
          margin: '15px',
        }}
          type="button"
          className="btn btn-success"
          onClick={() => {
            console.log('button pressed');
            fetch('localhost:8080/search?filehash=test')
          }}
        >
          SEARCH
        </button>
      </div>
    );
  }
};

export default FileSearchPage;