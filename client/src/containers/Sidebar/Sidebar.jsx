import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import { SYNC_CREATE_PROJECT_CH } from 'shared/constants.js';
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
    };
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
          {projectList.map((proj, ind) => (
            <div className="project-item" key={ind}>
              <Link
                className="project-item-link"
                to={`/project/${proj.projectId}`}  
              >
                <h7> {`> ${proj.name}`} </h7>
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
          onClick={() => {
            console.log('button pressed');
            let result = ipc.sendSync(SYNC_CREATE_PROJECT_CH, 'testproject');
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

function createProjectList(something){
  function getProject(project_name){
    return (<Link 
      style={{ textDecoration: 'none', color: 'lightgray'}} 
    to="/project"><h7 style={{
      marginLeft: '15px',
    }}>{"> " + project_name}</h7><br/></Link>)
  }
  var example_list = [{
    name: "CPEN 442"
  },
  {
    name: "Artwork"
  },
  {
    name: "Corporate"
  }
];

  var projectsList = example_list.map((project)=>getProject(project.name));
  return projectsList;
}
