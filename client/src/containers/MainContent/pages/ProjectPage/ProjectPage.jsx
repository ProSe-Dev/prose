import React from 'react';
import './ProjectPage.css'
import TitleBar from 'components/TitleBar';
import Table from 'components/Table';
import ToggleSwitch from 'components/ToggleSwitch';

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
const FILE_TABLE_HEADERS = ['Status', 'File Name', 'Include In Snapshots', 'Actions'];
const test_rows = [
  [UpToDateStatus, 'Cover Page.pdf', <ToggleSwitch />, 'xxx'],
  [OutdatedStatus, 'Cover Page.pdf', <ToggleSwitch />, 'xxx'],
  [ExcludedStatus, 'Cover Page.pdf', <ToggleSwitch />, 'xxx'],
  [ExcludedStatus, 'Cover Page.pdf', <ToggleSwitch />, 'xxx'],
  [ExcludedStatus, 'Cover Page.pdf', <ToggleSwitch />, 'xxx']
];

class Files extends React.Component{
  render (){
    return(
      <div>
        <div className="projectpage-heading">
          Project Files
        </div>
        <Table
          headers={FILE_TABLE_HEADERS}
          rows={test_rows}
        />
      </div>
    );
  }
}

const SNAPSHOT_TABLE_HEADERS = ['#', 'Date and Time', 'Other Information', 'Actions'];
const test_snapshot_rows = [
  [1, new Date().toLocaleString(), 'xxx', 'xxx'],
  [2, new Date().toLocaleString(), 'xxx', 'xxx'],
  [3, new Date().toLocaleString(), 'xxx', 'xxx'],
  [4, new Date().toLocaleString(), 'xxx', 'xxx'],
  [5, new Date().toLocaleString(), 'xxx', 'xxx']
];

class Snapshots extends React.Component {
  render(){
    return(
      <div>
        <div className="projectpage-heading">
          Snapshots
        </div>
        <Table
          headers={SNAPSHOT_TABLE_HEADERS}
          rows={test_snapshot_rows}
          headerBGColor='#F0AD4E'
        />
      </div>
    );
  }
}

class ProjectPage extends React.Component {
  render() {
    return (
      <div class ="main-container">
        <TitleBar 
          title="hello"
          subtitle="bye"
          showSettings
        />
        <div class ="inner-container">
          <SnapshotOutdatedAlert />
          <Files />
          <Snapshots />
        </div>
      </div>
    );
  }
}

export default ProjectPage;
/** creates a html table from list of files */
function getFiles(){
  return(
    <table class="table">
        <thead>
          <tr class = "file-row-dark">
            <th scope="col">#</th>
            <th scope="col">First</th>
            <th scope="col">Last</th>
            <th scope="col">Handle</th>
          </tr>
        </thead>
        <tbody>
          <tr class="file-row-light">
            <th scope="row">1</th>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr class="file-row-light">
            <th scope="row">2</th>
            <td>Jacob</td>
            <td>Thornton</td>
            <td>@fat</td>
          </tr>
          <tr class="file-row-light">
            <th scope="row">3</th>
            <td>Larry</td>
            <td>the Bird</td>
            <td>@twitter</td>
          </tr>
        </tbody>
      </table>
  )
}
/** creates a html table from list of certificates */
function getCerts(){
  return (<table class="table">
  <thead>
    <tr class="bg-warning">
      <th scope="col">#</th>
      <th scope="col">First</th>
      <th scope="col">Last</th>
      <th scope="col">Handle</th>
    </tr>
  </thead>
  <tbody>
    <tr class="table-light">
      <th scope="row">1</th>
      <td>Mark</td>
      <td>Otto</td>
      <td>@mdo</td>
    </tr>
    <tr class="table-light">
      <th scope="row">2</th>
      <td>Jacob</td>
      <td>Thornton</td>
      <td>@fat</td>
    </tr>
    <tr class="table-light">
      <th scope="row">3</th>
      <td>Larry</td>
      <td>the Bird</td>
      <td>@twitter</td>
    </tr>
    </tbody>
  </table>)
}