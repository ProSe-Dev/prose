import React from "react";
import "./ProjectPage.css";
import TitleBar from "components/TitleBar";
import Table from "components/Table";
import ToggleSwitch from "components/ToggleSwitch";
import SettingsModal from "./SettingsModal";
import uuid from "uuid/v4";
import events from "shared/ipc-events";
import constants from "shared/constants";
import settings from "shared/settings";
import Icon from "@material-ui/core/Icon";
import { withRouter } from "react-router-dom";
import { stat } from "fs";
const ipc = window.require("electron").ipcRenderer;

function SnapshotOutdatedAlert(props) {
  return (
    <div class="alert alert-warning projectpage-outdated-alert">
      <div class="vcenter-wrapper">
        Hey! Your project certificate is outdated
      </div>
      <div class="hleft-wrapper">
        <button type="button" class="btn btn-warning" onClick={props.onClick}>
          Renew
        </button>
      </div>
    </div>
  );
}

function SnapshotUptodateAlert() {
  return <div class="alert alert-primary">Everything is up to date!</div>;
}

const test_snapshot_rows = [];
const excludedFiles = new Set([]);

/** creates a html table from list of certificates */
function getSnapshots() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(test_snapshot_rows);
    }, 100);
  });
}

const FILE_TABLE_HEADERS = ["Status", "File Name", "Add to Certificate"];

class Files extends React.Component {
  render() {
    return (
      <div>
        <div className="projectpage-heading">Project Files</div>
        <Table headers={FILE_TABLE_HEADERS} rows={this.props.files} />
      </div>
    );
  }
}

const SNAPSHOT_TABLE_HEADERS = ["#", "Date and Time", "Status", "Block ID"];

//TODO: rename to cerificate
class Snapshots extends React.Component {
  render() {
    return (
      <div>
        <div className="projectpage-heading">Certificate</div>
      </div>
    );
  }
}

class ProjectPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      snapshots: [],
      showSettings: false,
      snapshotUpdated: false,
      project: null
    };
    this.toggleSettings = this.toggleSettings.bind(this);
    this.handleSaveSettings = this.handleSaveSettings.bind(this);
    this.handleSnapshot = this.handleSnapshot.bind(this);
    this.deleteProject = this.deleteProject.bind(this);
    this.fileToRow = this.fileToRow.bind(this);
  }

  fileToRow(file) {
    let statusClass;
    if (file.status === constants.GIT_UNCHANGED) {
      statusClass = "badge-success";
    } else if (
      file.status === constants.GIT_CHANGED ||
      file.status === constants.GIT_REMOVED ||
      file.status === constants.GIT_NEW
    ) {
      statusClass = "badge-danger";
    } else if (file.status === constants.GIT_EXCLUDED) {
      // TODO: not actually related to git
      statusClass = "badge-secondary";
    } else {
      throw new Error("Unexpected status: " + file.status);
    }
    console.log("OOF");
    return [
      <span className={"badge badge-pill " + statusClass}>{file.status}</span>,
      file.path,
      <ToggleSwitch
        toggled={
          excludedFiles.has(file) || !(file.status === constants.GIT_EXCLUDED)
        }
        onChange={async () => {
          if (file.status === constants.GIT_EXCLUDED) {
            excludedFiles.delete(file.path);
          } else {
            excludedFiles.add(file.path);
          }
          this.setState({
            project: this.state.project
          });
          await ipc.invoke(
            events.PROJECT_UPDATE_EXCLUDED_FILES,
            this.state.project.projectID,
            Array.from(excludedFiles)
          );
        }}
      />
    ];
  }

  deleteProject() {
    ipc
      .invoke(events.PROJECT_DELETE, this.state.project.projectID)
      .then(res => {
        if (res) this.props.updateProjectList();
        this.props.history.push("/");
      });
  }

  toggleSettings() {
    this.setState({ showSettings: !this.state.showSettings });
  }

  handleSaveSettings(settings) {
    console.log("automatic snapshot:", settings.autoSnapshot);
    this.toggleSettings();
  }

  // TODO: this is a hack, please fix later
  async handleSnapshot() {
    await ipc.invoke(events.PROJECT_COMMIT, this.state.project.projectID);
  }

  componentDidMount() {
    (async () => {
      const { projectID } = this.props.match.params;
      console.log(projectID);
      this.setState({
        project: await ipc.invoke(events.GET_PROJECT_INFO, projectID)
      });
      console.log(this.state.project);
      this.interval = setInterval(
        async () =>
          this.setState({
            project: await ipc.invoke(
              events.PROJECT_UPDATE_FILES,
              this.state.project.projectID
            )
          }),
        5000
      );
    })();
    return Promise.all([getSnapshots()]).then(results => {
      this.setState({
        snapshots: results[1]
      });
    });
  }

  render() {
    return (
      <div class="main-container">
        <TitleBar
          colorClass={this.state.project ? this.state.project.colorClass : null}
          title={this.state.project ? this.state.project.name : "Loading..."}
          subtitle={
            this.state.project
              ? "Created on " +
                new Date(
                  Date.parse(this.state.project.creationDate)
                ).toLocaleString("default", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })
              : ""
          }
          showSettings
          onSettingsClicked={this.toggleSettings}
          showDelete
          onDeleteClicked={this.deleteProject}
        />
        <div class="inner-container">
          {this.state.project ? (
            !this.state.project.files.some(
              f => f.status !== constants.GIT_UNCHANGED && f.excluded === false
            ) ? (
              <SnapshotUptodateAlert />
            ) : (
              <SnapshotOutdatedAlert onClick={this.handleSnapshot} />
            )
          ) : (
            <div />
          )}

          <Files
            files={
              this.state.project
                ? this.state.project.files.map(this.fileToRow)
                : []
            }
          />
          <Snapshots snapshots={this.state.snapshots} />
        </div>
        <SettingsModal
          onClose={this.toggleSettings}
          onSave={this.handleSaveSettings}
          show={this.state.showSettings}
        />
      </div>
    );
  }
}

export default withRouter(ProjectPage);
