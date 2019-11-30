import React from "react";
import Sidebar from "./containers/Sidebar/Sidebar.jsx";
import MainContent from "./containers/MainContent/MainContent.js";
import "./App.css";
import events from "shared/ipc-events";
import settings from "shared/settings";
const ipc = window.require("electron").ipcRenderer;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projectList: []
    };
    this.updateProjectList = this.updateProjectList.bind(this);
  }

  componentDidMount() {
    // TODO: maybe consider moving this to another worker;
    // for our purposes now this is easier
    this.interval = setInterval(async function() {
      let projects = await ipc.invoke(events.GET_EXISTING_PROJECTS);
      projects.forEach(async p => {
        console.log("Looking at project:\n" + JSON.stringify(p));
        if (p.isSynced) {
          console.log("Commiting for " + p.path);
          await ipc.invoke(events.PROJECT_COMMIT, p.projectID);
        }
      });
    }, 10000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  updateProjectList() {
    ipc.invoke(events.GET_EXISTING_PROJECTS).then(result => {
      this.setState({ projectList: result });
    });
  }

  render() {
    return (
      <div className="App">
        <Sidebar
          projectList={this.state.projectList}
          updateProjectList={this.updateProjectList}
        />
        <MainContent
          projectList={this.state.projectList}
          updateProjectList={this.updateProjectList}
        />
      </div>
    );
  }
}

export default App;
