import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  return (
    <div className="Sidebar">
      <div>
        <Link to="/project"> go to project</Link>
      </div>

      <div>
        <Link to="/file-search"> go to file search</Link>
      </div>

      <div>
        <Link to="/"> homepage </Link>
      </div>

    </div>
  );
}

export default Sidebar;
