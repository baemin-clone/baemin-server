const { pool } = require("config/database");

const { upload } = require("modules/fileUpload");
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

    app.post("/upload", upload.single("img"), (req, res) => {
        try {
            console.log("req.file: ", req.file);

            let payload = { uri: req.file.location };
            res.json({
                payload
            });
        } catch (err) {
            console.log(err);
        }
    });
};
