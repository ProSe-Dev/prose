import React from "react";
import TitleBar from "components/TitleBar";
import "./style.css";
import LiveHelpIcon from "@material-ui/icons/LiveHelp";

class FAQPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div>
        <TitleBar
          icon={<LiveHelpIcon />}
          title="FAQ"
          subtitle="Answers to common questions"
          colorClass="green"
        />
        <div className="content">
          <div className="qaBlock">
            <h5>What can I do with ProSe?</h5>
            <p>
              ProSe provides proof of ownership for any files you have present
              on your computer. It also provides ownership lookup for any file
              that may be present on the blockchain.
            </p>
          </div>
          <div className="qaBlock">
            <h5>How can I use ProSe to prove ownership of my work?</h5>
            <p>
              You can protect your work by adding a project to ProSe and
              selecting the specific file(s) you would like to keep certified as
              yours. ProSe will make an initial certification to the shared
              blockchain, and you can subsequently renew your certification by
              clicking "Renew" in the project page.
            </p>
          </div>
          <div className="qaBlock">
            <h5>How does ProSe provide proof of ownership?</h5>
            <p>
              ProSe makes a unique hash of the files you would like to claim
              ownership to and attaches a public but anonymous identifier of you
              together that is commited to the blockchain. we also call this a
              certificate.
            </p>
          </div>
          <div className="qaBlock">
            <h5>What is a blockchain?</h5>
            <p>
              A blockchain acts as a decentralized, immutable storage where we
              will store your file ownership proof. Anyone with access to the
              blockchain will only see anonymized data.
            </p>
          </div>
          <div className="qaBlock">
            <h5>How can I find a file's owner?</h5>
            <p>
              The IP Check page allows you to lookup a specific file on the
              blockchain. If a file is found, you can view whatever ownership
              information the author publicized.
            </p>
          </div>
          <div className="qaBlock">
            <h5>How safe is it to use ProSe?</h5>
            <p>
              ProSe only sends encrypted hashes of your files, not the file
              itself, to the public blockchain. We also do not send any
              personally identifying information, as we use public key
              verification for owner identification. The only public data shared
              with the world is what you put as the metadata.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default FAQPage;
