import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import events from 'shared/ipc-events';
const ipc = window.require('electron').ipcRenderer;

const projectList = [
  { name:'The Art Project', projectId: '21321ko3' },
  { name:'Artwork', projectId: '21321421' },
  { name:'Corporate', projectId: '12321323' }
];

class Sidebar extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: null,
      projects: []
    };
    this.handleSelectTab = this.handleSelectTab.bind(this);
  }

  componentDidMount() {
    ipc.invoke(events.GET_EXISTING_PORJECTS)
      .then(result => {
        this.setState({ projects: result });
      });
  }

  handleSelectTab(e) {
    console.log(e.target.name);
    this.setState({ selectedTab: e.target.name });
  }

  render(){
    return(
      <div class="Sidebar">
        <div className="sidebar-logo">
          <NavLink
            className="disable-link-style"
            name="home"
            onClick={this.handleSelectTab}
            to="/"
          >
            ProSe
          </NavLink>
        </div>

        <div class="projects">
          <div className="sidebar-heading">
            Existing Projects
          </div>
          {this.state.projects.map((proj, ind) => {
            let isActive = this.state.selectedTab === proj.projectId;
            return (
              <div className={`clickable ${isActive ? 'active' : ''}`} key={ind}>
                <NavLink
                  className="btn btn-link disable-link-style fit-parent"
                  name={proj.projectId}
                  onClick={this.handleSelectTab}
                  to={`/project/${proj.projectId}`}  
                >
                  {`> ${proj.projectName}`}
                </NavLink>
              </div>
            );
          })}
        </div>

        <div className="clickable">
          <button
            type="button" className="btn btn-link disable-link-style"
            style={{ paddingLeft: '0', fontSize: '0.9em'}}
            onClick={async () => {
              console.log('button pressed');
              let result = await ipc.invoke(events.SELECT_FOLDER, 'testproject');
              console.log(result);
            }}
          >
            &nbsp;&#9656;&nbsp;&nbsp;Add New Project +
          </button>
        </div>

        <div className={`clickable ${this.state.selectedTab === 'ip-search' ? 'active' : ''}`}>
          <NavLink
            className="btn btn-link disable-link-style fit-parent"
            style={{ paddingLeft: '0', fontSize: '0.9em'}}
            onClick={this.handleSelectTab}
            name="ip-search"
            to="/file-search"
          >
            &nbsp;&#9656;&nbsp;&nbsp;IP Check
          </NavLink>
        </div>
  
      </div>
    );
  } 
}

export default Sidebar;
