const { pool } = require("../config/database");
const { logger } = require("../config/winston");

const responseObj = (isSuccess, code, message) => {
    return {
        isSuccess,
        code,
        message
    };
};

const connectionFunc = async (API, callback) => {
    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            console.log("start");
            await callback(connection);
            console.log("end");
        } catch (err) {
            logger.error(`App - ${API} DB Connection error\n: ${err.message}`);
            return res.status(500).json({
                isSuccess: false,
                code: 500,
                message: "서버 에러 : 문의 요망"
            });
        } finally {
            console.log("finally");
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
    connectionFunc
};
