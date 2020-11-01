const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const jwt = require("jsonwebtoken");
const regexEmail = require("regex-email");
const regexBirth = /\d{4}\.\d{2}\.\d{2}/;
const crypto = require("crypto");
const secret_config = require("../../../config/secret");

const userDao = require("../dao/userDao");
const { constants } = require("buffer");

/**
 update : 2020.11.1
 02.signUp API = 회원가입
 */
exports.signUp = async function(req, res) {
    const { email, pwd, nickname, birth } = req.body;

    if (!email)
        return res.status(400).json({
            isSuccess: false,
            code: 3,
            message:
                "Body Parameter Error : 파라미터 'email'이 존재하지 않습니다."
        });

    if (!pwd)
        return res.status(400).json({
            isSuccess: false,
            code: 4,
            message:
                "Body Parameter Error : 파라미터 'pwd'가 존재하지 않습니다."
        });

    if (!nickname) {
        return res.status(400).json({
            isSuccess: false,
            code: 5,
            message:
                "Body Parameter Error : 파라미터 'nickname'이 존재하지 않습니다."
        });
    }

    if (!birth) {
        return res.status(400).json({
            isSuccess: false,
            code: 6,
            message:
                "Body Parameter Error : 파라미터 'birth'가 존재하지 않습니다."
        });
    }

    if (email.length >= 30 || !regexEmail.test(email))
        return res.status(400).json({
            isSuccess: false,
            code: 7,
            message:
                "Body Parameter Error : 'email' 형식이 잘못되었습니다. (30자 미만, 이메일 정규표현 지키기)"
        });

    if (pwd.length < 10 || pwd.length >= 20)
        return res.status(400).json({
            isSuccess: false,
            code: 8,
            message:
                "비밀번호는 6~20자리를 Body Parameter Error : 'pwd' 형식이 잘못되었습니다. (10자 이상 20자 미만)."
        });

    if (nickname.length < 2 || nickname.length >= 10) {
        return res.status(400).json({
            isSuccess: false,
            code: 9,
            message:
                "Body Parameter Error : 'nickname' 형식이 잘못되었습니다. (2자 이상 10자 미만)"
        });
    }

    if (!regexBirth.test(birth)) {
        return res.status(400).json({
            isSuccess: false,
            code: 10,
            message:
                "Body Parameter Error : 'birth' 형식이 잘못되었습니다. (yyyy.mm.dd 형식)"
        });
    }

    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            // 이메일 중복 확인
            const existObj = await userDao.userEmailCheck(email, connection);

            if (existObj.exist) {
                return res.status(400).json({
                    isSuccess: false,
                    code: 2,
                    message: "이미 존재하는 회원입니다."
                });
            }

            await connection.beginTransaction(); // START TRANSACTION

            const hashedPassword = await crypto
                .createHash("sha512")
                .update(pwd)
                .digest("hex");

            const insertUserInfoParams = [
                email,
                hashedPassword,
                nickname,
                birth
            ];

            const insertUserRows = await userDao.insertUserInfo(
                insertUserInfoParams,
                connection
            );

            const idx = insertUserRows.insertId;
            const user = await userDao.selectUserInfoByIdx(idx, connection);

            if (user.email === email) {
                await connection.commit(); // COMMIT

                const token = await jwt.sign(
                    {
                        idx: idx
                    }, // 토큰의 내용(payload)
                    secret_config.jwtsecret, // 비밀 키
                    {
                        expiresIn: "365d",
                        subject: "userInfo"
                    } // 유효 시간은 365일
                );

                return res.json({
                    result: {
                        email: user.email,
                        jwt: token
                    },
                    isSuccess: true,
                    code: 1,
                    message: "회원가입 성공"
                });
            } else {
                return res.status(500).json({
                    isSuccess: false,
                    code: 500,
                    message: "서버 에러 : 문의 요망"
                });
            }
        } catch (err) {
            await connection.rollback(); // ROLLBACK
            logger.error(`App - SignUp DB Connection error\n: ${err.message}`);
            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        logger.error(`App - SignUp DB Connection error\n: ${err.message}`);
        return res.status(500).json({
            isSuccess: false,
            code: 500,
            message: "서버 에러 : 문의 요망"
        });
    }
};

