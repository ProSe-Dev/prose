import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

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
          <Link 
            style={{ textDecoration: 'none', color: 'white' }} 
            to="/file-search"> Add New Project</Link>
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
    return (<Link 
      style={{ textDecoration: 'none', color: 'white' }} 
    to="/project"> > {project_name}</Link>)
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
