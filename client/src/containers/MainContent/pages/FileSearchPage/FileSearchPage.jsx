import React from 'react';
import './style.css';
import Dropzone from 'components/Dropzone';
import TitleBar from 'components/TitleBar';
import Collapse from 'components/Collapse';
import Timeline from 'components/Timeline';
import Spinner from 'components/Spinner';

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;


let fakeEvents = [
  {ts: "2017-09-17T12:22:46.587Z", text: 'Logged in'},
  {ts: "2017-09-17T12:21:46.587Z", text: 'Clicked Home Page'},
  {ts: "2017-09-17T12:20:46.587Z", text: 'Edited Profile'},
  {ts: "2017-09-16T12:22:46.587Z", text: 'Minim quis nisi aute nisi sint.'},
  {ts: "2017-09-16T12:21:46.587Z", text: 'Proident dolore aliqua eiusmod sit duis sit culpa quis labore deserunt deserunt.'},
  {ts: "2017-09-16T12:20:46.587Z", text: 'Clicked Checkout'},
];
let testProjects = [
  { heading: 'Culpa adipisicing minim culpa anim officia velit Lorem et cillum fugiat fugiat eu sit.',
    content: <Timeline items={fakeEvents} /> },
  { heading: 'Ad nisi velit nostrud ex ad Lorem Lorem officia eiusmod nisi eu fugiat consequat.',
    content: <Timeline items={fakeEvents} /> },
  { heading: 'Officia velit sit quis irure minim consectetur commodo.',
    content: <Timeline items={fakeEvents} /> },
  { heading: 'Eu sint adipisicing culpa labore magna.',
    content: <Timeline items={fakeEvents} /> },
];
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
                }, 1000);
                this.setState({ fetching: true });
              }}
              disabled={!this.state.selectedFile || this.state.fetching}
            >
              {"SEARCH"} 
            </button>
            { this.state.fetching && <Spinner className="ml-2" height="40px" width="40px"/> }
          </div>
          <div className="mt-4">
            { this.state.showResultMessage && <SuccessfulSearchMessage count="4"/>}
            { this.state.projectList && <ProjectDisplay projects={this.state.projectList}/>}
          </div>
        </div>
      </div>
    );
  }
};

export default FileSearchPage;