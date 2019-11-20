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

export default AddProjectPage;

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
  var transac_list = 
    [{
      Timestamp:"Oct 24 2019 23:19:58",
      Author:"meme@gmail.com",
      ProjectName: "Invest Now in Memes"
    },{
      Timestamp:"Oct 11 2019 05:11:45",
      Author:"Fake Ford R&D",
      ProjectName: "Mustang Mach-e"
    }]
  var fileHash = "aed85dbe7c334f66bae908997be6cd0ddb2074ff5b0d4e1a8a3169b4031f2c03"
  var transactionHistory = getTransactions(transac_list);
  // if submit button has been pressed
  if(state_of_page.submitted){
    return(
      <div class="bottomPage">
        <h3>Hash</h3>
        <p>{fileHash}</p>
        <h3>Transaction History</h3>
        <div>{transactionHistory}</div>
      </div>
    )
  }
}

function getTransactions(t_list){

  var rows = [];
  function generateRow(row){
    rows.push(
    <tr class="file-row-light">
      <td>{row.Timestamp}</td>
      <td>{row.Author}</td>
      <td>{row.ProjectName}</td>
    </tr>)
  }
  t_list.map(generateRow);
  return(
    <table class="table">
        <thead>
          <tr class = "file-row-dark">
            <th scope="col">Timestamp</th>
            <th scope="col">Author</th>
            <th scope="col">Project Name</th>
          </tr>
        </thead>
        <tbody> {rows} </tbody>
      </table>
  );
}