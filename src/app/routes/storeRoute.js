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
    app.route("/menu-list/:idx/options").get(
        jwtMiddleware,
        store.getMenuOptions
    );

    app.route("/store/:storeIdx/info-details").get(
        jwtMiddleware,
        store.getStoreDetails
    );

    app.route("/brand").get(store.getBrand);
    app.route("/recommend").get(store.getFilteredStore);

    app.route("/store-title/:storeIdx").get(jwtMiddleware, store.getStoreTitle);

    app.route("/basket/menu-info").get(jwtMiddleware, store.getBasketMenu);
};
