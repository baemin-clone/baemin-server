const { pool } = require("config/database");
const { logger } = require("config/winston");

const jwt = require("jsonwebtoken");
const regexEmail = require("regex-email");
const regexBirth = /\d{4}\.\d{2}\.\d{2}/;
const crypto = require("crypto");
const secret_config = require("config/secret");

const userDao = require("dao/userDao");
const locationDao = require("../dao/locationDao");

const { constants } = require("buffer");

const obj = require("modules/utils").responseObj;
const tryCatch = require("modules/utils").connectionFunc;
/**
 update : 2020.11.1
 02.signUp API = 회원가입
 */
exports.signUp = async function(req, res) {
    const { email, pwd, nickname, birth } = req.body;

    if (!email)
        return res.json(
            obj(
                false,
                3,
                `Body Parameter Error : 파라미터 'email'이 존재하지 않습니다.`
            )
        );

    if (!pwd)
        return res.json(
            obj(
                false,
                4,
                `Body Parameter Error : 파라미터 'pwd'가 존재하지 않습니다.`
            )
        );

    if (!nickname) {
        return res.json(
            obj(
                false,
                5,
                `Body Parameter Error : 파라미터 'nickname'이 존재하지 않습니다.`
            )
        );
    }

    if (!birth) {
        return res.json(
            obj(
                false,
                6,
                `Body Parameter Error : 파라미터 'birth'가 존재하지 않습니다.`
            )
        );
    }

    if (email.length >= 30 || !regexEmail.test(email))
        return res.json(
            obj(
                false,
                7,
                `Body Parameter Error : 'email' 형식이 잘못되었습니다. (30자 미만, 이메일 정규표현 지키기)`
            )
        );

    if (pwd.length < 10 || pwd.length >= 20)
        return res.json(
            obj(
                false,
                8,
                `비밀번호는 6~20자리를 Body Parameter Error : 'pwd' 형식이 잘못되었습니다. (10자 이상 20자 미만).`
            )
        );

    if (nickname.length < 2 || nickname.length >= 10) {
        return res.json(
            obj(
                false,
                9,
                `Body Parameter Error : 'nickname' 형식이 잘못되었습니다. (2자 이상 10자 미만)`
            )
        );
    }

    if (!regexBirth.test(birth)) {
        return res.json(
            obj(
                false,
                10,
                `Body Parameter Error : 'birth' 형식이 잘못되었습니다. (yyyy.mm.dd 형식)`
            )
        );
    }

    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            // 이메일 중복 확인
            const existObj = await userDao.userEmailCheck(email, connection);

            if (existObj.exist) {
                return res.json(obj(false, 2, `이미 존재하는 회원입니다.`));
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
                return res.json({
                    isSuccess: false,
                    code: 500,
                    message: "서버 에러 : 문의 요망"
                });
            }
        } catch (err) {
            await connection.rollback(); // ROLLBACK
            logger.error(`App - SignUp DB Connection error\n: ${err.message}`);
            return res.json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        logger.error(`App - SignUp DB Connection error\n: ${err.message}`);
        return res.json({
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
        return res.son(
            obj(
                false,
                4,
                `Body Parameter Error : 파라미터 'email'이 존재하지 않습니다.`
            )
        );

    if (email.length >= 30 || !regexEmail.test(email))
        return res.json(
            obj(
                false,
                6,
                `Body Parameter Error : 'email' 형식이 잘못되었습니다. (30자 미만, 이메일 정규표현식)`
            )
        );

    if (!pwd)
        return res.json(
            obj(
                false,
                5,
                `Body Parameter Error : 파라미터 'pwd'가 존재하지 않습니다.`
            )
        );

    if (pwd.length < 10 || pwd.length >= 20)
        return res.json(
            obj(
                false,
                5,
                `Body Parameter Error : 'pwd' 형식이 잘못되었습니다. (10자 이상 20자 미만)`
            )
        );

    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            const userInfoRow = await userDao.selectUserInfo(email, connection);

            if (userInfoRow.length < 1) {
                return res.json(obj(false, 2, `회원 정보를 찾을 수 없습니다.`));
            }

            const hashedPassword = await crypto
                .createHash("sha512")
                .update(pwd)
                .digest("hex");

            if (userInfoRow[0].pwd !== hashedPassword) {
                return res.json(
                    obj(false, 3, `email과 password가 부합하지 않습니다.`)
                );
            }

            if (userInfoRow[0].isDeleted) {
                return res.json(obj(false, 8, `탈퇴된 계정입니다.`));
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

            const currentLocationParams = [userInfoRow[0].idx, 0, 1];
            const userCurrentLocationArray = await locationDao.selectUserLocation(
                currentLocationParams,
                connection
            );

            return res.json({
                result: {
                    email: userInfoRow[0].email,
                    jwt: token,
                    currentAddress:
                        userCurrentLocationArray.length < 1
                            ? ""
                            : userCurrentLocationArray[0].address
                },
                isSuccess: true,
                code: 1,
                message: "로그인 성공"
            });
        } catch (err) {
            logger.error(`App - Login Query error\n: ${JSON.stringify(err)}`);
            return res.json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        logger.error(
            `App - Login DB Connection error\n: ${JSON.stringify(err)}`
        );
        return res.json({
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
        return res.json({
            isSuccess: false,
            code: 3,
            message: "Body Parameter Error : 'email'이 존재하지않습니다."
        });
    }

    if (email.length >= 30 || !regexEmail.test(email))
        return res.json({
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
                return res.json({
                    isExist: true,
                    isSuccess: false,
                    code: 1,
                    message: "중복된 이메일입니다."
                });
            } else {
                return res.json({
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
            return res.json({
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
        return res.json({
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
        return res.json(
            obj(false, 3, `Body Parameter Error: AccessToken을 입력해주세요.`)
        );
    }

    const header = "Bearer " + token; // Bearer 다음에 공백 추가

    const api_url = "https://openapi.naver.com/v1/nid/me";
    const request = require("request");
    const options = {
        url: api_url,
        headers: { Authorization: header }
    };

    request.get(options, async function(error, response, body) {
        if (!error && response.statusCode == 200) {
            const { email } = JSON.parse(body).response;

            if (!email)
                return res.json(
                    obj(false, 4, `네이버 리소스에'email'이 존재하지 않습니다.`)
                );

            if (email.length >= 30 || !regexEmail.test(email))
                return res.json(
                    obj(
                        false,
                        6,
                        `네이버 리소스에 'email' 형식이 잘못되었습니다. (30자 미만, 이메일 정규표현 지키기)`
                    )
                );

            try {
                const connection = await pool.getConnection(async conn => conn);
                try {
                    const existObj = await userDao.userEmailCheck(
                        email,
                        connection
                    );

                    if (!existObj.exist) {
                        return res.json(
                            obj(
                                false,
                                8,
                                `회원가입을 위해 추가 정보를 입력해주세요. (nickname, birth)`
                            )
                        );
                    }

                    const userInfoRows = await userDao.selectUserInfo(
                        email,
                        connection
                    );

                    if (userInfoRows < 1) {
                        return res.json(
                            obj(false, 500, "로그인 실패 : 서버 문의")
                        );
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

                    return res.json({
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
                    return res.json(obj(false, 500, `서버 에러 : 문의 요망`));
                } finally {
                    connection.release();
                }
            } catch (err) {
                logger.error(`Naver Api DB Connection Error\n : ${err}`);
                return res.json(obj(false, 500, `서버 에러 : 문의 요망`));
            }
        } else {
            logger.error(`Access Token error\n: ${error}`);
            return res.json(
                obj(
                    false,
                    2,
                    `AccessToken이 유효하지않습니다. (네이버 서버에서 정보를 가져오지 못함)`
                )
            );
        }
    });
};
/**
 update : 2020.11.3
 18.추가 정보 입력 api 
 **/

exports.addUserInfo = async function(req, res) {
    const { accessToken: token } = req.body;
    const { nickname, birth } = req.body;

    if (!nickname) {
        return res.json({
            isSuccess: false,
            code: 3,
            message:
                "Body Parameter Error : 파라미터 'nickname'이 존재하지 않습니다."
        });
    }

    if (!birth) {
        return res.json({
            isSuccess: false,
            code: 4,
            message:
                "Body Parameter Error : 파라미터 'birth'가 존재하지 않습니다."
        });
    }

    if (nickname.length < 2 || nickname.length >= 10) {
        return res.json({
            isSuccess: false,
            code: 5,
            message:
                "Body Parameter Error : 'nickname' 형식이 잘못되었습니다. (2자 이상 10자 미만)"
        });
    }

    if (!regexBirth.test(birth)) {
        return res.json({
            isSuccess: false,
            code: 6,
            message:
                "Body Parameter Error : 'birth' 형식이 잘못되었습니다. (yyyy.mm.dd 형식)"
        });
    }

    if (!token) {
        return res.json({
            isSuccess: false,
            code: 2,
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
            const { email } = JSON.parse(body).response;

            if (!email)
                return res.json({
                    isSuccess: false,
                    code: 8,
                    message: "네이버 계정에 'email'이 존재하지 않습니다."
                });

            if (email.length >= 30 || !regexEmail.test(email))
                return res.json({
                    isSuccess: false,
                    code: 100,
                    message:
                        "네이버 리소스에: 'email' 형식이 잘못되었습니다. (30자 미만, 이메일 정규표현 지키기)"
                });

            try {
                const connection = await pool.getConnection(async conn => conn);
                try {
                    await connection.beginTransaction();

                    const existObj = await userDao.userEmailCheck(
                        email,
                        connection
                    );

                    if (existObj.exist) {
                        return res.json({
                            isSuccess: false,
                            code: 7,
                            message: "이미 존재하는 계정입니다."
                        });
                    }
                    const insertUserInfoParams = [email, null, nickname, birth];

                    const insertUserInfoRows = await userDao.insertUserInfo(
                        insertUserInfoParams,
                        connection
                    );

                    const userInfoRows = await userDao.selectUserInfo(
                        email,
                        connection
                    );

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

                    await connection.commit();
                    return res.json({
                        result: {
                            nickname,
                            birth,
                            email: dbEmail,
                            jwt: jwtToken
                        },
                        isSuccess: true,
                        code: 1,
                        message: "네이버 로그인 성공"
                    });
                } catch (err) {
                    logger.error(`Add UserInfo Api Error\n : ${err}`);
                    connection.rollback();
                    return res.json({
                        isSuccess: false,
                        code: 500,
                        message: "서버 에러 : 문의 요망"
                    });
                } finally {
                    connection.release();
                }
            } catch (err) {
                logger.error(`Add UserInfo Api DB Connection Error\n : ${err}`);
                return res.json({
                    isSuccess: false,
                    code: 500,
                    message: "서버 에러 : 문의 요망"
                });
            }
        } else {
            logger.error(`Access Token error\n: ${error}`);
            return res.json({
                isSuccess: false,
                code: 2,
                message:
                    "AccessToken이 유효하지않습니다. (네이버 서버에서 정보를 가져오지 못함)"
            });
        }
    });
};

/**
 * update : 2020.11.4
 * 19. Delete User api : 유저 삭제 api
 */
exports.deleteUser = async function(req, res) {
    const userIdx = req.verifiedToken.idx;

    await tryCatch(`Delete User API`, async connection => {
        const isExist = await userDao.isExistUserByIdx(userIdx, connection);

        if (!isExist) {
            return res.json({
                userIdx: userIdx,
                ...obj(true, 2, "이미 존재하지않는 유저입니다.")
            });
        }

        await userDao.deleteUser(userIdx, connection);

        return res.json({
            userIdx: userIdx,
            ...obj(true, 1, "유저 삭제 완료")
        });
    });

    // try {
    //     const connection = await pool.getConnection(async conn => conn);

    //     try {
    //         const isExist = await userDao.isExistUserByIdx(userIdx, connection);

    //         if (!isExist) {
    //             return res.status(200).json({
    //                 userIdx: userIdx,
    //                 ...changeObj(true, 2, "이미 존재하지않는 유저입니다.")
    //             });
    //         }

    //         await userDao.deleteUser(userIdx, connection);

    //         return res.status(200).json({
    //             userIdx: userIdx,
    //             ...changeObj(true, 2, "유저 삭제 완료")
    //         });
    //     } catch (err) {
    //         logger.error(
    //             `App - Delete User DB Connection error\n: ${err.message}`
    //         );
    //         return res.status(500).json({
    //             isSuccess: false,
    //             code: 500,
    //             message: "서버 에러 : 문의 요망"
    //         });
    //     } finally {
    //         connection.release();
    //     }
    // } catch (err) {
    //     logger.error(`App - Delete User DB Connection error\n: ${err.message}`);
    //     return res.status(500).json({
    //         isSuccess: false,
    //         code: 500,
    //         message: "서버 에러 : 문의 요망"
    //     });
    // }
};

/**
 * update : 2020.11.4
 * 20. Get User Info api : 유저 정보 조회 api
 */
exports.getUserInfo = async function(req, res) {
    const userIdx = req.verifiedToken.idx;
    await tryCatch(`Get User Info`, async connection => {
        const isExist = await userDao.isExistUserByIdx(userIdx, connection);

        if (!isExist) {
            return res.json(obj(false, 400, "존재하지않는 회원입니다."));
        }

        const userInfo = await userDao.selectUserInfoByIdx(userIdx, connection);

        const { email, nickname, phone } = userInfo;

        return res.json({
            result: {
                email,
                nickname,
                phone
            },
            ...obj(true, 200, "회원 정보 조회 성공")
        });
    });
};

/**
 * update : 2020.11.4
 * 09. Modify User Info api : 유저 정보 조회 api
 */
exports.modifyUserInfo = async function(req, res) {
    const userIdx = req.verifiedToken.idx;

    const { nickname, pwd } = req.body;

    if (nickname && (nickname.length < 2 || nickname.length >= 10)) {
        return res.json(
            obj(
                false,
                400,
                `nickname의 형식이 잘못되었습니다. (2자 이상 10자 미만)`
            )
        );
    }

    if (pwd && (pwd.length < 10 || pwd.length >= 20)) {
        return res.json(
            obj(false, 400, `pwd 형식이 잘못되었습니다.(10자 이상 20자 미만))`)
        );
    }

    if (nickname || pwd) {
        await tryCatch(`Modify user info nickname`, async connection => {
            const isExist = await userDao.selectUserInfoByIdx(
                userIdx,
                connection
            );

            if (!isExist) {
                return res.json(obj(false, 400, "존재하지않는 회원입니다."));
            }

            if (nickname) {
                const nicknameParams = [nickname, userIdx];
                await userDao.updateUserNickname(nicknameParams, connection);
            }

            if (pwd) {
                const hashedPassword = await crypto
                    .createHash("sha512")
                    .update(pwd)
                    .digest("hex");

                const pwdParams = [hashedPassword, userIdx];

                await userDao.updateUserPwd(pwdParams, connection);
            }

            const userInfo = await userDao.selectUserInfoByIdx(
                userIdx,
                connection
            );

            const { email, nickname: userNickname, phone } = userInfo;

            return res.json({
                result: {
                    email: email,
                    nickname: userNickname,
                    phone: phone
                },
                ...obj(true, 200, "회원 정보 수정 성공")
            });
        });
    } else {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error : 하나 이상의 파라미터를 넣어주세요."
            )
        );
    }
};

/**
 update : 2019.09.23
 03.check API = token 검증
 **/
exports.check = async function(req, res) {
    const userIdx = req.verifiedToken.idx;
    let address = "";

    await tryCatch(`Check`, async connection => {
        const currentAddressArray = await locationDao.selectUserLocation(
            [userIdx, 0, 1],
            connection
        );

        if (currentAddressArray.length >= 1) {
            address = currentAddressArray[0].address;
        }
    });

    res.json({
        isSuccess: true,
        code: 200,
        message: "검증 성공",
        info: {
            address,
            ...req.verifiedToken
        }
    });
};
