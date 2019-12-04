const { platform } = require('os');
const appRoot = process.env.PWD;
const inDevelopment = process.env.NODE_ENV === 'develpoment';
const inDemo = process.env.NODE_ENV === 'demo';
const inProduction = !process.env.NODE_ENV;

function getPlatform() {
  switch (platform()) {
    case 'aix':
    case 'freebsd':
    case 'linux':
    case 'openbsd':
    case 'android':
      return 'linux';
    case 'darwin':
    case 'sunos':
      return 'mac';
    case 'win32':
      return 'win';
    default:
      return null;
  }
}

module.exports = {
  inDevelopment,
  inDemo,
  inProduction,
  appRoot,
  getPlatform
};
