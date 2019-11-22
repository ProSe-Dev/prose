import React from 'react';
import Modal from 'components/Modal';

function SettingsModal(props) {
  return (
    <Modal
      title="Settings"
      buttonText="Save"
      onSubmit={() => props.onSave({ autoSnapshot: document.querySelector('#auto-snapshot-input').checked })}
      onClose={props.onClose}
      show={props.show}
    >
      <div>
        <span>Turn on automatic snapshot</span>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <input id="auto-snapshot-input" type="checkbox"></input>
      </div>
    </Modal>
  );
};

export default SettingsModal;
