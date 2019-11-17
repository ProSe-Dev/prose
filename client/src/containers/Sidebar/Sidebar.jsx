import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import { SYNC_CREATE_PROJECT_CH } from 'shared/constants.js';
const ipc = window.require('electron').ipcRenderer;

class Sidebar extends React.Component{
  render(){
    const projectList = createProjectList("x");
    return(
      <div class="Sidebar">
        <h3>ProSe</h3>
        <div class="projects">
          <p class ="side-titles">Existing Projects</p>
          {projectList}
        </div>

        <div>
        <button 
          class="side-add-project"
          onClick={() => {
            console.log('button pressed');
            let result = ipc.sendSync(SYNC_CREATE_PROJECT_CH, 'testproject');
            console.log(result);
          }}
        >Add New Project </button>
      
        </div>

        <div>
          <Link 
            style={{ textDecoration: 'none', color: 'white' }} 
            to="/file-search"> IP Check</Link>
        </div>
  
        <div>
          <Link 
            style={{ textDecoration: 'none', color: 'white' }} 
            to="/"> homepage </Link>
        </div>
  
      </div>
    );
  } 
}

export default Sidebar;

function createProjectList(something){
  function getProject(project_name){
    return (<div><Link 
      style={{ textDecoration: 'none', color: 'white' }} 
    to="/project"> > {project_name}</Link></div>
    );
  }

  var example_list = [{
    name: "VPN"
  },
  {
    name: "fake project 2"
  },
  {
    name: "fake project 3"
  }
];

  var projectsList = example_list.map((project)=>getProject(project.name));
  return projectsList;
}
