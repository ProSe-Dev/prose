import React from 'react';
import { Link } from 'react-router-dom';
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
      selectedProject: null,
      projects: []
    };
  }

  componentDidMount() {
    ipc.invoke(events.GET_EXISTING_PORJECTS)
      .then(result => {
        this.setState({ projects: result });
      });
  }

  render(){
    return(
      <div class="Sidebar">
        <div className="sidebar-logo">
          <Link 
            style={{ textDecoration: 'none', color: 'white' }} 
            to="/"
          >
            <h3 style={{marginLeft: '5px'}}>ProSe</h3>
          </Link>
        </div>

        <div class="projects">
          <h5 style={{
            color: 'lightgray',
            marginLeft: '5px',
          }}>
            Existing Projects
          </h5>
          {this.state.projects.map((proj, ind) => (
            <div className="project-item" key={ind}>
              <Link
                className="project-item-link"
                to={`/project/${proj.projectId}`}  
              >
                <h6> {`> ${proj.projectName}`} </h6>
              </Link>
            </div>
          ))}
        </div>

        <div>
        <button
        style={{
          color: 'lightgray',
          marginLeft: '5px'
        }}
          class="side-add-project"
          onClick={async () => {
            console.log('button pressed');
            let result = await ipc.invoke(events.SELECT_FOLDER, 'testproject');
            console.log(result);
          }}
        ><h6>Add New Project + </h6></button>
        </div>

        <div>
          <Link 
            style={{ textDecoration: 'none', color: 'lightgray' }} 
            to="/file-search"> <h6 style={{
              marginLeft: '5px',
            }}>IP Check</h6></Link>
        </div>
  
      </div>
    );
  } 
}

export default Sidebar;