/**
 update : 2020.11.1
 01.login API = 로그인
 **/
exports.login = async function(req, res) {
    const { email, pwd } = req.body;

    if (!email)
        return res.status(400).json({
            isSuccess: false,
            code: 4,
            message:
                "Body Parameter Error : 파라미터 'email'이 존재하지 않습니다."
        });

    if (email.length >= 30 || !regexEmail.test(email))
        return res.status(400).json({
            isSuccess: false,
            code: 6,
            message:
                "Body Parameter Error : 'email' 형식이 잘못되었습니다. (30자 미만, 이메일 정규표현식)"
        });

    if (!pwd)
        return res.status(400).json({
            isSuccess: false,
            code: 5,
            message:
                "Body Parameter Error : 파라미터 'pwd'가 존재하지 않습니다."
        });

    if (pwd.length < 10 || pwd.length >= 20)
        return res.status(400).json({
            isSuccess: false,
            code: 7,
            message:
                "Body Parameter Error : 'pwd' 형식이 잘못되었습니다. (10자 이상 20자 미만)"
        });

    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            const userInfoRow = await userDao.selectUserInfo(email, connection);

            if (userInfoRow.length < 1) {
                return res.status(400).json({
                    isSuccess: false,
                    code: 2,
                    message: "회원 정보를 찾을 수 없습니다."
                });
            }

            const hashedPassword = await crypto
                .createHash("sha512")
                .update(pwd)
                .digest("hex");

            if (userInfoRow[0].pwd !== hashedPassword) {
                return res.status(400).json({
                    isSuccess: false,
                    code: 3,
                    message: "email과 password가 부합하지 않습니다."
                });
            }

            if (userInfoRow[0].isDeleted) {
                return res.status(400).json({
                    isSuccess: false,
                    code: 8,
                    message: "탈퇴된 계정입니다."
                });
            }
            //토큰 생성
            const token = await jwt.sign(
                {
                    idx: userInfoRow[0].idx
                }, // 토큰의 내용(payload)
                secret_config.jwtsecret, // 비밀 키
                {
                    expiresIn: "365d",
                    subject: "userInfo"
                } // 유효 시간은 365일
            );

            res.status(200).json({
                result: {
                    email: userInfoRow[0].email,
                    jwt: token
                },
                isSuccess: true,
                code: 1,
                message: "로그인 성공"
            });
        } catch (err) {
            logger.error(`App - SignIn Query error\n: ${JSON.stringify(err)}`);
            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        logger.error(
            `App - SignIn DB Connection error\n: ${JSON.stringify(err)}`
        );
        return res.status(500).json({
            isSuccess: false,
            code: 500,
            message: "서버 에러 : 문의 요망"
        });
    }
};

/**
 update : 2020.11.1
 03.duplicate-email api = 이메일 중복 체크 api
 **/

exports.checkEmail = async function(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            isSuccess: false,
            code: 3,
            message: "Body Parameter Error : 'email'이 존재하지않습니다."
        });
    }

    if (email.length >= 30 || !regexEmail.test(email))
        return res.status(400).json({
            isSuccess: false,
            code: 4,
            message:
                "Body Parameter Error : 'email' 형식이 잘못되었습니다. (30자 미만, 이메일 정규표현 지키기)"
        });

    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            const existObj = await userDao.userEmailCheck(email, connection);

            if (existObj.exist) {
                return res.status(200).json({
                    isExist: true,
                    isSuccess: false,
                    code: 1,
                    message: "중복된 이메일입니다."
                });
            } else {
                return res.status(200).json({
                    isExist: false,
                    isSuccess: true,
                    code: 2,
                    message: "회원가입 가능한 이메일입니다."
                });
            }
        } catch (err) {
            logger.error(
                `App - Duplicate Email Check Query error\n: ${JSON.stringify(
                    err
                )}`
            );
            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        logger.error(
            `App - Email Check DB Connection error\n: ${JSON.stringify(err)}`
        );
        return res.status(500).json({
            isSuccess: false,
            code: 500,
            message: "서버 에러 : 문의 요망"
        });
    }
};
/**
 update : 2020.11.1
 04.social login api = 이메일 중복 체크 api
 **/
