const { pool } = require("../../../config/database");

// index
async function defaulDao() {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectEmailQuery = `
                    SELECT id, email, nickname, createdAt, updatedAt 
                    FROM UserInfo `;

  const [rows] = await connection.query(selectEmailQuery)
  connection.release();

  return rows;
}

module.exports = {
  defaultDao,
};
