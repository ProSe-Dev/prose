import React from 'react';
import { SYNC_CREATE_PROJECT_CH } from 'shared/constants.js';
import './IPCheckPage.css'

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;

class IPCheckPage extends React.Component {
  constructor(){
    super()
    this.state = {
      submitted: true,
      file_chosen: null,
    };
  }

  handleSubmit(){
    this.setState({
      submitted: true,
      file_chosen: this.state.file_chosen,

    })
  }

  render() {
    const fileButton = getFileButton();
    const submitButton = getSubmitButton(this.handleSubmit);
    const bottomPage = getRestPage(this.state);
    return (
      <div class="main-container">
        <div class="display-4">IP Check</div>
        <p class="description">{ipCheckDescription}</p>
        {fileButton}
        <div class="file-container"> </div>
        {submitButton}
        <div class="file-container"></div>
        {bottomPage}
      </div>
    );
  }
};

export default IPCheckPage;

const ipCheckDescription = "This is where you can do a IP verification on a file. Information will be displayed if the file exists on the blockchain.";

function getFileButton(){
  return (
    <button 
          class="choose-file-button"
          onClick={() => {
            console.log('button pressed');
            let result = ipc.sendSync(SYNC_CREATE_PROJECT_CH, 'testproject');
            console.log(result);
          }}
        >
          Choose File
        </button>
  );
}

function getSubmitButton(handler){
  return (
    <div><button
    class="submit-button btn btn-primary"
    onClick={handler}>
    Submit
  </button></div>
    
  );
}

function getRestPage(state_of_page){
  // if submit button has been pressed
  if(state_of_page.submitted){
    return(
      <div class="bottomPage">
        <h3>Hash</h3>
        <p>aed85dbe7c334f66bae908997be6cd0ddb2074ff5b0d4e1a8a3169b4031f2c03</p>
        <h3>Transaction History</h3>
      </div>
    )
  }
}