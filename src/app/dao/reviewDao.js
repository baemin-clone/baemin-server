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

module.exports = {
    insertReview,
    insertReviewPhoto
};
