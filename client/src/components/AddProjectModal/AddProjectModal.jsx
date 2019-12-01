import React from "react";
import Modal from "components/Modal";
import events from "shared/ipc-events";
const ipc = window.require("electron").ipcRenderer;

class AddProjectModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      folderPath: null,
      projectName: null,
      contract: null
    };
    this.handleChooseFolder = this.handleChooseFolder.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleProjectNameChange = this.handleProjectNameChange.bind(this);
    this.handleContactChange = this.handleContactChange.bind(this);
  }

  async handleChooseFolder() {
    let folderPath = await ipc.invoke(events.SELECT_FOLDER);
    if (folderPath) {
      this.setState({ folderPath });
    }
  }

  handleProjectNameChange(e) {
    this.setState({ projectName: e.target.value });
  }

  handleContactChange(e) {
    this.setState({ contact: e.target.value });
  }


  async handleSubmit() {
    const { projectName, contact, folderPath } = this.state;
    let canSubmit = projectName && contact && folderPath;

    if (canSubmit) {
      this.props.onSubmit({ projectName, contact, path: folderPath });
      this.handleClose();
    }
  }

  handleClose() {
    this.setState({
      projectName: null,
      contact: null,
      folderPath: null
    });
    this.props.onClose();
  }

  render() {
    const { projectName, contact, folderPath } = this.state;

    let canSubmit = projectName && contact && folderPath;

    let closeButton = {
      text: 'CLOSE',
      style: 'outline-secondary',
      onclick: this.handleClose
    };
  
    let addButton = {
      text: 'ADD PROJECT',
      style: 'success',
      onclick: this.handleSubmit,
      disabled: !canSubmit
    };

    let folderPathText = this.state.folderPath;
    if (!folderPathText) {
      folderPathText = "No folder selected";
    } else {
      if (folderPathText.length > 30) {
        folderPathText = '...' + folderPathText.substring(folderPathText.length - 30, folderPathText.length);
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
                  value={projectName || ''} 
                  className="form-control" 
                  id="project-name" 
                  onChange={this.handleProjectNameChange} 
                  placeholder="Name"
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
                  value={contact || ''} 
                  className="form-control" 
                  id="contact-info" 
                  onChange={this.handleContactChange} 
                  placeholder="Email / Website / Phone #"
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
