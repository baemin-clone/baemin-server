const tryCatch = require("modules/utils").connectionFunc;

const obj = require("modules/utils").responseObj;
const storeDao = require("../dao/storeDao");

exports.getStoreSummary = async function(req, res) {
    const storeIdx = req.params.idx;

    await tryCatch("Get Store Summary", async connection => {
        const isExist = await storeDao.isExistStore([storeIdx], connection);

        if (!isExist) {
            return res.json(obj(false, 401, "존재하지않는 식당입니다."));
        }

        const storeInfoRows = await storeDao.selectStoreInfo(
            [storeIdx],
            connection
        );
        const reviewNumAndStarRows = await storeDao.selectReviewNumAndStar(
            [storeIdx],
            connection
        );
        const bookmarkNumRows = await storeDao.selectStoreBookmarkNum(
            [storeIdx],
            connection
        );
        const isBookmark = await storeDao.selectMyBookmark(
            [storeIdx],
            connection
        );

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

exports.getStoreDeliveryInfo = async function(req, res) {
    const storeIdx = req.params.idx;

    await tryCatch("Get Delivery Info", async connection => {
        const isExist = await storeDao.isExistStore([storeIdx], connection);

        if (!isExist) {
            return res.json(obj(false, 401, "존재하지않는 식당입니다."));
        }

        const storeInfoArray = await storeDao.selectStoreInfo(
            [storeIdx],
            connection
        );

        const {
            minOrderAmount,
            payment,
            deliveryTime,
            deliveryTip
        } = storeInfoArray[0];

        return res.json({
            result: {
                minOrderAmount: minOrderAmount + "원",
                payment,
                deliveryTime: deliveryTime + "분 소요 예상",
                deliveryTip: deliveryTip + "원"
            },
            ...obj(true, 200, "식당 배달 정보 조회 성공")
        });
    });
};

exports.getStoreTakeOutInfo = async function(req, res) {
    const storeIdx = req.params.idx;

    await tryCatch("Get Store Take out Info", async connection => {
        const isExist = await storeDao.isExistStore([storeIdx], connection);

        if (!isExist) {
            return res.json(obj(false, 401, "존재하지않는 식당입니다."));
        }

        const storeInfoArray = await storeDao.selectStoreInfo(
            [storeIdx],
            connection
        );

        const { address, longitude, latitude } = storeInfoArray[0];

        return res.json({
            result: {
                minOrderAmount: "없음",
                use: "포장",
                cookingTime: "12~22분 소요 예상",
                address,
                longitude: parseFloat(longitude),
                latitude: parseFloat(latitude),
                payment: "바로 결제"
            },
            ...obj(true, 200, "식당 포장 방문 정보 조회 성공")
        });
    });
};
