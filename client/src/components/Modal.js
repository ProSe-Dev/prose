import React from 'react';

function Modal(props) {
  let style = props.show ?
    { display: 'block', opacity: '100' } :
    { display: 'none', opacity: '0' };

  return (
    <div className="modal fade in" role="dialog" style={style}>
      <div></div>
      <div className="modal-dialog" style={{paddingTop: '100px'}}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{props.title}</h5>
            <button
              type="button"
              onClick={props.onClose}
              className="close"
            >
              &times;
            </button>
          </div>
          <div className="modal-body">
            {props.children}
          </div>
          <div className="modal-footer">
            {props.buttons && props.buttons.map(({style, onclick, text}) => (
              <button
                type="button"
                className={`btn btn-${style}`}
                onClick={onclick}
              >
                { text }
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
