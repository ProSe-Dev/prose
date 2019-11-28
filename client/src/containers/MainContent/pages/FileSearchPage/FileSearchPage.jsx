import React from 'react';
import './style.css';
import Dropzone from 'components/Dropzone';
import TitleBar from 'components/TitleBar';
import Collapse from 'components/Collapse';
import Timeline from 'components/Timeline';
import Spinner from 'components/Spinner';
import { border } from '@material-ui/system';

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;


let fakeEvents = [
  {ts: "2017-09-17T12:22:46.587Z", text: '1f74b60e-e368-4a08-8755-515797dfd8bd'},
  {ts: "2017-09-17T12:21:46.587Z", text: 'ce3852a7-7a4c-436a-9327-a39208dea594'},
  {ts: "2017-09-17T12:20:46.587Z", text: 'f366aa18-b4ec-48fd-923e-5fd9d1f899ed'},
  {ts: "2017-09-16T12:22:46.587Z", text: '084087f3-886f-49bc-94be-ca34bf3321b5'},
  {ts: "2017-09-16T12:21:46.587Z", text: '7ff2dcf0-3c4f-47e1-ae18-b18b0736aba9'},
  {ts: "2017-09-16T12:20:46.587Z", text: 'bf5b70c7-84e6-4f47-9d9f-0e42cc5c1960'},
];
let testProjects = [
  { heading: 'CPEN 442 Assignment 1 Answer Key',
    content: (
      <div>
        <ProjectContact author="Prof. Konstantin Beznosov" contact="cpen442@ece.ubc.ca"/>
        <Timeline items={fakeEvents} />
      </div>
     )},
  { heading: 'My Dank Meme Collection 3',
    content: (
      <div>
        <ProjectContact author="Prof. Konstantin Beznosov" contact="cpen442@ece.ubc.ca"/>
        <Timeline items={fakeEvents} />
      </div>
    )},
];

function ProjectContact(props) {
  return (
    <div
      style={{
        color: '#856404',
        backgroundColor: '#fff3cd',
        padding: '0.25em 1em 0.25em 1em',
        margin: '0em 1em 2em 2em',
        textAlign: 'left',
        border: '2px solid #ffeeba',
      }}
    >
      <div><b>Author: </b>{props.author}</div>
      <div><b>Contact: </b>{props.contact}</div>
    </div>
  )
}

function ProjectDisplay(props) {
  return (
    <div className="project-display">
      <Collapse 
        items={props.projects}
      />
    </div>
  );
}

function SuccessfulSearchMessage(props) {
  return (
    <div class="alert alert-success" role="alert">
      {props.count} projects were found to contain the file!
    </div>
  );
};

class FileSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      searchResults: [],
      fetching: false,
      projectList: null,
      showResultMessage: false,
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
        <div className="inner-container">
          <Dropzone parent={this}/>
          <div className="fstart-wrapper mt-4">
            <button
              type="button"
              className="btn btn-success"
              onClick={() => {
                // TODO: electron should take care of this
                // console.log('request: ' + '13.93.197.68:8080/search?filehash=' + this.state.selectedFile.hash);
                // fetch('http://13.93.197.68:8080/search?filehash=' + this.state.selectedFile.hash)
                // .then(res => {
                //   console.log("Got " + res ); res.text()
                // })
                // .then(result => this.setState({ searchResults: result}))

                setTimeout(() => {
                  this.setState({ projectList: testProjects, fetching: false, showResultMessage: true });
                }, 100);
                this.setState({ fetching: true });
              }}
              disabled={!this.state.selectedFile || this.state.fetching}
            >
              {"SEARCH"} 
            </button>
            { this.state.fetching && <Spinner className="ml-2" height="40px" width="40px"/> }
          </div>
          <div className="mt-4">
            { this.state.showResultMessage && <SuccessfulSearchMessage count="2"/>}
            { this.state.projectList && <ProjectDisplay projects={this.state.projectList}/>}
          </div>
        </div>
      </div>
    );
  }
};

export default FileSearchPage;