function isNull(value) {
    return value === undefined || value === null || value === "" ? true : false;
}

module.exports = {
    isNull
};
