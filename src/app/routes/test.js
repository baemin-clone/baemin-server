const { pool } = require("config/database");

module.exports = function(app) {
    app.get("/users", async (req, res) => {
        const connection = await pool.getConnection(async conn => conn);

        try {
            const query = `SELECT * FROM user;`;
            const params = [];
            const [users] = await connection.query(query, params);

            res.json(users);
        } catch (err) {
            res.send(err);
        } finally {
            connection.release();
        }
    });
};
