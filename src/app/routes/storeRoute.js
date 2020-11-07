module.exports = function(app) {
    const store = require("../controllers/storeController");
    const jwtMiddleware = require("config/jwtMiddleware");

    app.route("/store/:idx/info").get(jwtMiddleware, store.getStoreSummary);
    app.route("/store/:idx/delivery-info").get(
        jwtMiddleware,
        store.getStoreDeliveryInfo
    );
    app.route("/store/:idx/take-out").get(
        jwtMiddleware,
        store.getStoreTakeOutInfo
    );

    app.route("/store").get(jwtMiddleware, store.getStoreList);

    app.route("/store/:idx/menu-list").get(jwtMiddleware, store.getMenuList);
};
