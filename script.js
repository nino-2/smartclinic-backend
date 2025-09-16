const bcrypt = require("bcryptjs");
const hash = "$2b$10$2a84nVSvADzZmIggAVnIh.xYLTqqgwyFV.emLJjEBWo3yA/gHGfi6";
bcrypt.compare("dirtysecret1", hash, (err, res) => {
  console.log(err, res); // should print true if match
});
