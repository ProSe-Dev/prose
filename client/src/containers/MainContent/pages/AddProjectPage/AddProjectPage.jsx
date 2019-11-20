import React from 'react';
import { SYNC_CREATE_PROJECT_CH } from 'shared/constants.js';
import './AddProjectPage.css'

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;

class AddProjectPage extends React.Component {
  constructor(){
    super()
    this.state = {
      file_chosen: null,
    };
  }

  render() {
    const addButton = getAddProjectButton();
    return (
      <div class="main-container">
        <div class = "display-4 page-title"> Project Setup</div>
        <div>{addButton}</div>
        <label>
            Project Name:
            <input type="text" name="name" />
        </label>
        <input type="submit" value="Submit" />
      </div>
    );
  }
};

export default AddProjectPage;

function getAddProjectButton(){
  return(
    <button 
          type="button"
          className="btn btn-success add-button"
          onClick={() => {
            console.log('button pressed');
            let result = ipc.sendSync(SYNC_CREATE_PROJECT_CH, 'testproject');
            console.log(result);
          }}
        >
          ADD NEW PROJECT
        </button>
  )
}