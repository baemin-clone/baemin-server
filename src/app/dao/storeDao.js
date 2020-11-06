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

module.exports = {
    selectStoreInfo,
    isExistStore,
    selectReviewNumAndStar,
    selectStoreBookmarkNum,
    selectMyBookmark
};
