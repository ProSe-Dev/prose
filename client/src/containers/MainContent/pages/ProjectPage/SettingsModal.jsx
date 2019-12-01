import React from "react";
import Modal from "components/Modal";

function SettingsModal(props) {
  return (
    <Modal
      title="Settings"
      buttons={[{
        style:'primary',
        text: 'Save',
        onclick: () =>
          props.onSave({
            autoSnapshot: document.querySelector("#auto-certification-input").checked
          })
      }]}
      onClose={props.onClose}
      show={props.show}
    >
      <div>
        <form>
          <div className="form-group row mb-0">
            <label
              for="contact-info"
              className="text-right col-sm-8 col-form-label"
              style={{ fontSize: '1.2em' }}
            >
              Turn on automatic certification
            </label>
            <div className="col-sm-2 vcenter-wrapper">
              <input 
                type="checkbox"
                className="form-control" 
                id="auto-certification-input"
                style={{
                  width: '1em',
                  height: '1em'
                }}
              />
            </div>
          </div>
          <div className="form-group row">
            <label className="text-right col-sm-8 col-form-label">
              generated every 5 minutes
            </label>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default SettingsModal;
