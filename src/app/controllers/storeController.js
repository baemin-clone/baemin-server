const request = require("request-promise-native");

const tryCatch = require("modules/utils").connectionFunc;

const obj = require("modules/utils").responseObj;
const locationDao = require("../dao/locationDao");
const storeDao = require("../dao/storeDao");

const naverAccount = require("config/secret").naverAccount;
const INF = 123456789;

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

/**
 update : 2020.11.6
 10.Get Store list  API = 식당 리스트 조회 api
 */
exports.getStoreList = async function(req, res) {
    const userIdx = req.verifiedToken.idx;
    const orderBy = {
        기본순: "modifiedAt",
        주문많은순: "reviewNum",
        별점높은순: "avgStar",
        찜많은순: "bookmarkNum"
    };
    let { category, order, minAmount, tip, star, page, size } = req.query;

    if (!category) {
        return res.json(
            obj(false, 400, "Query Paramter Error: category를 지정해주세요!")
        );
    }

    if (
        !order ||
        !(
            order == "가까운순" ||
            order == "주문많은순" ||
            order == "별점높은순" ||
            order == "찜많은순"
        )
    ) {
        order = "기본순";
    }

    if (
        !minAmount ||
        !(
            minAmount == 5000 ||
            minAmount == 10000 ||
            minAmount == 12000 ||
            minAmount == 15000 ||
            minAmount == 20000
        )
    ) {
        minAmount = INF;
    }

    if (!tip || !(tip == 0 || tip == 1000 || tip == 2000 || tip == 3000)) {
        tip = INF;
    }

    if (!star || !(star == 3.5 || star == 4.0 || star == 4.5)) {
        star = 0;
    }

    if (page && isNaN(page)) {
        return res.json({
            isSuccess: false,
            code: 4,
            message: "Query String Error: page 타입이 알맞지 않습니다."
        });
    }

    if (size && isNaN(size)) {
        return res.json({
            isSuccess: false,
            code: 5,
            message: "Query String Error: size 타입이 알맞지 않습니다."
        });
    }

    if (!page) {
        page = 1;
    }
    if (!size) {
        size = 10;
    }

    page = (page - 1) * size;
    size = parseInt(page) + parseInt(size);

    await tryCatch("Get Store List", async connection => {
        const currentUserLocationArray = await locationDao.selectUserLocation(
            [userIdx, page, size],
            connection
        );
        const { longitude, latitude } = currentUserLocationArray[0];

        if (currentUserLocationArray.length < 1) {
            return res.json(obj(false, 400, "유저 위치를 먼저 지정해주세요"));
        }

        const storeListParams = [
            category,
            userIdx,
            minAmount,
            tip,
            star,
            orderBy[order],
            page,
            size
        ];

        const filteredStoreArray = await storeDao.selectStoreList(
            storeListParams,
            connection
        );

        const distanceArray = [];

        for (const item of filteredStoreArray) {
            const encodedUrl = encodeURI(item.address);
            const api_url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodedUrl}&coordinate=${longitude},${latitude}`;
            const options = {
                url: api_url,
                headers: {
                    "X-NCP-APIGW-API-KEY-ID": naverAccount.id,
                    "X-NCP-APIGW-API-KEY": naverAccount.secret
                }
            };

            const result = await request(options);
            const resultObj = JSON.parse(result);

            if (resultObj.addresses[0].distance) {
                distanceArray.push(resultObj.addresses[0].distance);
            } else {
                distanceArray.push(INF);
            }
        }

        const filteredStoreArrayByDistance = filteredStoreArray.filter(
            (store, idx) => {
                if (distanceArray[idx] > 3000) {
                    return true;
                }

                return false;
            }
        );

        const result = [];
        for (const item of filteredStoreArrayByDistance) {
            const {
                storeIdx,
                logo,
                title,
                avgStar,
                reviewNum,
                recommendation,
                deliveryTime,
                minOrderAmount,
                tip
            } = item;

            result.push({
                storeIdx,
                logo,
                title,
                avgStar,
                reviewNum: parseInt(reviewNum / 10) * 10 + "+",
                recommendation,
                deliveryTime: deliveryTime + "분",
                minOrderAmount: "최소주문" + minOrderAmount + "원",
                tip: "배달팁 " + tip + "원"
            });
        }

        return res.json({
            result,
            ...obj(true, 200, "음식점 리스트 조회 성공")
        });
    });
};
