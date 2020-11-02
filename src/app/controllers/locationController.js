const { pool } = require("../../../config/database");
const locationDao = require("../dao/locationDao");
const { logger } = require("../../../config/winston");

const regexPos = /[0-9]+\.[0-9]+/;

/**
 update : 2020.11.2
 08.add user location API = 유저 주소 추가 api
 */
exports.addUserLocation = async function(req, res) {
    const { address, longitude, latitude, roadAddress } = req.body;
    const userIdx = req.verifiedToken.idx;

    if (!address) {
        return res.status(400).json({
            isSuccess: false,
            code: 3,
            message:
                "Body Parameter Error : 파라미터  'address'가 존재하지 않습니다."
        });
    }

    if (!longitude) {
        return res.status(400).json({
            isSuccess: false,
            code: 4,
            message:
                "Body Parameter Error : 파라미터 'longitude'가 존재하지 않습니다."
        });
    }

    if (!latitude) {
        return res.status(400).json({
            isSuccess: false,
            code: 5,
            message:
                "Body Parameter Error : 파라미터 'latitude'가 존재하지 않습니다."
        });
    }

    if (!regexPos.test(longitude)) {
        return res.status(400).json({
            isSuccess: false,
            code: 7,
            message: "Body Parameter Error : 'longitude' 형식이 잘못되었습니다."
        });
    }

    if (!regexPos.test(latitude)) {
        return res.status(400).json({
            isSuccess: false,
            code: 8,
            message: "Body Parameter Error : 'latitude' 형식이 잘못되었습니다."
        });
    }

    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            const insertLocationParams = [
                address,
                longitude,
                latitude,
                userIdx,
                roadAddress || ""
            ];

            const newLocationIdx = await locationDao.insertUserLocation(
                insertLocationParams,
                connection
            );

            if (!newLocationIdx.insertId) {
                logger.error("Add Location API Insert fail");
                return res.status(500).json({
                    isSuccess: false,
                    code: 500,
                    message: "서버 에러 : 문의 요망"
                });
            }

            return res.status(200).json({
                currentAddress: address,
                isSuccess: true,
                code: 1,
                message: "사용자 위치 등록 성공"
            });
        } catch (err) {
            logger.error(`Add Location API Error\n : ${err.message}`);

            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        logger.error(`Add Location DB Connection Error\n : ${err.message}`);

        return res.status(500).json({
            isSuccess: false,
            code: 500,
            message: "서버 에러 : 문의 요망"
        });
    }
};

exports.getUserLocation = async function(req, res) {
    let page = req.query.page;
    let size = req.query.size;
    const userIdx = req.verifiedToken.idx;

    if (page && isNaN(page)) {
        return res.status(400).json({
            isSuccess: false,
            code: 4,
            message: "Query String Error: page 타입이 알맞지 않습니다."
        });
    }

    if (size && isNaN(size)) {
        return res.status(400).json({
            isSuccess: false,
            code: 5,
            message: "Query String Error: size 타입이 알맞지 않습니다."
        });
    }

    if (!page) {
        page = 1;
    }
    if (!size) {
        size = 10;
    }

    page = (page - 1) * size;
    size = parseInt(page) + parseInt(size);

    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            const selectUserLocationParams = [userIdx, page, size];

            const userLocationRows = await locationDao.selectUserLocation(
                selectUserLocationParams,
                connection
            );

            return res.status(200).json({
                result: {
                    userLocationRows,
                    page: parseInt(req.query.page) || 1,
                    size: parseInt(req.query.size) || 10
                },
                isSuccess: true,
                code: 1,
                message: "주소 목록 조회 성공"
            });
        } catch (err) {
            logger.error(`Add Location API Error\n : ${err.message}`);

            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        logger.error(`Add Location DB Connection Error\n : ${err.message}`);

        return res.status(500).json({
            isSuccess: false,
            code: 500,
            message: "서버 에러 : 문의 요망"
        });
    }
};

exports.getCurrentAddress = async function(req, res) {
    const userIdx = req.verifiedToken.idx;

    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            const currentAddressRow = await locationDao.selectUserLocation(
                [userIdx, 0, 1],
                connection
            );

            if (currentAddressRow.length < 1) {
                return res.status(400).json({
                    isSuccess: false,
                    code: 3,
                    message: "현재 주소가 존재하지 않습니다."
                });
            }

            res.status(200).json({
                currentAddress: currentAddressRow[0].address,
                isSuccess: true,
                code: 1,
                message: "현재 주소 조회 성공"
            });
        } catch (err) {
            logger.error(`Add Location API Error\n : ${err.message}`);

            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        logger.error(`Add Location DB Connection Error\n : ${err.message}`);

        return res.status(500).json({
            isSuccess: false,
            code: 500,
            message: "서버 에러 : 문의 요망"
        });
    }
};
