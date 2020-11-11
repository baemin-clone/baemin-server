module.exports = function(app) {
    const order = require("../controllers/orderController");
    const jwtMiddleware = require("config/jwtMiddleware");
    app.route("/order").post(jwtMiddleware, order.order);
    app.route("/history").get(jwtMiddleware, order.getHistory);
};
