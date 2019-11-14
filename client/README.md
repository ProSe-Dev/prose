# Client
to run the client app: `npm start`

## Packaging for production
Running `npm run package` will create a executable of the app (in `/dist`) for the OS you're running on  

## React Web Server
To start only the react web server: `npm run react-start`

## Electron App
The Electron app is dependent on the React App that's served on *localhost:3000*, remember to run it before starting the app  
To start the Electron app: `npm run electron-start`