const { pool } = require("config/database");

// Signup
async function userEmailCheck(email, connection) {
    const selectEmailQuery = `
    SELECT EXISTS(SELECT email FROM user WHERE email = ? AND isDeleted = FALSE) as exist;
                `;
    const selectEmailParams = [email];
    const [existRow] = await connection.query(
        selectEmailQuery,
        selectEmailParams
    );

    return existRow[0];
}

async function insertUserInfo(insertUserInfoParams, connection) {
    const insertUserInfoQuery = `INSERT INTO user(email, pwd, nickname, birth) VALUES (?, ?, ?, ?);`;
    const [insertUserInfoRow] = await connection.query(
        insertUserInfoQuery,
        insertUserInfoParams
    );

    return insertUserInfoRow;
}

//SignIn
async function selectUserInfo(email, connection) {
    const selectUserInfoQuery = `SELECT idx, email, isDeleted, pwd, nickname, birth FROM user WHERE email = ? AND isDeleted = FALSE;`;

    const selectUserInfoParams = [email];
    const [userInfoRows] = await connection.query(
        selectUserInfoQuery,
        selectUserInfoParams
    );
    return userInfoRows;
}

async function selectUserInfoByIdx(idx, connection) {
    const selectUserInfoQuery = `SELECT email FROM user WHERE idx = ? AND isDeleted = FALSE;`;
    const selectUserInfoParams = [idx];

    const [userInfoRows] = await connection.query(
        selectUserInfoQuery,
        selectUserInfoParams
    );

    return userInfoRows[0];
}

async function updateUserInfo(params, connection) {
    const query = `update user SET nickname = ? , birth = ? where email= ?;`;
    const [updateUser] = await connection.query(query, params);
}

async function isExistUserByIdx(idx, connection) {
    const query = `SELECT EXISTS(SELECT * FROM user WHERE idx= ? AND isDeleted = FALSE) as exist;`;
    const [existRow] = await connection.query(query, [idx]);

    return existRow[0].exist;
}

async function deleteUser(idx, connection) {
    const query = `UPDATE user SET isDeleted = TRUE WHERE idx= ?;`;

    await connection.query(query, [idx]);
}
module.exports = {
    userEmailCheck,
    insertUserInfo,
    selectUserInfo,
    selectUserInfoByIdx,
    updateUserInfo,
    isExistUserByIdx,
    deleteUser
};
