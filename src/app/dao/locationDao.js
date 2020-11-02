async function insertUserLocation(params, connection) {
    const query = `INSERT INTO userLocation(address, longitude, latitude, user_fk)
    VALUES (?,?,?,?);`;

    const [rows] = await connection.query(query, params);

    return rows;
}

module.exports = {
    insertUserLocation
};
