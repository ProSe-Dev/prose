import React from "react";
import Modal from "components/Modal";
import ToggleSwitch from "components/ToggleSwitch";

class SettingsModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSynced: null
    };
    this.handleIsSyncedChange = this.handleIsSyncedChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.secondsToString = this.secondsToString.bind(this);
  }

  handleIsSyncedChange(e) {
    this.setState({ isSynced: e.target.checked });
  }

  async handleSubmit() {
    const { isSynced } = this.state;
    this.props.onSubmit({ isSynced });
    this.handleClose();
  }

  handleClose() {
    this.setState({
      isSynced: null
    });
    this.props.onClose();
  }

  secondsToString(seconds) {
    var levels = [
      [Math.floor(seconds / 31536000), "years"],
      [Math.floor((seconds % 31536000) / 86400), "days"],
      [Math.floor(((seconds % 31536000) % 86400) / 3600), "hours"],
      [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), "minutes"],
      [(((seconds % 31536000) % 86400) % 3600) % 60, "seconds"]
    ];
    var returntext = "";

    for (var i = 0, max = levels.length; i < max; i++) {
      if (levels[i][0] === 0) continue;
      returntext +=
        " " +
        levels[i][0] +
        " " +
        (levels[i][0] === 1
          ? levels[i][1].substr(0, levels[i][1].length - 1)
          : levels[i][1]);
    }
    return returntext.trim();
  }

  // TODO: fix time display
  render() {
    const { isSynced } = this.state;

    let saveButton = {
      text: "Save",
      style: "primary",
      onclick: this.handleSubmit
    };

    return (
      <Modal
        title="Settings"
        buttons={[saveButton]}
        onClose={this.handleClose}
        show={this.props.show}
      >
        <div>
          <form>
            <div className="form-group row mb-0">
              <label
                for="contact-info"
                className="text-right col-sm-8 col-form-label"
                style={{ fontSize: "1.2em" }}
              >
                Turn on automatic certification
              </label>
              <div className="col-sm-2 vcenter-wrapper">
                <ToggleSwitch
                  toggled={isSynced === null ? this.props.isSynced : isSynced}
                  onChange={this.handleIsSyncedChange}
                />
              </div>
            </div>
            <div className="form-group row">
              <label className="text-right col-sm-8 col-form-label">
                generated every {this.secondsToString(15)}
              </label>
            </div>
          </form>
        </div>
      </Modal>
    );
  }
}

export default SettingsModal;
