import React from 'react';
import { SYNC_CREATE_PROJECT_CH } from 'shared/constants.js';
import { Link } from 'react-router-dom';
import './HomePage.css'
import logo from './prose.png'

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require('electron').ipcRenderer;
const descrip = `ProSe is your solution to all.. ... .. 
Started earnest brother believe an exposed so. Me he believing daughters if forfeited at furniture. Age again and stuff downs spoke. Late hour new nay able fat each sell. Nor themselves age introduced frequently use unsatiable devonshire get. They why quit gay cold rose deal park. One same they four did ask busy. Reserved opinions fat him nay position. Breakfast as zealously incommode do agreeable furniture. One too nay led fanny allow plate. 

Greatest properly off ham exercise all. Unsatiable invitation its possession nor off. `
const getStarted = "Get started by adding a new project.";

class HomePage extends React.Component {
  render() {
    return (
      <div class="main-container">
        <div class="display-3">Welcome to ProSe!</div>
        <p class="split left">{descrip}</p>
        <img class="split right thinking-image" src={logo} alt="thinking"></img>
        <div class ="bottom-half-container">
        <h3>{getStarted}</h3>
        <Link 
            style={{ textDecoration: 'none', color: 'white' }} 
            to="/add-project"> 
            <button 
              type="button"
              className="btn btn-success add-new-btn">
              Add New Project
            </button>
        </Link></div>
      </div>
    );
  }
};


export default HomePage;

//https://www.w3schools.com/howto/howto_css_split_screen.asp