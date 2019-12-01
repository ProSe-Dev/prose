import React from "react";
import Sidebar from "./containers/Sidebar/Sidebar.jsx";
import MainContent from "./containers/MainContent/MainContent.js";
import AddProjectModal from './components/AddProjectModal';
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
      showAddProjectModal: false,
      isSelectingProject: false
    };
    this.updateProjectList = this.updateProjectList.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleAddProjectSubmit = this.handleAddProjectSubmit.bind(this);
    this.toggleAddProjectModal = this.toggleAddProjectModal.bind(this);
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

  handlePageChange(page, redirect) {
    this.setState({ currentPage: page });
    if (redirect)
      this.props.history.push(`/${page.name}`);
  }

  async handleAddProjectSubmit(info) {
    let project = await ipc.invoke(
      events.ADD_PROJECT,
      info.projectName,
      info.path,
      info.contact
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
      currentPage: { name: "project", projectId: project.projectID },
      showAddProjectModal: false
    });

    // hack to open project panel programmatically :)
    let projectPanel = document.querySelector("#project .MuiButtonBase-root");
    // only expand if it's currently closed
    if (!projectPanel.classList.contains('Mui-expanded')) {
      projectPanel.click();
    }
  }
  
  async toggleAddProjectModal() {
    this.setState({ showAddProjectModal: !this.state.showAddProjectModal });
  }

  render() {
    return (
      <div className="App">
        <AddProjectModal
          show={this.state.showAddProjectModal}
          onSubmit={this.handleAddProjectSubmit}
          onClose={this.toggleAddProjectModal}
        />
        <Sidebar
          projectList={this.state.projectList}
          updateProjectList={this.updateProjectList}
          currentPage={this.state.currentPage}
          onPageChange={this.handlePageChange}
          onAddProject={this.toggleAddProjectModal}
        />
        <MainContent
          projectList={this.state.projectList}
          updateProjectList={this.updateProjectList}
          currentPage={this.state.currentPage}
          onPageChange={this.handlePageChange}
          onAddProject={this.toggleAddProjectModal}
        />
      </div>
    );
  }
}

export default withRouter(App);
