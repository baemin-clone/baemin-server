module.exports = function(app) {
    const store = require("../controllers/storeController");
    const jwtMiddleware = require("config/jwtMiddleware");

    app.route("/store/:idx/info").get(jwtMiddleware, store.getStoreSummary);
};
