// these are all async events and should be called with
// ipcRender.invoke(EVENT_NAME, args[...]).then(...)
module.exports = {
  SYNC_CREATE_PROJECT_CH: "sync-create-project",
  ASYNC_CREATE_PROJECT_CH: "async-create-project",
  // event for getting existing projects
  GET_EXISTING_PORJECTS: "get-existing-projects",
  NEW_SNAPSHOT: "new-snapshot",

  // open the select folder dialog and return path to user selected directory
  // args[]
  SELECT_FOLDER: "select-folder",
  // open the select file dialog and return path to user selected file
  // args[]
  SELECT_FILE: "select-file",
  // convert a directory into prose project
  // args[<project_name>, <contact_info>, <project_path>]
  ADD_PROJECT: "add-project",
  // return info a specific project
  // args[<project_id>]
  GET_PROJECT_INFO: "get-project-info",
  // return prose existing projects added by the user
  // args[]
  GET_EXISTING_PROJECTS: "get-existing-projects",
  // return projects that contains the given file on the blockchain
  // args[<file_path>]
  SEARCH_FILE: "search-file",
  // return generated public and private keypair
  // args[]
  CREATE_KEY_PAIR: "create-keypair"
};
