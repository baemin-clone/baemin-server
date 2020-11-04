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

    // var client_id = "dT2Rrg9dc8RWwMAUTpwr";
    // var client_secret = "SI8BiRzry5";
    // var state = "RAMDOM_STATE";
    // var redirectURI = encodeURI("http://localhost:3000/callback");
    // var api_url = "";
    // app.get("/naverlogin", function(req, res) {
    //     api_url =
    //         "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=" +
    //         client_id +
    //         "&redirect_uri=" +
    //         redirectURI +
    //         "&state=" +
    //         state;
    //     res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    //     res.end(
    //         "<a href='" +
    //             api_url +
    //             "'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>"
    //     );
    // });
    // app.get("/callback", function(req, res) {
    //     code = req.query.code;
    //     state = req.query.state;
    //     api_url =
    //         "https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=" +
    //         client_id +
    //         "&client_secret=" +
    //         client_secret +
    //         "&redirect_uri=" +
    //         redirectURI +
    //         "&code=" +
    //         code +
    //         "&state=" +
    //         state;
    //     var request = require("request");
    //     var options = {
    //         url: api_url,
    //         headers: {
    //             "X-Naver-Client-Id": client_id,
    //             "X-Naver-Client-Secret": client_secret
    //         }
    //     };
    //     request.get(options, function(error, response, body) {
    //         if (!error && response.statusCode == 200) {
    //             res.writeHead(200, {
    //                 "Content-Type": "text/json;charset=utf-8"
    //             });
    //             res.end(body);
    //         } else {
    //             res.status(response.statusCode).end();
    //             console.log("error = " + response.statusCode);
    //         }
    //     });
    // });
};
