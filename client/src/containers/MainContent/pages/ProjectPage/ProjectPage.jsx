import React from 'react';
import './ProjectPage.css'
import TitleBar from 'components/TitleBar';
import Table from 'components/Table';
import ToggleSwitch from 'components/ToggleSwitch';
import SettingsModal from './SettingsModal';
import { throwStatement } from '@babel/types';

function SnapshotOutdatedAlert() {
  return (
    <div class="alert alert-warning projectpage-outdated-alert">
      <div class="vcenter-wrapper">
        Hey! Your project snapshot is outdated
      </div>
      <div class="hleft-wrapper">
        <button type="button" class="btn btn-warning">Renew</button>
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

const UpToDateStatus = (<span className="badge badge-pill badge-success">uptodate</span>);
const OutdatedStatus = (<span className="badge badge-pill badge-danger">outdated</span>);
const ExcludedStatus = (<span className="badge badge-pill badge-secondary">excluded</span>);
const test_rows = [
  [UpToDateStatus, 'Cover Page.pdf', <ToggleSwitch toggled={true} />, '@ZTfer'],
  [OutdatedStatus, 'Canvas.png', <ToggleSwitch toggled={true} />, '@fat'],
  [ExcludedStatus, 'Canvas.raw', <ToggleSwitch />, '@weibo'],
  [ExcludedStatus, 'random.txt', <ToggleSwitch />, '@weibo'],
  [ExcludedStatus, 'scrape.txt', <ToggleSwitch />, '@weibo']
];

/** creates a html table from list of files */
function getFiles() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(test_rows)
    }, 2000)
  });
}


const test_snapshot_rows = [
  [1, new Date().toLocaleString(), 'xxx', 'xxx'],
  [2, new Date().toLocaleString(), 'xxx', 'xxx'],
  [3, new Date().toLocaleString(), 'xxx', 'xxx'],
  [4, new Date().toLocaleString(), 'xxx', 'xxx'],
  [5, new Date().toLocaleString(), 'xxx', 'xxx']
];
/** creates a html table from list of certificates */
function getSnapshots(){
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(test_snapshot_rows)
    }, 2000);
  });
}

const FILE_TABLE_HEADERS = ['Status', 'File Name', 'Include In Snapshots', 'Actions'];

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

const SNAPSHOT_TABLE_HEADERS = ['#', 'Date and Time', 'Other Information', 'Actions'];

class Snapshots extends React.Component {
  render(){
    return(
      <div>
        <div className="projectpage-heading">
          Snapshots
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
      showSettings: false
    };
    this.toggleSettings = this.toggleSettings.bind(this);
    this.handleSaveSettings = this.handleSaveSettings.bind(this);
  }

  toggleSettings() {
    this.setState({ showSettings: !this.state.showSettings });
  }

  handleSaveSettings(settings) {
    console.log('automatic snapshot:', settings.autoSnapshot)
    this.toggleSettings();
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
          <SnapshotOutdatedAlert />
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
