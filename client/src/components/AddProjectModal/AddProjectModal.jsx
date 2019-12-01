import React from "react";
import Modal from "components/Modal";
import events from "shared/ipc-events";
const ipc = window.require("electron").ipcRenderer;

class AddProjectModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      folder: null
    };
    this.handleChooseFolder = this.handleChooseFolder.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  async handleChooseFolder() {
    let folder = await ipc.invoke(events.SELECT_FOLDER);
    if (folder) {
      let projectName = document.getElementById("project-name").value;
      if (projectName === "") {
        let folderBaseName = folder.split(/[\\/]/).pop();
        document.getElementById("project-name").value = folderBaseName;
      }
      this.setState({
        folder
      });
    }
  }

  async handleSubmit() {
    let projectName = document.getElementById("project-name").value;
    let contact = document.getElementById("contact-info").value;
    let path = this.state.folder;

    this.props.onSubmit({ projectName, contact, path });
    this.handleClose();
  }

  handleClose() {
    document.getElementById("project-name").value = "";
    document.getElementById("contact-info").value = "";
    this.setState({ folder: null });
    this.props.onClose();
  }

  render() {
    let closeButton = {
      text: "CLOSE",
      style: "outline-secondary",
      onclick: this.handleClose
    };

    let addButton = {
      text: "ADD PROJECT",
      style: "success",
      onclick: this.handleSubmit
    };

    let folderPathText = this.state.folder;
    if (!folderPathText) {
      folderPathText = "no folder chosen";
    } else {
      if (folderPathText.length > 40) {
        folderPathText =
          "..." +
          folderPathText.substring(
            folderPathText.length - 40,
            folderPathText.length
          );
      }
    }

    return (
      <Modal
        title="Add New Project"
        buttons={[closeButton, addButton]}
        onClose={this.handleClose}
        show={this.props.show}
        maxWidth="700px"
      >
        <div className="mb-5 text-right">
          <form>
            <div className="form-group row">
              <label for="project-name" className="col-sm-3 col-form-label">
                Project Name
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control"
                  id="project-name"
                  placeholder="Optional Name"
                />
              </div>
            </div>

            <div className="form-group row">
              <label for="contact-info" className="col-sm-3 col-form-label">
                Contact Info
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control"
                  id="contact-info"
                  placeholder="Optional Email, Website or Phone #"
                />
              </div>
            </div>

            <div className="form-group row">
              <label for="project-folder" className="col-sm-3 col-form-label">
                Project Folder
              </label>
              <div className="col-sm-8 text-left">
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  id="project-folder"
                  onClick={this.handleChooseFolder}
                >
                  Choose Folder
                </button>
                &nbsp;&nbsp;
                {folderPathText}
              </div>
            </div>
          </form>
        </div>
      </Modal>
    );
  }
}

export default AddProjectModal;
