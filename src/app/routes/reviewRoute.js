module.exports = function(app) {
    const jwtMiddleware = require("config/jwtMiddleware");
    const review = require("../controllers/reviewController");
    const { reviewUpload } = require("modules/fileUpload");

    app.route("/review").post(
        jwtMiddleware,
        reviewUpload.array("img", 4),
        review.writeReview
    );
};
