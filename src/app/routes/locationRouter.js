module.exports = function(app) {
    const location = require("../controllers/locationController");
    const jwtMiddleware = require("../../../config/jwtMiddleware");

    app.use(jwtMiddleware);
    app.route("/my-address").post(location.addLocation);
};
