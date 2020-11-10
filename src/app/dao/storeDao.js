async function selectStoreInfo(params, connection) {
    const query = `SELECT idx, logo, title, minOrderAmount, deliveryTime, 
    deliveryTip, phoneNumber as phone, description, 
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

    return storeListRows;
}

async function selectStoreDescription(params, connection) {
    const query = `SELECT IFNULL(description, "") as description FROM store WHERE idx= ?;`;
    const [descriptionRows] = await connection.query(query, params);

    return descriptionRows;
}

async function selectMenuGroup(params, connection) {
    const query = `SELECT idx as menuGroupIdx, title, highlight FROM menuGroup WHERE store_fk = ? AND isDeleted =FALSE;`;
    const [menuGroupRows] = await connection.query(query, params);

    return menuGroupRows;
}

async function selectMenuInfo(params, connection) {
    const query = `SELECT idx as menuIdx, title as menuTitle, IFNULL(description, '') as menuDescription, price, IFNULL(photoPath,'') as photoPath, IFNULL(details, '') as details FROM menu WHERE menuGroup_fk = ?;`;
    const [menuInfoRows] = await connection.query(query, params);

    return menuInfoRows;
}

async function selectMenuInfoByIdx(params, connection) {
    const query = `SELECT idx as menuIdx, title as menuTitle, IFNULL(description, '') as menuDescription, price, IFNULL(photoPath,'') as photoPath, IFNULL(details, '') as details, basicPrice FROM menu WHERE idx = ?;`;
    const [menuInfoRows] = await connection.query(query, params);

    return menuInfoRows;
}

async function selectOptionGroup(params, connection) {
    const query = `SELECT idx, title, isRequired FROM optionGroup WHERE menu_fk = ?;`;
    const [optionGroupRows] = await connection.query(query, params);

    return optionGroupRows;
}

async function selectOptionGroupByIdx(params, connection) {
    const query = `SELECT idx, title, isRequired FROM optionGroup WHERE idx = ?;`;
    const [optionGroupRow] = await connection.query(query, params);
    return optionGroupRow;
}

async function selectOptions(params, connection) {
    const query = `SELECT idx as optionIdx, title, price  FROM menuOption WHERE optionGroup_fk = ?;`;
    const [optionRows] = await connection.query(query, params);

    return optionRows;
}
async function selectOptionByIdx(params, connection) {
    const query = `SELECT idx as optionIdx, title, price  FROM menuOption WHERE idx= ?;`;
    const [optionRow] = await connection.query(query, params);

    return optionRow;
}

async function isOrderableStore(params, connection) {
    const query = `SELECT EXISTS(SELECT * FROM store WHERE isDeleted = FALSE AND idx = ? AND orderAvailability = TRUE) as exist;`;
    const [isOrderRows] = await connection.query(query, params);

    return isOrderRows[0].exist;
}

async function selectStoreDetails(params, connection) {
    const query = `SELECT description2 as description, guide, operatingTime, closedDay as closedDays, phoneNumber as phone, deliveryZone,
    IFNULL(recentOrderNum, 0) as recentOrderNum,
     IFNULL(reviewNum, 0) as reviewNum,
    IFNULL(bookmarkNum, 0) as bookmarkNum
FROM store s
 LEFT OUTER JOIN (
     SELECT COUNT(*) as recentOrderNum, store_fk FROM userOrder WHERE store_fk = ? AND DATEDIFF(now(), createdAt) < 3 GROUP BY store_fk
 ) recentOrderTable ON s.idx = recentOrderTable.store_fk
 LEFT OUTER JOIN (
     SELECT COUNT(*) as reviewNum, store_fk FROM review WHERE store_fk = ? AND isDeleted = FALSE GROUP BY store_fk
 ) reviewNumTable On s.idx = reviewNumTable.store_fk
 LEFT OUTER JOIN (
     SELECT COUNT(*) as bookmarkNum, store_fk FROM bookmark WHERE store_fk = ? AND status = 'Y' GROUP BY store_fk
 ) bookmarkNumTable On s.idx = bookmarkNumTable.store_fk
WHERE idx=?;`;
    const [storeDetailsRows] = await connection.query(query, params);

    return storeDetailsRows;
}

async function selectBrand(connection) {
    const query = `SELECT idx as brandIdx, logo, title, description, coupon, newMenu, notice FROM brand;`;
    const [brandRows] = await connection.query(query);

    return brandRows;
}

async function selectFilteredStore(params, connection) {
    const query = `SELECT logo, title, deliveryTime, store_fk as storeIdx FROM store s
    JOIN hashtag h on s.idx = h.store_fk
WHERE tag LIKE CONCAT('%',?,'%');`;

    const [storeRows] = await connection.query(query, params);

    return storeRows;
}

async function selectMainMenu(params, connection) {
    const query = `SELECT m.title as title FROM menuGroup JOIN menu m on menuGroup.idx = m.menuGroup_fk
                    WHERE store_fk = ? AND highlight = TRUE
                    LIMIT 3;`;
    const [mainMenu] = await connection.query(query, params);

    return mainMenu;
}

module.exports = {
    selectStoreInfo,
    isExistStore,
    selectReviewNumAndStar,
    selectStoreBookmarkNum,
    selectMyBookmark,
    selectStoreList,
    selectStoreDescription,
    selectMenuGroup,
    selectMenuInfo,
    selectOptionGroup,
    selectOptions,
    selectMenuInfoByIdx,
    isOrderableStore,
    selectStoreDetails,
    selectBrand,
    selectFilteredStore,
    selectMainMenu,
    selectOptionGroupByIdx,
    selectOptionByIdx
};
