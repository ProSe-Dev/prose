import React from 'react';

function ToggleSwitch(props) {
  let id = Math.random().toString().substring(2,7);
  return (
    <div className="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id={id} onChange={props.onChange}/>
      <label className="custom-control-label" htmlFor={id}></label>
    </div>
  );
}

export default ToggleSwitch;
