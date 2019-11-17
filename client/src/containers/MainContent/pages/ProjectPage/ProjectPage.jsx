import React from 'react';
import './ProjectPage.css'

function Title(props){
  function Dot(status){
    if (status.synced)
      return (<span class="green dot"></span>)
    else
      return (<span class="red dot"></span>)
  }
  return(
    <div>
      <span>
        <span class="display-3 font-weight-bold"> {props.ProjectName} </span>
        <Dot synced = {props.CertStatus}/>
      </span>
    </div>
  )
}

class Files extends React.Component{
  render(){
    return(
      <div>
        <div class="display-4">
          Files
        </div>
        <table class="table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">First</th>
            <th scope="col">Last</th>
            <th scope="col">Handle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">1</th>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <th scope="row">2</th>
            <td>Jacob</td>
            <td>Thornton</td>
            <td>@fat</td>
          </tr>
          <tr>
            <th scope="row">3</th>
            <td>Larry</td>
            <td>the Bird</td>
            <td>@twitter</td>
          </tr>
        </tbody>
      </table>
      </div>
      
    )
  }
}

class Certificates extends React.Component {
  render(){
    return(
      <div>
        <div class="display-4">
          Certificates
        </div>
        <table class="table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">First</th>
            <th scope="col">Last</th>
            <th scope="col">Handle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">1</th>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <th scope="row">2</th>
            <td>Jacob</td>
            <td>Thornton</td>
            <td>@fat</td>
          </tr>
          <tr>
            <th scope="row">3</th>
            <td>Larry</td>
            <td>the Bird</td>
            <td>@twitter</td>
          </tr>
        </tbody>
      </table>
      </div>
      
    )
  }
}

class Summary extends React.Component {
  render(){
    return(
      <div>
        <div class="display-4">
            Summary
        </div>
        <p>{this.props.description}</p>
    </div>
    )
  }
}

class ProjectPage extends React.Component {
  render() {
    return (
      <div class ="main-container">
        <Title
          ProjectName = {"VPN"}
          CertStatus = {true}
        />
        <Summary 
          description = {"Something about this project"}
        />
        <Files
          FileList = {"temp"}
        />
        <Certificates
          CertList = {"temp"}
        />
      </div>
    );
  }
}

export default ProjectPage;