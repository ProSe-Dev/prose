import React from "react";
import { Link, withRouter } from "react-router-dom";
import "./Sidebar.css";
import events from "shared/ipc-events";
import settings from "shared/settings";
import Collapse from "components/Collapse";
import color from "shared/color";
const ipc = window.require("electron").ipcRenderer;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedProject: null,
      isSelectingProject: false,
      projectList: []
    };
    // uncomment to clear projects
    /*(async () => {
      await ipc.invoke(events.SETTINGS_SET, settings.PROJECTS_LIST, []);
    })();*/
  }

  componentDidMount() {
    ipc.invoke(events.GET_EXISTING_PROJECTS).then(result => {
      this.setState({ projectList: result });
    });
  }

  render() {
    return (
      <div class="Sidebar">
        <div className="sidebar-logo">
          <Link style={{ textDecoration: "none", color: "white" }} to="/">
            <h3>ProSe</h3>
          </Link>
        </div>

        <div class="projects">
          <Collapse
            disabled={this.state.projectList.length == 0}
            items={[
              {
                heading: "Projects",
                content: (
                  <div className="collapse-container">
                    {this.state.projectList.map((proj, ind) => (
                      <div className="project-item" key={ind}>
                        <Link
                          style={{ color: "black" }}
                          to={`/project/${proj.projectID}`}
                        >
                          <h7> {`${proj.name}`} </h7>
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
                this.setState({
                  projectList: await ipc.invoke(events.GET_EXISTING_PROJECTS)
                });
                this.props.history.push(`/project/${project.projectID}`);
              }
              this.setState({
                isSelectingProject: false
              });
            }}
          >
            <h6 class="sidebar-text">Add Project</h6>
          </button>
        </div>

        <div>
          <button
            class="sidebar-item"
            onClick={async () => {
              this.props.history.push("/file-search");
            }}
          >
            <h6 class="sidebar-text">IP Checker</h6>
          </button>
        </div>

        <div>
          <button
            class="sidebar-item"
            onClick={async () => {
              this.props.history.push("/faq");
            }}
          >
            <h6 class="sidebar-text">FAQ</h6>
          </button>
        </div>
      </div>
    );
  }
}

export default withRouter(Sidebar);
