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
          <button type="button" class="btn btn-secondary">settings</button>
        </div>
      )}
    </div>
  );
}

export default TitleBar;