import React from "react";
import { Switch, Route } from "react-router-dom";
import "./MainContent.css";
import HomePage from "./pages/HomePage/HomePage";
import ProjectPage from "./pages/ProjectPage/ProjectPage";
import FileSearchPage from "./pages/FileSearchPage/FileSearchPage";
import FAQPage from "./pages/FAQPage/FAQPage";

class MainContent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log(this.props);
    return (
      <div className="main-content">
        {/* condition loading for the main content based on the current URL
           first matching <Route> based on path will be loaded and the ones after will be ignored */}
        {/* TODO: fill these with legit pages */}
        <Switch>
          {/* route to a project page, the project that opens should be dependant on the params that's passed in */}
          <Route
            path="/project/:projectID"
            render={props => (
              <ProjectPage
                key={props.match.params.projectID}
                {...props}
                {...this.props}
              />
            )}
          />

          {/* route to page for file searching on the blockchain */}
          <Route
            path="/file-search"
            render={props => <FileSearchPage {...props} {...this.props} />}
          />

          {/* route to page for FAQ */}
          <Route
            path="/faq"
            render={props => <FAQPage {...props} {...this.props} />}
          />

          {/* load main page by default if none of the previous routes matched */}
          <Route
            path="/"
            render={props => <HomePage {...props} {...this.props} />}
          />
        </Switch>
      </div>
    );
  }
}

export default MainContent;
