import React from 'react';
import Sidebar from './containers/Sidebar/Sidebar.jsx';
import MainContent from './containers/MainContent/MainContent.js';
import './App.css';

function App() {
  return (
    <div className="App">
      <Sidebar />
      <MainContent />
    </div>
  );
}

export default App;
