module.exports = function(app) {
    const location = require("../controllers/locationController");
    const jwtMiddleware = require("../../../config/jwtMiddleware");

    app.use(jwtMiddleware);
    app.route("/my-address")
        .post(location.addUserLocation)
        .get(location.getUserLocation);

    app.route("/my-address/:idx").delete(location.deleteUserLocation);
    app.route("/current-address").get(location.getCurrentAddress);
};