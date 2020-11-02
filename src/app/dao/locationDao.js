async function insertUserLocation(params, connection) {
    const query = `INSERT INTO userLocation(address, longitude, latitude, user_fk, roadAddress)
    VALUES (?,?,?,?,?);`;

    const [rows] = await connection.query(query, params);

    return rows;
}

async function selectUserLocation(params, connection) {
    const query = `SELECT address, IFNULL(roadAddress, "") as roadAddress
    FROM userLocation
    WHERE user_fk = ? AND isDeleted = FALSE
    ORDER BY modifiedAt DESC
    limit ?,?;`;

    const [rows] = await connection.query(query, params);

    return rows;
}
module.exports = {
    insertUserLocation,
    selectUserLocation
};
