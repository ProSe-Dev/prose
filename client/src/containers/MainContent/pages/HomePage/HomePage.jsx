import React from 'react';
import { SYNC_CREATE_PROJECT_CH } from 'shared/constants.js';

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;

class HomePage extends React.Component {
  render() {
    return (
      <div>
<<<<<<< HEAD
        <button type="button" class="btn btn-success">
          ADD NEW PROJECTX
=======
        <button 
          type="button"
          className="btn btn-success"
          onClick={() => {
            console.log('button pressed');
            let result = ipc.sendSync(SYNC_CREATE_PROJECT_CH, 'testproject');
            console.log(result);
          }}
        >
          ADD NEW PROJECT
>>>>>>> 4789d93e0af6fccaa8cf916f1d2bf457208131a6
        </button>
      </div>
    );
  }
};

export default HomePage;