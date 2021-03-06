const jwt = require("jsonwebtoken");
const secret_config = require("./secret");
const jwtMiddleware = (req, res, next) => {
    // read the token from header or url
    const token = req.headers["x-access-token"] || req.query.token;
    // token does not exist
    if (!token) {
        return res.json({
            isSuccess: false,
            code: 403,
            message: "token이 존재하지 않습니다."
        });
    }

    // create a promise that decodes the token
    const p = new Promise((resolve, reject) => {
        jwt.verify(token, secret_config.jwtsecret, (err, verifiedToken) => {
            if (err) reject(err);
            resolve(verifiedToken);
        });
    });

    // if it has failed to verify, it will return an error message
    const onError = error => {
        res.json({
            isSuccess: false,
            code: 403,
            message: "유효하지않은 jwt입니다."
        });
    };

    // process the promise
    p.then(verifiedToken => {
        //비밀 번호 바꼇을 때 검증 부분 추가 할 곳
        req.verifiedToken = verifiedToken;
        next();
    }).catch(onError);
};

module.exports = jwtMiddleware;
