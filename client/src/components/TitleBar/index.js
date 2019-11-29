import React from "react";
import "./style.css";
import SettingsIcon from "@material-ui/icons/Settings";
import color from "shared/color";

function TitleBar(props) {
  return (
    <div
      className="titlebar"
      style={{
        backgroundColor:
          props.color ||
          color.COLOR_MAP[props.colorClass] ||
          color.COLOR_MAP["grey"]
      }}
    >
      <div className="titlebar-text-container">
        <div className="titlebar-title">{props.title}</div>
        <div className="titlebar-subtitle">{props.subtitle}</div>
      </div>
      {props.showSettings && (
        <div className="titlebar-settings vcenter-wrapper hleft-wrapper">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={props.onSettingsClicked}
          >
            <SettingsIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default TitleBar;
