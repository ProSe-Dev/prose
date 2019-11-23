import React from 'react';
import events from 'shared/ipc-events';

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;

class HomePage extends React.Component {
  render() {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}>
        <button 
          style={{
            width: 300,
          }}
          type="button"
          className="btn btn-success"
          onClick={() => {
            console.log('button pressed');
            ipc.invoke(events.SEARCH_FILE, ['/home/gordon/Workspace/School/cpen-442/prose/client/package.json'])
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