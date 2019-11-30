import React from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import MuiExpansionPanel from "@material-ui/core/ExpansionPanel";
import MuiExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import MuiExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import MuiTypography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%"
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular
  }
}));

const ExpansionPanel = withStyles({
  root: {
    backgroundColor: 'rgba(0, 0, 0, 0) !important',
    boxShadow: 'none !important',
  }
})(MuiExpansionPanel);

const ExpansionPanelSummary = withStyles({
  root: {
    backgroundColor: "rgba(0, 0, 0, 0)",
    marginBottom: -1,
    minHeight: 56,
    "&$expanded": {
      minHeight: 56
    },
    paddingLeft: '0'
  },
  content: {
    "&$expanded": {
      margin: "12px 0"
    }
  },
  expanded: {}
})(MuiExpansionPanelSummary);

const ExpansionPanelDetails = withStyles({
  root: {
    padding: "0"
  },
  content: {
    width: '100%'
  }
})(MuiExpansionPanelDetails);

const Typography = withStyles({
  root: {
    padding: "0",
    width: '100%'
  },
})(MuiTypography);

function Collapse(props) {
  const classes = makeStyles(theme => ({
    root: {
      width: "100%",
    },
    heading: {
      color: props.color ? props.color : 'white !important',
      fontSize: theme.typography.pxToRem(props.fontSize ? props.fontSize : 20),
      fontWeight: theme.typography.fontWeightRegular
    }
  }))();

  return (
    <div className={classes.root}>
      {props.items &&
        props.items.map(item => (
          <ExpansionPanel disabled={props.disabled}>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography className={classes.heading}>
                {item.heading}
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <Typography>{item.content}</Typography>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        ))}
    </div>
  );
}

export default Collapse;
