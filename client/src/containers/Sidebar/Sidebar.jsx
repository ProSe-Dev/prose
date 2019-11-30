import React from "react";
import { Link, withRouter } from "react-router-dom";
import "./Sidebar.css";
import events from "shared/ipc-events";
import Collapse from "components/FramelessCollapse";
const ipc = window.require("electron").ipcRenderer;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPage: null,
      selectedProject: null,
      isSelectingProject: false
    };
    this.handleSelectPage = this.handleSelectPage.bind(this);
  }

  handleSelectPage(pageName) {
    this.setState({ selectedPage: pageName });
  }

  render() {
    const { selectedPage, selectedProject } = this.state;

    return (
      <div class="Sidebar">
        <div className="sidebar-logo">
          <Link
            style={{ textDecoration: "none", color: "white" }}
            to="/"
            onClick={() => this.handleSelectPage("home")}
          >
            <h3>ProSe</h3>
          </Link>
        </div>

        <div class="projects">
          <Collapse
            disabled={this.props.projectList.length === 0}
            items={[
              {
                heading: "Projects",
                content: (
                  <div className="collapse-container">
                    {this.props.projectList.map((proj, ind) => (
                      <div
                        class={`sidebar-item ${
                          selectedPage === "project" &&
                          selectedProject === proj.projectID
                            ? "active"
                            : ""
                        }`}
                        key={ind}
                      >
                        <Link
                          class="sidebar-link"
                          to={`/project/${proj.projectID}`}
                          onClick={() => {
                            this.setState({
                              selectedPage: "project",
                              selectedProject: proj.projectID
                            });
                          }}
                        >
                          <span class="sidebar-text">{`>  ${proj.name}`}</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              }
            ]}
          />
        </div>

        <div>
          <button
            class="sidebar-item"
            onClick={async () => {
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
                this.props.updateProjectList();
                this.props.history.push(`/project/${project.projectID}`);
                this.handleSelectPage("add-project");
              }
              this.setState({
                isSelectingProject: false
              });
            }}
          >
            <span class="sidebar-text">&#9656;&nbsp;&nbsp;Add Project</span>
          </button>
        </div>

        <div>
          <button
            class={`sidebar-item ${
              selectedPage === "ip-check" ? "active" : ""
            }`}
            onClick={async e => {
              this.props.history.push("/file-search");
              this.handleSelectPage("ip-check");
            }}
          >
            <span class="sidebar-text">&#9656;&nbsp;&nbsp;IP Checker</span>
          </button>
        </div>

        <div>
          <button
            class={`sidebar-item ${selectedPage === "faq" ? "active" : ""}`}
            onClick={async e => {
              this.props.history.push("/faq");
              this.handleSelectPage("faq");
            }}
          >
            <span class="sidebar-text">&#9656;&nbsp;&nbsp;FAQ</span>
          </button>
        </div>
      </div>
    );
  }
}

export default withRouter(Sidebar);
