import React from 'react';
import './style.css';

const BACKGROUND_COLOR_MAP = {
  'GREY': '#979797'
};

function TitleBar (props) {
  return (
    <div 
      className="titlebar"
      style={{backgroundColor: BACKGROUND_COLOR_MAP['GREY']}}
    >
      <div className="titlebar-text-container">
        <div className="titlebar-title">{props.title}</div>
        <div className="titlebar-subtitle">{props.subtitle}</div>
      </div>
      {props.showSettings && (
        <div className="titlebar-settings vcenter-wrapper hleft-wrapper">
          <button type="button" className="btn btn-secondary" onClick={props.onSettingsClicked}>settings</button>
        </div>
      )}
    </div>
  );
}

export default TitleBar;