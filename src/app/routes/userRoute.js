module.exports = function(app) {
    const user = require("../controllers/userController");
    const jwtMiddleware = require("config/jwtMiddleware");

    app.route("/signup").post(user.signUp);
    app.route("/login").post(user.login);
    app.route("/duplicate-email").post(user.checkEmail);
    app.route("/naver-login").post(user.socialLogin);
    app.route("/user-info")
        .post(user.addUserInfo)
        .get(jwtMiddleware, user.getUserInfo)
        .patch(jwtMiddleware, user.modifyUserInfo);
    app.route("/signout").delete(jwtMiddleware, user.deleteUser);

    app.get("/check", jwtMiddleware, user.check);
};
