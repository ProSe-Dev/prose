import React from 'react';
import {SELECT_FOLDER, ADD_PROJECT, GET_PROJECT_INFO} from 'shared/ipc-events';

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;

class HomePage extends React.Component {
  render() {
    return (
      <div>
        <button 
          type="button"
          className="btn btn-success"
          onClick={() => {
            console.log('button pressed');
            ipc.invoke(GET_PROJECT_INFO, ['123'])
              .then(result => console.log(result));
          }}
        >
          ADD NEW PROJECT
        </button>
      </div>
    );
  }
};

export default HomePage;