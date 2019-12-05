import React from "react";
import "./style.css";
import Dropzone from "components/Dropzone";
import TitleBar from "components/TitleBar";
import Collapse from "components/Collapse";
import Timeline from "components/Timeline";
import Spinner from "components/Spinner";
import events from "shared/ipc-events";
import FindInPageIcon from "@material-ui/icons/FindInPage";
import FingerprintIcon from "@material-ui/icons/Fingerprint";

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require("electron").ipcRenderer;

function blocksToTimelineEvent(blocks) {
  console.log(blocks);
  return blocks.map(b => {
    return {
      ts: b.Data.Timestamp,
      text: b.Data.CommitHash,
      highlighted: b.IsContainingBlock || false,
      highlightedText: "FOUND FILE"
    };
  });
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
    this.toProject = this.toProject.bind(this);
  }

  toProject(projectData, idx) {
    console.log(projectData);
    let projectName;
    if (projectData.IsOwnedByMe) {
      // things can get hairy if a project gets deleted
      projectMatch = this.props.projectList.find(
        p => p.projectID === projectData.ProjectID
      );
      if (projectMatch) {
        projectName = projectMatch.name;
      }
    }
    let heading = (
      <div>
        {projectData.IsOwnedByMe ? <FingerprintIcon /> : ""}
        {projectData.IsOwnedByMe ? " " : ""}
        {projectData.IsOwnedByMe ? <b>Belongs to you!</b> : ""}
        &nbsp;&nbsp;
        {projectName
          ? "Project Name: " + projectName
          : "Project ID: " + projectData.ProjectID}
      </div>
    );
    let contact = projectData.Contact;
    let author = projectData.PublicKey;
    return {
      heading: heading,
      content: (
        <div>
          <ProjectContact author={author} contact={contact} />
          <Timeline items={blocksToTimelineEvent(projectData.Data)} />
        </div>
      )
    };
  }

  // TODO: Dropzone should access files via IPC
  render() {
    return (
      <div>
        <TitleBar
          icon={<FindInPageIcon />}
          title="IP Checker"
          subtitle="Search engine for file ownership"
          colorClass="blue"
        />
        <div className="content">
          <div className="textBlock">
            <h5>Search for projects containing file</h5>
            <p>
              Use the search below to find projects that have certificates for a
              file and when they were created.
            </p>
          </div>
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
                      value: "Failed to connect to the server."
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
                    projectList: projects.map(this.toProject),
                    fetching: false,
                    message: {
                      class: "success",
                      value:
                        projects.length +
                        " project(s) were found to contain the file! See results below (sorted by earliest appearance)."
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
