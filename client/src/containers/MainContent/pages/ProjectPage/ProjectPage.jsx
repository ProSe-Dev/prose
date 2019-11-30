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

const excludedFiles = new Set([]);
const FILE_TABLE_HEADERS = ["Status", "File Name", "Add to Certificate"];

class Files extends React.Component {
  render() {
    return (
      <div>
        <div className="projectpage-heading">Files</div>
        {this.props.files.length > 0 ? (
          <Table headers={FILE_TABLE_HEADERS} rows={this.props.files} />
        ) : (
          <p style={{ textAlign: "left" }}>Add some files to your project!</p>
        )}
      </div>
    );
  }
}

const SNAPSHOT_TABLE_HEADERS = ["#", "Date", "Certificate ID"];

//TODO: rename to cerificate
class Snapshots extends React.Component {
  render() {
    return (
      <div>
        <div className="projectpage-heading">Certificates</div>
        {this.props.snapshots.length > 0 ? (
          <Table headers={SNAPSHOT_TABLE_HEADERS} rows={this.props.snapshots} />
        ) : (
          <p style={{ textAlign: "left" }}>
            Add some certificates to your project!
          </p>
        )}
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
    this.snapshotToRow = this.snapshotToRow.bind(this);
  }

  snapshotToRow(snapshot, idx) {
    return [
      idx + 1,
      new Date(Date.parse(snapshot.creationDate)).toLocaleString("default", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      }),
      snapshot.id
    ];
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
    let isIncluded = !(file.status === constants.GIT_EXCLUDED);
    return [
      <span className={"badge badge-pill " + statusClass}>{file.status}</span>,
      file.path,
      <ToggleSwitch
        toggled={isIncluded}
        onChange={async () => {
          console.log("toggle switched");
          if (file.status === constants.GIT_EXCLUDED) {
            console.log("removed");
            excludedFiles.delete(file.path);
          } else {
            console.log("added");
            excludedFiles.add(file.path);
          }

          let success = await ipc.invoke(
            events.PROJECT_UPDATE_EXCLUDED_FILES,
            this.state.project.projectID,
            Array.from(excludedFiles)
          );

          let updatedProject = await ipc.invoke(
            events.GET_PROJECT_INFO,
            this.state.project.projectID
          );

          // console.log('updatedProject:', updatedProject);

          if (success) {
            this.setState({
              project: updatedProject
            });
          }
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

  async handleSaveSettings(settings) {
    this.setState({
      project: await ipc.invoke(
        events.PROJECT_UPDATE_INFO,
        this.state.project.projectID,
        { isSynced: settings.autoSnapshot }
      )
    });
    console.log("automatic snapshot:", settings.autoSnapshot);
    this.toggleSettings();
  }

  // TODO: this is a hack, please fix later
  async handleSnapshot() {
    await ipc.invoke(events.PROJECT_COMMIT, this.state.project.projectID);
    this.setState({});
  }

  componentDidMount() {
    console.log("mounting");
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
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    console.log("rendering:", this.state.project);
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
              f =>
                f.status !== constants.GIT_UNCHANGED &&
                f.status !== constants.GIT_EXCLUDED
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
          <Snapshots
            snapshots={
              this.state.project
                ? this.state.project.snapshots.map(this.snapshotToRow)
                : []
            }
          />
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
