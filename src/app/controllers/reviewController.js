const obj = require("modules/utils").responseObj;
const tryCatch = require("modules/utils").connectionFunc;
const reviewDao = require("../dao/reviewDao");
const storeDao = require("../dao/storeDao");
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

exports.getReviews = async function(req, res) {
    const { storeIdx } = req.params;
    const userIdx = req.verifiedToken.idx;

    if (isNaN(storeIdx)) {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error: storeIdx를 Int 형으로 입력해주세요"
            )
        );
    }

    await tryCatch("Get Reviews", async connection => {
        const isExist = await storeDao.isExistStore([storeIdx], connection);
        const reviews = [];
        if (!isExist) {
            return res.json(obj(false, 401, "존재하지않는 가게입니다."));
        }

        const isExistRecentOrder = await reviewDao.isExistRecentOrder(
            [userIdx, storeIdx],
            connection
        );

        const reviewArray = await reviewDao.selectReviewInfo(
            [storeIdx],
            connection
        );

        for (const item of reviewArray) {
            const reviewIdx = item.reviewIdx;

            const files = await reviewDao.selectReviewPhotos(
                [reviewIdx],
                connection
            );

            const filePath = [];

            for (const file of files) {
                filePath.push(file.photoPath);
            }

            reviews.push({
                ...item,
                reviewPhotoPath: filePath
            });
        }

        return res.json({
            result: {
                isWrite: isExistRecentOrder ? true : false,
                reviews
            },
            ...obj(true, 200, "리뷰 리스트 조회 성공")
        });
    });
};
