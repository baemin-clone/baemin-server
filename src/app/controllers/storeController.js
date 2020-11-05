const tryCatch = require("modules/utils").connectionFunc;

const obj = require("modules/utils").responseObj;
const store = require("../dao/storeDao");

exports.getStoreSummary = async function(req, res) {
    const storeIdx = req.params.idx;

    await tryCatch("Get Store Summary", async connection => {
        const isExist = await store.isExistStore([storeIdx], connection);

        if (!isExist) {
            return res.json(obj(false, 401, "존재하지않는 식당입니다."));
        }

        const storeInfoRows = await store.selectStoreInfo(
            [storeIdx],
            connection
        );
        const reviewNumAndStarRows = await store.selectReviewNumAndStar(
            [storeIdx],
            connection
        );
        const bookmarkNumRows = await store.selectStoreBookmarkNum(
            [storeIdx],
            connection
        );
        const isBookmark = await store.selectMyBookmark([storeIdx], connection);

        const { title, phone, orderAvailability } = storeInfoRows[0];

        let reviewNum = 0;
        let avgStar = 0;

        if (reviewNumAndStarRows.length > 0) {
            reviewNum = reviewNumAndStarRows[0].reviewNum;
            avgStar = reviewNumAndStarRows[0].avgStar;
        }

        let bookmarkNum = 0;

        if (bookmarkNumRows.length > 0) {
            bookmarkNum = bookmarkNumRows[0].bookmarkNum;
        }

        return res.json({
            result: {
                storeIdx: parseInt(storeIdx),
                title,
                star: avgStar,
                reviewNum,
                phone,
                bookmarkNum,
                isBookmark: isBookmark ? true : false,
                orderAvailability: orderAvailability ? true : false
            },
            ...obj(true, 200, "식당 정보 조회 성공")
        });
    });
};
