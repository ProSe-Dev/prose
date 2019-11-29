import React from "react";
import TitleBar from "components/TitleBar";
import "./style.css";

class FAQPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div>
        <TitleBar title="FAQ" subtitle="" colorClass="green" />
        <div className="content">
          <h5 className="question">How can I prove ownership of my work?</h5>
          <p className="answer">
            You can prove ownership of your work by performing the following
            steps:
          </p>
          <h5 className="question">How can I prove ownership of my work?</h5>
          <p className="answer">
            You can prove ownership of your work by performing the following
            steps:
          </p>
          <h5 className="question">How can I prove ownership of my work?</h5>
          <p className="answer">
            You can prove ownership of your work by performing the following
            steps:
          </p>
          <h5 className="question">How can I prove ownership of my work?</h5>
          <p className="answer">
            You can prove ownership of your work by performing the following
            steps:
          </p>
        </div>
      </div>
    );
  }
}

export default FAQPage;
