import React from "react";
import { withRouter } from "react-router";
import "./style.css";
import TitleBar from "components/TitleBar";
import HomeIcon from "@material-ui/icons/Home";

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div>
        <TitleBar
          icon={<HomeIcon />}
          title="Home"
          subtitle="Welcome to ProSe!"
          colorClass="orange"
        />
        <div className="mainContent">
          <div className="textBlock">
            <h5>Getting Started</h5>
            <p>
              To start using ProSe, add a new or existing project for tracking.
            </p>
            <button
              style={{
                width: 300
              }}
              type="button"
              className="btn btn-success"
              onClick={this.props.onAddProject}
            >
              ADD NEW PROJECT
            </button>
          </div>
          <div className="textBlock">
            <h5>Documentation</h5>
            <p>For more details on how to use this app, see the FAQ page!</p>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(HomePage);
