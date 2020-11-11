module.exports = function(app) {
    const { SMSMiddleware, verifyMiddleware } = require("modules/twilio");
    app.post("/authSMS", SMSMiddleware);
    app.post("/authNumber", verifyMiddleware);
};
