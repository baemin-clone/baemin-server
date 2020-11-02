async function insertUserLocation(params, connection) {
    const query = `INSERT INTO userLocation(address, longitude, latitude, user_fk, roadAddress)
    VALUES (?,?,?,?,?);`;

    const [rows] = await connection.query(query, params);

    return rows;
}

async function selectUserLocation(params, connection) {
    const query = `SELECT idx, address, IFNULL(roadAddress, "") as roadAddress
    FROM userLocation
    WHERE user_fk = ? AND isDeleted = FALSE
    ORDER BY modifiedAt DESC
    limit ?,?;`;

    const [rows] = await connection.query(query, params);

    return rows;
}

async function isExistLocation(params, connection) {
    const query = `
    SELECT EXISTS(SELECT isDeleted FROM userLocation WHERE idx =? AND user_fk = ? AND isDeleted = FALSE) as exist;
    `;

    const [isExistRow] = await connection.query(query, params);

    return isExistRow[0].exist;
}

async function deleteUserLocation(params, connection) {
    const query = `update userLocation SET isDeleted=true where idx=? AND user_fk=?;`;

    const [row] = await connection.query(query, params);

    return row;
}
module.exports = {
    insertUserLocation,
    selectUserLocation,
    isExistLocation,
    deleteUserLocation
};
