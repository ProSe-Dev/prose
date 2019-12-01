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
            <h5>Performing an IP check</h5>
            <p>Find the copyright information of a file registered to ProSe.</p>
            <button
              style={{
                width: "7em"
              }}
              type="button"
              className="btn btn-outline-primary"
              onClick={() => {
                this.props.onPageChange({ name: "file-search" }, true);
              }}
            >
              IP Checker
            </button>
          </div>

          <div className="textBlock">
            <h5>Have Questions?</h5>
            <p>For more details on how to use this app, see the FAQ page!</p>
            <button
              style={{
                width: "6em"
              }}
              type="button"
              className="btn btn-outline-info"
              onClick={() => {
                this.props.onPageChange({ name: "faq" }, true);
              }}
            >
              FAQ Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(HomePage);
