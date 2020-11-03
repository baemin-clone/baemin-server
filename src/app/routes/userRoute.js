module.exports = function(app) {
    const user = require("../controllers/userController");
    const jwtMiddleware = require("../../../config/jwtMiddleware");

    app.route("/signup").post(user.signUp);
    app.route("/login").post(user.login);
    app.route("/duplicate-email").post(user.checkEmail);
    app.route("/naver-login").post(user.socialLogin);
    app.route("/user-info").put(user.addUserInfo);
    app.get("/check", jwtMiddleware, user.check);
};
