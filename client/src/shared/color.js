module.exports = {
  COLOR_MAP: {
    grey: "#979797",
    blue: "#5a8fda",
    green: "#5bb85d",
    red: "#dc6878",
    orange: "#efad4d"
  },
  randomColorClass: function() {
    var keys = Object.keys(this.COLOR_MAP);
    return keys[(((keys.length - 1) * Math.random()) << 0) + 1];
  }
};
