module.exports = function(app) {
    const location = require("../controllers/locationController");
    const jwtMiddleware = require("config/jwtMiddleware");

    app.route("/my-address")
        .post(jwtMiddleware, location.addUserLocation)
        .get(jwtMiddleware, location.getUserLocation);

    app.route("/my-address/:idx").delete(
        jwtMiddleware,
        location.deleteUserLocation
    );
    app.route("/current-address").get(
        jwtMiddleware,
        location.getCurrentAddress
    );
};
