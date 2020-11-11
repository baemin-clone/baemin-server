const obj = require("modules/utils").responseObj;
const tryCatch = require("modules/utils").connectionFunc;
const reviewDao = require("../dao/reviewDao");
const { logger } = require("config/winston");

exports.writeReview = async function(req, res) {
    let { storeIdx, description, star } = req.body;
    const userIdx = req.verifiedToken.idx;

    if (!storeIdx || isNaN(storeIdx)) {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error: storeIdx를 int형으로 넣어주세요."
            )
        );
    }

    if (!description) {
        description = "";
    }

    if (!star || star < 1 || star > 5) {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error: star를 1 이상 5 이하로 넣어주세요"
            )
        );
    }

    await tryCatch(`Write review`, async connection => {
        const files = req.files;

        try {
            await connection.beginTransaction();

            const insertedReviewId = await reviewDao.insertReview(
                [description, star, storeIdx, userIdx],
                connection
            );

            if (files) {
                for (const file of files) {
                    await reviewDao.insertReviewPhoto(
                        [file.location, insertedReviewId],
                        connection
                    );
                }
            }

            await connection.commit();

            return res.json({
                reviewIdx: insertedReviewId,
                ...obj(true, 200, "리뷰 생성 성공")
            });
        } catch (err) {
            await connection.rollback();
            logger.error(`Write photo Path err${err}`);
            throw new Error("transaction Error");
        }
    });
};
