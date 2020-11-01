const { pool } = require("../../../config/database");

// Signup
async function userEmailCheck(email, connection) {
    const selectEmailQuery = `
    SELECT EXISTS(SELECT email FROM user WHERE email = ?) as exist;
                `;
    const selectEmailParams = [email];
    const [existRow] = await connection.query(
        selectEmailQuery,
        selectEmailParams
    );

    return existRow[0];
}

async function userNicknameCheck(nickname) {
    const connection = await pool.getConnection(async conn => conn);
    const selectNicknameQuery = `
                SELECT email, nickname 
                FROM UserInfo 
                WHERE nickname = ?;
                `;
    const selectNicknameParams = [nickname];
    const [nicknameRows] = await connection.query(
        selectNicknameQuery,
        selectNicknameParams
    );
    connection.release();
    return nicknameRows;
}

async function insertUserInfo(insertUserInfoParams, connection) {
    const insertUserInfoQuery = `INSERT INTO user(email, pwd, nickname, birth) VALUES (?, ?, ?, ?);`;
    const [insertUserInfoRow] = await connection.query(
        insertUserInfoQuery,
        insertUserInfoParams
    );
    console.log(insertUserInfoRow);

    return insertUserInfoRow;
}

//SignIn
async function selectUserInfo(email, connection) {
    const selectUserInfoQuery = `SELECT idx, email, isDeleted, pwd FROM user WHERE email = ?;`;

    const selectUserInfoParams = [email];
    const [userInfoRows] = await connection.query(
        selectUserInfoQuery,
        selectUserInfoParams
    );
    return userInfoRows;
}

async function selectUserInfoByIdx(idx, connection) {
    const selectUserInfoQuery = `SELECT email FROM user WHERE idx = ?;`;
    const selectUserInfoParams = [idx];

    const [userInfoRows] = await connection.query(
        selectUserInfoQuery,
        selectUserInfoParams
    );

    return userInfoRows[0];
}

module.exports = {
    userEmailCheck,
    userNicknameCheck,
    insertUserInfo,
    selectUserInfo,
    selectUserInfoByIdx
};
