import React from "react";
import "./style.css";
import SettingsIcon from "@material-ui/icons/Settings";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
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
        {props.icon ? (
          <div className="titlebar-title" style={{ display: 'grid', gridTemplateColumns: '0.30fr 12fr' }}>
            <div className="vcenter-wrapper">{props.icon}</div>
            <span>{props.title}</span>
          </div>
        ) : (
          <div className="titlebar-title">{props.title}</div>
        )}
        <div className="titlebar-subtitle">{props.subtitle}</div>
      </div>
      <div className="titlebar-settings vcenter-wrapper hleft-wrapper">
        {props.showSettings && (
          <button
            type="button"
            className="btn btn-secondary option-btn"
            onClick={props.onSettingsClicked}
          >
            <SettingsIcon />
          </button>
        )}
        {props.showDelete && (
          <button
            type="button"
            className="btn btn-secondary option-btn"
            onClick={props.onDeleteClicked}
          >
            <DeleteForeverIcon />
          </button>
        )}
      </div>
    </div>
  );
}

export default TitleBar;
