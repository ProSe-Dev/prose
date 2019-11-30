import React from "react";
import Sidebar from "./containers/Sidebar/Sidebar.jsx";
import MainContent from "./containers/MainContent/MainContent.js";
import "./App.css";
import events from "shared/ipc-events";
const ipc = window.require("electron").ipcRenderer;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projectList: []
    };
    this.updateProjectList = this.updateProjectList.bind(this);
    // uncomment to clear projects
    /*(async () => {
      await ipc.invoke(events.SETTINGS_SET, settings.PROJECTS_LIST, []);
    })();*/
  }

  componentDidMount() {
    this.updateProjectList();
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
