module.exports = function(app) {
    const user = require("../controllers/userController");
    const jwtMiddleware = require("../../../config/jwtMiddleware");

    app.route("/signup").post(user.signUp);
    app.route("/login").post(user.login);
    app.route("/duplicate-email").post(user.checkEmail);
    app.route("/naver-login").post(user.socialLogin);

    app.get("/check", jwtMiddleware, user.check);

    /** client test code  */
};
