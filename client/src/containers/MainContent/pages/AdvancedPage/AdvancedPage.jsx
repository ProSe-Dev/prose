import React from "react";
import TitleBar from "components/TitleBar";
import "./style.css";
import events from "shared/ipc-events";
import settings from "shared/settings";
import BuildIcon from "@material-ui/icons/Build";

// workaround for served react app to get access to electron module
// reference: https://github.com/electron/electron/issues/7300
const ipc = window.require("electron").ipcRenderer;

class AdvancedPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      publicKey: null,
      relayHostAddress: ""
    };
  }

  componentDidMount() {
    ipc
      .invoke(
        events.SETTINGS_GET,
        settings.NAMESPACES.APP,
        settings.KEYS.MASTER_KEYS
      )
      .then(result => {
        this.setState({
          publicKey: result.publicKey
        });
      });
    ipc
      .invoke(
        events.SETTINGS_GET,
        settings.NAMESPACES.APP,
        settings.KEYS.RELAY_HOST_ADDRESS,
        settings.DEFAULTS.RELAY_HOST_ADDRESS
      )
      .then(result => {
        this.setState({
          relayHostAddress: result
        });
      });
  }

  render() {
    return (
      <div>
        <TitleBar
          icon={<BuildIcon />}
          title="Advanced"
          subtitle="View and manage additional technical details"
          colorClass="red"
        />
        <div className="mainContent">
          <div className="textBlock">
            <h5>Public Identity (ED25519)</h5>
            <blockquote class="blockquote">{this.state.publicKey}</blockquote>
          </div>
          <div className="textBlock">
            <h5>Blockchain Relay Host</h5>
            <form
              onSubmit={async () => {
                let relayHostAddress = document.getElementById(
                  "relayHostAddress"
                ).value;
                this.setState({
                  relayHostAddress: relayHostAddress
                });
                await ipc.invoke(
                  events.SETTINGS_SET,
                  settings.NAMESPACES.APP,
                  settings.KEYS.RELAY_HOST_ADDRESS,
                  relayHostAddress
                );
              }}
            >
              <div class="form-group">
                <input
                  class="form-control"
                  id="relayHostAddress"
                  defaultValue={this.state.relayHostAddress}
                />
              </div>
              <button type="submit" class="btn btn-primary">
                Update
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default AdvancedPage;
