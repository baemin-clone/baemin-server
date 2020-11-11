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

async function selectHistory(params, connection) {
    const query = `SELECT uo.idx as orderIdx, s.idx as storeIdx, s.logo as logo, h.tag as hashtag, s.title as title,
    CASE WHEN DATEDIFF(now(), uo.createdAt) < 1 THEN '오늘'
         WHEN DATEDIFF(now(), uo.createdAt) < 7 THEN CONCAT(DATEDIFF(now(), uo.createdAt), '일전')
         ELSE CONCAT(DATE_FORMAT(uo.createdAt, '%c/%e '),
             CASE WHEN WEEKDAY(uo.createdAt) = 0 THEN '(월)'
                 WHEN WEEKDAY(uo.createdAt) = 1 THEN '(화)'
                 WHEN WEEKDAY(uo.createdAt) = 2 THEN '(수)'
                 WHEN WEEKDAY(uo.createdAt) = 3 THEN '(목)'
                 WHEN WEEKDAY(uo.createdAt) = 4 THEN '(금)'
                 WHEN WEEKDAY(uo.createdAt) = 5 THEN '(토)'
                 WHEN WEEKDAY(uo.createdAt) = 6 THEN '(일)'
             END
             )
     END AS createdAt,
    IF(r.idx=NULL, false, true) as isWrite
FROM userOrder uo
 JOIN store s ON s.idx = uo.store_fk
 JOIN hashtag h on s.idx = h.store_fk
 LEFT OUTER JOIN (SELECT * FROM review WHERE user_fk = ? AND DATEDIFF(now(), createdAt) < 3
GROUP BY store_fk) r on s.idx = r.idx;`;

    const [historyRows] = await connection.query(query, params);

    return historyRows;
}

async function selectOrderMenuHistory(params, connection) {
    const query = `SELECT orderMenu.idx, number, title, price FROM orderMenu
    JOIN menu m on orderMenu.menu_fk = m.idx
WHERE orderMenu.order_fk = ?;`;

    const [orderMenuHistory] = await connection.query(query, params);

    return orderMenuHistory;
}
module.exports = {
    isExistMenu,
    isExistOption,
    insertOrder,
    insertOrderMenuIdx,
    insertOrderOption,
    selectHistory,
    selectOrderMenuHistory
};
