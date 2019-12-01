import React from "react";
import { Link, withRouter } from "react-router-dom";
import "./Sidebar.css";
import events from "shared/ipc-events";
import Collapse from "components/FramelessCollapse";
const ipc = window.require("electron").ipcRenderer;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.updateProjectList();
  }

  expandProjectPanel() {
    // hack to open project panel programmatically :)
    let projectPanel = document.querySelector("#project .MuiButtonBase-root");
    projectPanel.click();
  }

  render() {
    const selectedPage = this.props.currentPage;

    return (
      <div class="Sidebar">
        <div className="sidebar-logo">
          <Link
            className="disable-link-style"
            style={{ textDecoration: "none", color: "white" }}
            name="home"
            onClick={() => this.props.onPageChange({ name: "home" })}
            to="/"
          >
            ProSe
          </Link>
        </div>

        <div id="project" class="projects">
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
                          selectedPage.name === "project" &&
                          selectedPage.projectId === proj.projectID
                            ? "active"
                            : ""
                        }`}
                        key={ind}
                      >
                        <Link
                          class="sidebar-link"
                          to={`/project/${proj.projectID}`}
                          onClick={() => {
                            this.props.onPageChange({
                              name: "project",
                              projectId: proj.projectID
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
          <button class="sidebar-item" onClick={this.props.onAddProject}>
            <span class="sidebar-text">&#9656;&nbsp;&nbsp;Add Project</span>
          </button>
        </div>

        <div>
          <button
            class={`sidebar-item ${
              selectedPage.name === "ip-check" ? "active" : ""
            }`}
            onClick={async e => {
              this.props.history.push("/file-search");
              this.props.onPageChange({ name: "ip-check" });
            }}
          >
            <span class="sidebar-text">&#9656;&nbsp;&nbsp;IP Checker</span>
          </button>
        </div>

        <div>
          <button
            class={`sidebar-item ${
              selectedPage.name === "advanced" ? "active" : ""
            }`}
            onClick={async e => {
              this.props.history.push("/advanced");
              this.props.onPageChange({ name: "advanced" });
            }}
          >
            <span class="sidebar-text">&#9656;&nbsp;&nbsp;Advanced</span>
          </button>
        </div>

        <div>
          <button
            class={`sidebar-item ${
              selectedPage.name === "faq" ? "active" : ""
            }`}
            onClick={async e => {
              this.props.history.push("/faq");
              this.props.onPageChange({ name: "faq" });
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
