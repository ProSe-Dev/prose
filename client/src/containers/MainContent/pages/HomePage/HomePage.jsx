import React from 'react';
import { withRouter } from "react-router"
import events from 'shared/ipc-events';

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

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
          onClick={this.props.onAddProject}
        >
          ADD NEW PROJECT
        </button>
      </div>
    );
  }
};

export default withRouter(HomePage);