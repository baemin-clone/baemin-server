async function insertReview(params, connection) {
    const query = `INSERT INTO review(description, star, store_fk, user_fk) VALUES (?,?,?,?);
    `;

    const [insertRow] = await connection.query(query, params);

    return insertRow.insertId;
}

async function insertReviewPhoto(params, connection) {
    const query = `INSERT INTO reviewPhoto(photoPath, review_fk) VALUES (?,?);`;

    await connection.query(query, params);
}

async function isExistRecentOrder(params, connection) {
    const query = `SELECT EXISTS(SELECT * FROM userOrder WHERE user_fk = ? AND store_fk = ? AND DATEDIFF(now(), createdAt) < 3) as isExistRecentOrder;`;
    const [isExistRecentOrder] = await connection.query(query, params);

    return isExistRecentOrder.isExistRecentOrder;
}

async function selectReviewInfo(params, connection) {
    const query = `SELECT r.idx as reviewIdx, r.star as star, r.description as description,
    CASE WHEN DATEDIFF(now(), r.modifiedAt) < 1 THEN '오늘'
         WHEN DATEDIFF(now(), r.modifiedAt) < 2 THEN '어제'
         WHEN DATEDIFF(now(), r.modifiedAt) < 3 THEN '그제'
         WHEN DATEDIFF(now(), r.modifiedAt) < 7 THEN '이번 주'
         WHEN DATEDIFF(now(), r.modifiedAt) < 14 THEN '저번 주'
         WHEN DATEDIFF(now(), r.modifiedAt) < 31 THEN '이번 달'
         WHEN DATEDIFF(now(), r.modifiedAt) < 60 THEN '저번 달'
             ELSE '오래됨'
     END as createdAt,
    IF(r.createdAt = r.modifiedAt, false, true) as isModified,
    u.idx as userIdx,  u.profilePath as userProfilePath,  u.nickname as userNickname FROM review r
 JOIN user u on r.user_fk = u.idx
WHERE store_fk =?;`;

    const [reviewRows] = await connection.query(query, params);

    return reviewRows;
}

async function selectReviewPhotos(params, connection) {
    const query = `SELECT photoPath FROM reviewPhoto WHERE review_fk =?;`;

    const [reviewPhotosRows] = await connection.query(query, params);

    return reviewPhotosRows;
}
module.exports = {
    insertReview,
    insertReviewPhoto,
    isExistRecentOrder,
    selectReviewInfo,
    selectReviewPhotos
};
