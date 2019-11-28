import React from "react";
import "./style.css";
import Dropzone from "components/Dropzone";
import TitleBar from "components/TitleBar";
import Collapse from "components/Collapse";
import Timeline from "components/Timeline";
import Spinner from "components/Spinner";
import events from "shared/ipc-events";

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require("electron").ipcRenderer;

function blocksToTimelineEvent(blocks) {
  return blocks.map(b => {
    return {
      ts: b.Data.Timestamp,
      text: b.Data.CommitHash
    };
  });
}

function Project(projectData) {
  if (projectData.length == 0) {
    return null;
  }
  console.log(projectData);
  let heading = projectData[0].Data.ProjectID;
  let author = projectData[0].Data.AuthorID;
  let contact = projectData[0].Data.PublicKey;
  return {
    heading: heading,
    content: (
      <div>
        <ProjectContact author={author} contact={contact} />
        <Timeline items={blocksToTimelineEvent(projectData)} />
      </div>
    )
  };
}

function ProjectContact(props) {
  return (
    <div
      style={{
        color: "#856404",
        backgroundColor: "#fff3cd",
        padding: "0.25em 1em 0.25em 1em",
        margin: "0em 1em 2em 2em",
        textAlign: "left",
        border: "2px solid #ffeeba"
      }}
    >
      <div>
        <b>Author: </b>
        {props.author}
      </div>
      <div>
        <b>Contact: </b>
        {props.contact}
      </div>
    </div>
  );
}

function ProjectDisplay(props) {
  return (
    <div className="project-display">
      <Collapse items={props.projects} />
    </div>
  );
}

function StatusMessage(props) {
  return (
    <div class={"alert alert-" + props.class} role="alert">
      {props.value}
    </div>
  );
}

class FileSearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      searchResults: [],
      fetching: false,
      projectList: null,
      message: null
    };
  }
  // TODO: Dropzone should access files via IPC
  render() {
    return (
      <div>
        <TitleBar
          title="IP Check"
          subtitle="This is where you can do an IP verification on a file. Information will be displayed if the file exists on the blockchain"
          color="blue"
        />
        <div className="inner-container">
          <Dropzone parent={this} />
          <div className="fstart-wrapper mt-4">
            <button
              type="button"
              className="btn btn-success"
              onClick={async () => {
                let filePath = this.state.selectedFile;
                this.setState({ fetching: true });
                let projects = [];
                try {
                  projects = await ipc.invoke(
                    events.SEARCH_FILE,
                    filePath,
                    false
                  );
                } catch (e) {
                  this.setState({
                    projectList: [],
                    message: {
                      class: "danger",
                      value: "Could not connect to the server."
                    }
                  });
                }
                if (projects.length == 0) {
                  this.setState({
                    projectList: [],
                    fetching: false,
                    message: {
                      class: "warning",
                      value: "No projects were found."
                    }
                  });
                } else {
                  this.setState({
                    projectList: projects.map(Project),
                    fetching: false,
                    message: {
                      class: "success",
                      value:
                        projects.length +
                        " project(s) were found to contain the file!"
                    }
                  });
                }
              }}
              disabled={!this.state.selectedFile || this.state.fetching}
            >
              SEARCH
            </button>
            {this.state.fetching && (
              <Spinner className="ml-2" height="40px" width="40px" />
            )}
          </div>
          <div className="mt-4">
            {this.state.message && (
              <StatusMessage
                class={this.state.message.class}
                value={this.state.message.value}
              />
            )}
            {this.state.projectList && (
              <ProjectDisplay projects={this.state.projectList} />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default FileSearchPage;
