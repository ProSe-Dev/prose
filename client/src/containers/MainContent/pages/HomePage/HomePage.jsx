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
    this.handleAddProject = this.handleAddProject.bind(this);
  }

  handleAddProject() {
    console.log('handleAddProject');
    ipc.invoke(events.SELECT_FOLDER)
      .then((path) => {
        return ipc.invoke(events.ADD_PROJECT, 'prose', 'prose@gmail.com', path);
      })
      .then((project) => {
        this.props.history.push(`/project?id=${project.projectId}`);
      });
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
          onClick={this.handleAddProject}
        >
          ADD NEW PROJECT
        </button>
      </div>
    );
  }
};

export default withRouter(HomePage);