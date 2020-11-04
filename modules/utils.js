const { pool } = require("../config/database");
const { logger } = require("../config/winston");

const responseObj = (isSuccess, code, message) => {
    return {
        isSuccess,
        code,
        message
    };
};

function isNull(value) {
    return value === undefined || value === null || value === "" ? true : false;
}

const connectionFunc = async (API, callback) => {
    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            await callback(connection);
        } catch (err) {
            logger.error(`App - ${API} DB Connection error\n: ${err.message}`);
            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        logger.error(`App - ${API} DB Connection error\n: ${err.message}`);
        return res.status(500).json({
            isSuccess: false,
            code: 500,
            message: "서버 에러 : 문의 요망"
        });
    }
};
module.exports = {
    responseObj,
    connectionFunc,
    isNull
};
