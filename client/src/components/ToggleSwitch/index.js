import React from "react";
import "./style.css";

function ToggleSwitch(props) {
  let id = Math.random()
    .toString()
    .substring(2, 7);
  return (
    <div className="custom-control custom-switch toggle">
      <input
        type="checkbox"
        checked={props.toggled}
        class="custom-control-input"
        id={id}
        onChange={props.onChange}
      />
      <label className="custom-control-label" htmlFor={id}></label>
    </div>
  );
}

export default ToggleSwitch;
