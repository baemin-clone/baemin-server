const { pool } = require("../../../config/database");
const locationDao = require("../dao/locationDao");
const { logger } = require("../../../config/winston");

const regexPos = /[0-9]+\.[0-9]+/;

exports.addLocation = async function(req, res) {
    const { address, longitude, latitude } = req.body;
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
                userIdx
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
