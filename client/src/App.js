import React from "react";
import Sidebar from "./containers/Sidebar/Sidebar.jsx";
import MainContent from "./containers/MainContent/MainContent.js";
import "./App.css";
import events from "shared/ipc-events";
import { withRouter } from 'react-router-dom';
import settings from "shared/settings";
const ipc = window.require("electron").ipcRenderer;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projectList: [],
      currentPage: { name: 'home' },
      isSelectingProject: false
    };
    this.updateProjectList = this.updateProjectList.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleAddProject = this.handleAddProject.bind(this);
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

  handlePageChange(page) {
    this.setState({ currentPage: page })
  }

  async handleAddProject() {
    if (this.state.isSelectingProject) {
      return;
    }
    this.setState({
      isSelectingProject: true
    });
    let folderPath = await ipc.invoke(events.SELECT_FOLDER);
    if (folderPath) {
      let basename = folderPath.split(/[\\/]/).pop();
      let project = await ipc.invoke(
        events.ADD_PROJECT,
        basename,
        folderPath,
        "dev@prose.org"
      );
      if (!project) {
        this.setState({
          isSelectingProject: false
        });
        return;
      }
      this.updateProjectList();
      this.props.history.push(`/project/${project.projectID}`);
      this.setState({
        currentPage: { name: "project", projectId: project.projectID }
      });
      // hack to open project panel programmatically :)
      let projectPanel = document.querySelector("#project .MuiButtonBase-root");
      // only expand if it's currently closed
      if (!projectPanel.classList.contains('Mui-expanded')) {
        projectPanel.click();
      }
    }
    this.setState({
      isSelectingProject: false
    });
  }

  render() {
    return (
      <div className="App">
        <Sidebar
          projectList={this.state.projectList}
          updateProjectList={this.updateProjectList}
          currentPage={this.state.currentPage}
          onPageChange={this.handlePageChange}
          onAddProject={this.handleAddProject}
        />
        <MainContent
          projectList={this.state.projectList}
          updateProjectList={this.updateProjectList}
          currentPage={this.state.currentPage}
          onPageChange={this.handlePageChange}
          onAddProject={this.handleAddProject}
        />
      </div>
    );
  }
}

export default withRouter(App);
