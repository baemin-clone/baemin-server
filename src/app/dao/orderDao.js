async function isExistMenu(params, connection) {
    const query = `SELECT EXISTS(SELECT * FROM menu WHERE idx =? ) as exist;`;

    const [existRows] = await connection.query(query, params);

    return existRows[0].exist;
}

async function isExistOption(params, connection) {
    const query = `SELECT EXISTS(SELECT * FROM menuOption WHERE idx =? ) as exist;`;

    const [existRows] = await connection.query(query, params);

    return existRows[0].exist;
}

async function insertOrder(params, connection) {
    const query = `INSERT INTO userOrder(user_fk, store_fk, method) VALUES (?,?,?);`;

    const [insertRow] = await connection.query(query, params);
    return insertRow.insertId;
}

async function insertOrderMenuIdx(params, connection) {
    const query = `INSERT INTO orderMenu(menu_fk, order_fk, number) VALUES (?,?,?);`;

    const [insertRow] = await connection.query(query, params);
    return insertRow.insertId;
}

async function insertOrderOption(params, connection) {
    const query = `INSERT INTO orderOption(option_fk, orderMenu_fk) VALUES (?,?);`;

    await connection.query(query, params);
}
module.exports = {
    isExistMenu,
    isExistOption,
    insertOrder,
    insertOrderMenuIdx,
    insertOrderOption
};
