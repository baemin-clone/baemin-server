const { twilioAccount } = require("config/secret");
const redis = require("./redis");

const accountSid = twilioAccount.id;
const authToken = twilioAccount.token;
const client = require("twilio")(accountSid, authToken);

function sendSMS(phoneNumber, authNum) {
    client.messages
        .create({
            body: `[배달의 민족] : 인증번호 ${authNum}`,
            from: "+19065694501",
            to: `+82${phoneNumber}`
        })
        .then(() => {
            redis.save(phoneNumber, authNum);
            return res.json();
        })
        .catch(err => {
            return res.json({
                isSuccess: false,
                code: 500,
                message: "Server Error : 문의 필요"
            });
        });
}

function verifyMiddleware(req, res) {
    const regexPhone = /^\d{3}-\d{3,4}-\d{4}$/;

    const { phoneNumber, authNum } = req.body;
    const red = {};

    if (!authNum) {
        return res.json({
            isSuccess: false,
            code: 400,
            message:
                "Body Parameter Error : authNum에 네자리 숫자를 넣어주세요."
        });
    }

    if (!regexPhone.test(phoneNumber)) {
        return res.json({
            isSuccess: false,
            code: 400,
            messages:
                "Body Parameter Error : phoneNumber를 000-000-0000 형식으로 입력해주세요"
        });
    }

    const numberToString = phoneNumber.split("-").join("");

    redis
        .get(numberToString)
        .then(reply => {
            if (!reply) {
                return res.json({
                    isSuccess: false,
                    code: 402,
                    message: "인증번호가 expire 됐습니다."
                });
            }
            if (reply == authNum) {
                return res.json({
                    isSuccess: true,
                    code: 200,
                    message: "인증 성공"
                });
            } else {
                return res.json({
                    isSuccess: false,
                    code: 401,
                    message: "인증번호가 일치하지 않습니다."
                });
            }
        })
        .catch(err => {
            return res.json({
                isSuccess: false,
                code: 500,
                message: "Server Error: 문의 필요"
            });
        });
}

function SMSMiddleware(req, res) {
    const regexPhone = /^\d{3}-\d{3,4}-\d{4}$/;
    const phoneNumber = req.body.phoneNumber;

    if (!regexPhone.test(phoneNumber)) {
        return res.json({
            isSuccess: false,
            code: 400,
            message:
                "Body Parameter Error : phoneNumber를 000-000-0000 형식으로 입력해주세요"
        });
    }
    const numberToString = phoneNumber.split("-").join("");
    const random = parseInt(Math.random() * 10 ** 4);

    sendSMS(numberToString, random);

    return res.json({
        isSuccess: true,
        code: 200,
        message: "인증번호 전송 성공"
    });
}
module.exports = {
    SMSMiddleware,
    verifyMiddleware
};
