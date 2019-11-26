import React from 'react';
import './ProjectPage.css'
import TitleBar from 'components/TitleBar';
import Table from 'components/Table';
import ToggleSwitch from 'components/ToggleSwitch';
import SettingsModal from './SettingsModal';
import uuid from 'uuid/v4';

function SnapshotOutdatedAlert(props) {
  return (
    <div class="alert alert-warning projectpage-outdated-alert">
      <div class="vcenter-wrapper">
        Hey! Your project certificate is outdated
      </div>
      <div class="hleft-wrapper">
        <button type="button" class="btn btn-warning" onClick={props.onClick}>Renew</button>
      </div>
    </div>
  );
}

function SnapshotUptodateAlert() {
  return (
    <div class="alert alert-primary">
      Everything is up to date!
    </div>
  );
}

const UpToDateStatus = (<span className="badge badge-pill badge-success">UPTODATE</span>);
const OutdatedStatus = (<span className="badge badge-pill badge-danger">OUTDATED</span>);
const ExcludedStatus = (<span className="badge badge-pill badge-secondary">EXCLUDED</span>);
const test_file_rows = [
  [OutdatedStatus, 'Cover Page.pdf', <ToggleSwitch toggled/>],
  [OutdatedStatus, 'Canvas.png', <ToggleSwitch toggled/>],
  [OutdatedStatus, 'Canvas.raw', <ToggleSwitch toggled/>],
  [OutdatedStatus, 'Intro.doc', <ToggleSwitch toggled/>],
  [OutdatedStatus, 'Report.doc', <ToggleSwitch toggled/>]
];

/** creates a html table from list of files */
function getFiles() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(test_file_rows)
    }, 100)
  });
}


const test_snapshot_rows = [];

/** creates a html table from list of certificates */
function getSnapshots(){
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(test_snapshot_rows)
    }, 100);
  });
}

const FILE_TABLE_HEADERS = ['Status', 'File Name', 'Include In Certificate'];

class Files extends React.Component{
  render (){
    return(
      <div>
        <div className="projectpage-heading">
          Project Files
        </div>
        <Table
          headers={FILE_TABLE_HEADERS}
          rows={this.props.files}
        />
      </div>
    );
  }
}

const SNAPSHOT_TABLE_HEADERS = ['#', 'Date and Time', 'Status', 'Block ID'];

//TODO: rename to cerificate
class Snapshots extends React.Component {
  render(){
    return(
      <div>
        <div className="projectpage-heading">
        Certificate
        </div>
        <Table
          headers={SNAPSHOT_TABLE_HEADERS}
          rows={this.props.snapshots}
          headerBGColor='#F0AD4E'
        />
      </div>
    );
  }
}

class ProjectPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      snapshots: [],
      showSettings: false,
      snapshotUpdated: false
    };
    this.toggleSettings = this.toggleSettings.bind(this);
    this.handleSaveSettings = this.handleSaveSettings.bind(this);
    this.handleSnapshot = this.handleSnapshot.bind(this);
  }

  toggleSettings() {
    this.setState({ showSettings: !this.state.showSettings });
  }

  handleSaveSettings(settings) {
    console.log('automatic snapshot:', settings.autoSnapshot);
    this.toggleSettings();
  }

  // TODO: this is a hack, please fix later
  handleSnapshot() {
    setTimeout(() => {
      test_snapshot_rows.push([
        test_snapshot_rows.length + 1,
        new Date().toLocaleString(),
        <span className="badge badge-success">LIVE</span>,
        <span className="badge badge-warning">{uuid()}</span>
      ]);
      test_file_rows.forEach((row) => {
        row[0] = UpToDateStatus;
      });
      this.setState({ snapshotUpdated: true });
    }, 500);
  }

  componentDidMount() {
    return Promise
      .all([getFiles(), getSnapshots()])
      .then(results => {
        this.setState({
          files: results[0],
          snapshots: results[1]
        })
      });
  }

  render() {
    return (
      <div class ="main-container">
        <TitleBar 
          title="The Art Project"
          subtitle="Created on Nov 11, 2019"
          showSettings
          onSettingsClicked={this.toggleSettings}
        />
        <div class ="inner-container">
          { this.state.snapshotUpdated ? <SnapshotUptodateAlert /> : <SnapshotOutdatedAlert onClick={this.handleSnapshot}/> }
          
          <Files
            files={this.state.files}
          />
          <Snapshots
            snapshots={this.state.snapshots}
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

export default ProjectPage;