exports.socialLogin = async function(req, res) {
    const { accessToken: token } = req.body;

    if (!token) {
        return res.status(400).json({
            isSuccess: false,
            code: 3,
            message: "Body Parameter Error: AccessToken을 입력해주세요."
        });
    }

    var header = "Bearer " + token; // Bearer 다음에 공백 추가

    var api_url = "https://openapi.naver.com/v1/nid/me";
    var request = require("request");
    var options = {
        url: api_url,
        headers: { Authorization: header }
    };

    request.get(options, async function(error, response, body) {
        if (!error && response.statusCode == 200) {
            const { email, nickname, birthday: birth } = JSON.parse(
                body
            ).response;

            if (!email)
                return res.status(400).json({
                    isSuccess: false,
                    code: 4,
                    message:
                        "Body Parameter Error : 파라미터 'email'이 존재하지 않습니다."
                });

            if (!nickname) {
                return res.status(400).json({
                    isSuccess: false,
                    code: 5,
                    message:
                        "Body Parameter Error : 파라미터 'nickname'이 존재하지 않습니다."
                });
            }

            if (email.length >= 30 || !regexEmail.test(email))
                return res.status(400).json({
                    isSuccess: false,
                    code: 6,
                    message:
                        "Body Parameter Error : 'email' 형식이 잘못되었습니다. (30자 미만, 이메일 정규표현 지키기)"
                });

            if (nickname.length < 2 || nickname.length >= 10) {
                return res.status(400).json({
                    isSuccess: false,
                    code: 7,
                    message:
                        "Body Parameter Error : 'nickname' 형식이 잘못되었습니다. (2자 이상 10자 미만)"
                });
            }

            try {
                const connection = await pool.getConnection(async conn => conn);
                try {
                    const existObj = await userDao.userEmailCheck(
                        email,
                        connection
                    );

                    connection.beginTransaction();

                    if (!existObj.exist) {
                        const insertUserInfoParams = [
                            email,
                            null,
                            nickname,
                            birth || null
                        ];

                        const insertUserInfoRows = await userDao.insertUserInfo(
                            insertUserInfoParams,
                            connection
                        );
                    }

                    const userInfoRows = await userDao.selectUserInfo(
                        email,
                        connection
                    );

                    if (userInfoRows < 1) {
                        return res.status(500).json({
                            isSuccess: false,
                            code: 500,
                            message: "회원가입 실패 : 서버 문의"
                        });
                    }

                    const { idx, email: dbEmail } = userInfoRows[0];

                    const jwtToken = await jwt.sign(
                        {
                            idx: idx
                        }, // 토큰의 내용(payload)
                        secret_config.jwtsecret, // 비밀 키
                        {
                            expiresIn: "365d",
                            subject: "userInfo"
                        } // 유효 시간은 365일
                    );
                    connection.commit();

                    return res.status(200).json({
                        result: {
                            jwt: jwtToken,
                            email: dbEmail
                        },
                        isSuccess: true,
                        code: 1,
                        message: "네이버 로그인 성공"
                    });
                } catch (err) {
                    logger.error(`Naver login Api Error\n : ${err}`);
                    connection.rollback();
                    return res.status(500).json({
                        isSuccess: false,
                        code: 500,
                        message: "서버 에러 : 문의 요망"
                    });
                } finally {
                    connection.release();
                }
            } catch (err) {
                logger.error(`Naver Api DB Connection Error\n : ${err}`);
                return res.status(500).json({
                    isSuccess: false,
                    code: 500,
                    message: "서버 에러 : 문의 요망"
                });
            }
        } else {
            logger.error(`Access Token error\n: ${error}`);
            return res.status(400).json({
                isSuccess: false,
                code: 2,
                message:
                    "AccessToken이 유효하지않습니다. (네이버 서버에서 정보를 가져오지 못함)"
            });
        }
    });
};

/**
 update : 2019.09.23
 03.check API = token 검증
 **/
exports.check = async function(req, res) {
    res.json({
        isSuccess: true,
        code: 200,
        message: "검증 성공",
        info: req.verifiedToken
    });
};
