module.exports = function(app) {
    const menu = require("../controllers/orderController");
    const jwtMiddleware = require("config/jwtMiddleware");
    app.route("/order").post(jwtMiddleware, menu.order);
};
