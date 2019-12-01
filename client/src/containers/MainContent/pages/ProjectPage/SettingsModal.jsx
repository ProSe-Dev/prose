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
            autoSnapshot: document.querySelector("#auto-snapshot-input").checked
          })
      }]}
      onClose={props.onClose}
      show={props.show}
    >
      <div>
        <form>
          Project Name
          <input id="auto-snapshot-input" type="checkbox" />
          Turn on automatic snapshot
          <input id="auto-snapshot-input" type="checkbox" />
          <br />
          Time between snapshots:
          <input type="number" name="quantity" min="1" max="5" />
        </form>
      </div>
    </Modal>
  );
}

export default SettingsModal;
