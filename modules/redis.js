const redis = require("redis");
const client = redis.createClient();
client.on("error", function(err) {
    console.log("Error " + err);
});

function save(key, value) {
    client.set(key, value, redis.print);
    client.expire(key, 300);
}

const get = function(key) {
    return new Promise((resolve, reject) => {
        client.get(key, (err, reply) => {
            if (err) {
                red.reply = null;
                reject(err);
            }

            resolve(reply);
        });
    });
};

module.exports = {
    save,
    get
};
