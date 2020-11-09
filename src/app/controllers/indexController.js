const { pool } = require("config/database");
const { logger } = require("config/winston");

const indexDao = require("dao/indexDao");

exports.default = async function(req, res) {
    res.send("hello");
};
