async function selectStoreInfo(params, connection) {
    const query = `SELECT idx, logo, title, minOrderAmount, deliveryTime, 
    deliveryTip, category, phoneNumber as phone, description, 
    orderAvailability, guide,  orderAvailability, operatingTime, closedDay, 
    deliveryZone, payment, longitude, latitude FROM store WHERE idx = ?;`;

    const [storeInfoRow] = await connection.query(query, params);

    return storeInfoRow;
}

async function isExistStore(params, connection) {
    const query = `SELECT EXISTS(SELECT * FROM store WHERE idx = ? AND isDeleted = FALSE) as exist;`;

    const [existRow] = await connection.query(query, params);

    return existRow[0].exist;
}

async function selectReviewNumAndStar(params, connection) {
    const query = `SELECT COUNT(*) as reviewNum, AVG(star) as avgStar FROM review WHERE store_fk = ? GROUP BY store_fk;`;

    const [reviewNumAndStar] = await connection.query(query, params);

    return reviewNumAndStar;
}

async function selectStoreBookmarkNum(params, connection) {
    const query = `SELECT COUNT(*) as bookmarkNum FROM bookmark WHERE store_fk = ? AND status = 'Y' GROUP BY store_fk;
    `;

    const [bookmarkNum] = await connection.query(query, params);

    return bookmarkNum;
}

async function selectMyBookmark(params, connection) {
    const query = `SELECT EXISTS(SELECT * FROM bookmark WHERE user_fk = ? AND status = 'Y') as isBookmark;
    `;

    const [isBookmark] = await connection.query(query, params);

    return isBookmark[0].isBookmark;
}

async function selectStoreList(params, connection) {
    const query = `
    SELECT t.roadAddress as address, s.storeIdx as storeIdx, s.logo as logo, t.title as title, avgStar, recommendation, t.deliveryTime, s.minOrderAmount, deliveryTip as tip, reviewNum FROM store t JOIN(
            SELECT s.idx as storeIdx, s.logo as logo, s.title as title,
                   IFNULL(avgStar, 0) as avgStar, IFNULL(rn.reviewNum, 0) as reviewNum,
                   deliveryTime, minOrderAmount, deliveryTip as tip, IFNULL(bn.bookmarkNum, 0) as bookmarkNum, mgm.title as recommendation
            FROM store s
                JOIN (SELECT idx, store_fk, tag FROM hashtag WHERE tag = ?) h
                    ON s.idx = h.store_fk
                JOIN (SELECT mg.store_fk, m.title FROM menuGroup mg
                    JOIN menu m on mg.idx = m.menuGroup_fk
                        WHERE highlight = 1
                    GROUP BY store_fk) mgm ON s.idx = mgm.store_fk
                LEFT OUTER JOIN (SELECT AVG(star) as avgStar, COUNT(*) as reviewNum, store_fk FROM review GROUP BY store_fk) rn
                    ON h.store_fk = rn.store_fk
                LEFT OUTER JOIN (SELECT COUNT(*) as bookmarkNum, store_fk FROM bookmark GROUP BY store_fk) bn
                    ON h.store_fk = bn.store_fk) s ON t.idx = s.storeIdx
                LEFT OUTER JOIN (SELECT store_fk, status FROM bookmark  b WHERE user_fk = ?) myBookmark
                    ON myBookmark.store_fk = s.storeIdx
        WHERE s.minOrderAmount <= ? AND s.tip <= ? AND s.avgStar >= ?
        ORDER BY ? DESC
        LIMIT ?,?;`;

    const [storeListRows] = await connection.query(query, params);

    console.log(storeListRows);
    return storeListRows;
}

module.exports = {
    selectStoreInfo,
    isExistStore,
    selectReviewNumAndStar,
    selectStoreBookmarkNum,
    selectMyBookmark,
    selectStoreList
};