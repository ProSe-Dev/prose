import React from 'react';
import { Switch, Route } from "react-router-dom";
import './MainContent.css';

function MainContent() {
  return (
    <div className="main-content">
      { /* condition loading for the main content based on the current URL
           first matching <Route> based on path will be loaded and the ones after will be ignored */}
      { /* TODO: fill these with legit pages */}
      <Switch>

        { /* route to a project page, the project that opens should be dependant on the params that's passed in */ }
        <Route path="/project">
          <div>
            this is the project page
          </div>
        </Route>

        { /* route to page for file searching on the blockchain */ }
        <Route path="/file-search">
          <div>
            this is the file searching page
          </div>
        </Route>

        { /* load main page by default if none of the previous routes matched */ }
        <Route path="/">
          <div>
            this is the home page :)
          </div>
        </Route>
      </Switch>
    </div>
  );
}

export default MainContent;
