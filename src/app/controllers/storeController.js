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
            [userIdx, 0, 1],
            connection
        );

        if (currentUserLocationArray.length < 1) {
            return res.json(obj(false, 400, "유저 위치를 먼저 지정해주세요"));
        }

        const { longitude, latitude } = currentUserLocationArray[0];

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
                deliveryTime: deliveryTime,
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

/**
 update : 2020.11.8
 14.Get Menu List  API = 식당 리스트 조회 api
 */
exports.getMenuList = async function(req, res) {
    const storeIdx = req.params.idx;

    if (!storeIdx) {
        return res.json(
            obj(
                false,
                400,
                "Path Parameter Error: storeIdx가 존재하지않습니다."
            )
        );
    }

    if (isNaN(storeIdx)) {
        return res.json(
            obj(
                false,
                400,
                "Path Parameter Error: storeIdx에 숫자를 입력해주세요."
            )
        );
    }

    await tryCatch(`Get Menu List Error`, async connection => {
        const menuList = [];

        const isExist = await storeDao.isExistStore([storeIdx], connection);

        if (!isExist) {
            return res.json(obj(false, 401, "존재하지않는 식당입니다."));
        }

        const descriptionArray = await storeDao.selectStoreDescription(
            [storeIdx],
            connection
        );

        const menuGroupArray = await storeDao.selectMenuGroup(
            [storeIdx],
            connection
        );

        for (const item of menuGroupArray) {
            const menuArray = await storeDao.selectMenuInfo(
                [item.menuGroupIdx],
                connection
            );
            const menuInfo = {
                menuCategory: item.title,
                highlight: item.highlight ? true : false,
                contents: menuArray
            };

            menuList.push(menuInfo);
        }

        return res.json({
            result: {
                description: descriptionArray[0].description,
                menu: menuList
            },
            ...obj(true, 200, "메뉴 리스트 조회 성공")
        });
    });
};

/**
 update : 2020.11.8
 15.Get Menu Options  API = 메뉴 옵션 조회 api
 */
exports.getMenuOptions = async function(req, res) {
    const options = [];
    const idx = req.params.idx;

    if (isNaN(idx)) {
        return res.json(
            obj(
                false,
                400,
                "Path Parameter Error: menu-idx에 숫자를 입력해주세요."
            )
        );
    }

    await tryCatch(`Get Menu Options Api`, async connection => {
        const menuInfoArray = await storeDao.selectMenuInfoByIdx(
            [idx],
            connection
        );

        if (menuInfoArray.length < 1) {
            return res.json(obj(false, 401, "존재하지않는 메뉴입니다."));
        }

        const optionGroupArray = await storeDao.selectOptionGroup(
            [idx],
            connection
        );

        for (const item of optionGroupArray) {
            const optionsArray = await storeDao.selectOptions(
                [item.idx],
                connection
            );

            const resultObj = {
                optionGroupIdx: item.idx,
                groupTitle: item.title,
                required: item.isRequired ? true : false,
                contents: optionsArray
            };

            options.push(resultObj);
        }

        return res.json({
            result: {
                basicPrice: menuInfoArray[0].basicPrice,
                photoPath: menuInfoArray[0].photoPath,
                menuTitle: menuInfoArray[0].menuTitle,
                details: menuInfoArray[0].details,
                options
            },
            ...obj(true, 200, "옵션 리스트 조회 성공")
        });
    });
};

/**
 update : 2020.11.8
 21.Get Store Details  API = 가게 상세정보 조회
 */
exports.getStoreDetails = async function(req, res) {
    const storeIdx = req.params.storeIdx;

    if (isNaN(storeIdx)) {
        return res.json(
            obj(
                false,
                400,
                "Path Parameter Error : storeIdx를 Int 형으로 넣어주세요."
            )
        );
    }

    await tryCatch("Get Store Details", async connection => {
        const isExist = await storeDao.isExistStore([storeIdx], connection);

        if (!isExist) {
            return res.json(obj(false, 401, "존재하지않는 가게입니다."));
        }

        const storeDetailsArray = await storeDao.selectStoreDetails(
            [storeIdx, storeIdx, storeIdx, storeIdx],
            connection
        );

        const {
            description,
            guide,
            recentOrderNum,
            reviewNum,
            bookmarkNum,
            operatingTime,
            closedDays,
            phone,
            deliveryZone
        } = storeDetailsArray[0];

        return res.json({
            result: {
                description,
                guide,
                statistics: {
                    recentOrderNum: parseInt(recentOrderNum / 10) * 10 + "+",
                    reviewNum,
                    bookmarkNum
                },
                info: {
                    operatingTime,
                    closedDays,
                    phone,
                    deliveryZone
                },
                ...obj(true, 200, "가게 상세정보 조회 성공")
            }
        });
    });
};

exports.getBrand = async function(req, res) {
    await tryCatch(`Get Brand`, async connection => {
        const brandArray = await storeDao.selectBrand(connection);
        return res.json({
            result: brandArray,
            ...obj(true, 200, "브랜드관 조회 성공")
        });
    });
};

exports.getFilteredStore = async function(req, res) {
    const { tag } = req.query;
    const result = [];

    if (!tag) {
        return res.json(
            obj(
                false,
                400,
                "Query Parameter Error: 쿼리 파라미터를 넣어주세요."
            )
        );
    }

    await tryCatch(`Get filtered Store`, async connection => {
        const storeArray = await storeDao.selectFilteredStore(
            [tag],
            connection
        );

        for (const item of storeArray) {
            const mainMenuToString = [];
            const mainMenu = await storeDao.selectMainMenu(
                [item.storeIdx],
                connection
            );

            for (const menu of mainMenu) {
                mainMenuToString.push(menu.title);
            }

            result.push({
                ...item,
                mainMenu: mainMenuToString.join()
            });
        }

        return res.json({
            result,
            ...obj(true, 200, "추천 식당 조회 성공")
        });
    });
};

exports.getStoreTitle = async function(req, res) {
    const storeIdx = req.params.storeIdx;

    if (isNaN(storeIdx)) {
        return res.json(
            obj(false, 400, "Path Variable Error: storeIdx가 int형이 아닙니다.")
        );
    }
    await tryCatch(`Get Store Title`, async connection => {
        const isExist = await storeDao.isExistStore([storeIdx], connection);

        if (!isExist) {
            return res.json(obj(false, 401, "존재하지않는 식당입니다"));
        }

        const storeInfoArray = await storeDao.selectStoreInfo(
            [storeIdx],
            connection
        );

        return res.json({
            storeTitle: storeInfoArray[0].title,
            ...obj(true, 200, "가게 이름 조회 성공")
        });
    });
};

exports.getBasketMenu = async function(req, res) {
    const { storeIdx, menuIdx, optionArray } = req.body;

    if (!storeIdx || isNaN(storeIdx)) {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error: storeIdx를 Int 형으로 넣어주세요."
            )
        );
    }

    if (!menuIdx || isNaN(menuIdx)) {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error: menuIdx를 Int 형으로 넣어주세요."
            )
        );
    }

    if (!optionArray || !Array.isArray(optionArray)) {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error: optionArray를 Array로 넣어주세요."
            )
        );
    }

    await tryCatch(`Get Basket Menu`, async connection => {
        const isExist = await storeDao.isExistStore([storeIdx], connection);

        if (!isExist) {
            return res.json(obj(false, 401, "존재하지않는 식당입니다"));
        }

        const menuInfoArray = await storeDao.selectMenuInfoByIdx(
            [menuIdx],
            connection
        );

        const { basicPrice, menuTitle } = menuInfoArray[0];

        const resultArray = [`기본 : ${menuTitle}`];
        let totalPrice = basicPrice;

        for (const item of optionArray) {
            if (!item.optionGroupIdx || isNaN(item.optionGroupIdx)) {
                return res.json(
                    obj(
                        false,
                        400,
                        "Body Parameter Error: OptionGroupIdx를 Int 형으로 넣어주세요."
                    )
                );
            }
            const optionGroupArray = await storeDao.selectOptionGroupByIdx(
                [item.optionGroupIdx],
                connection
            );

            if (optionGroupArray.length < 1) {
                return res.json(obj(false, 402, "선택할 수 없는 옵션입니다."));
            }

            let tempString = `${optionGroupArray[0].title} : `;
            if (!item.options || !Array.isArray(item.options)) {
                return res.json(
                    obj(
                        false,
                        400,
                        "Body Parameter Error: options를 Array 형태로 넣어주세요."
                    )
                );
            }

            const buffer = [];

            for (const optionIdx of item.options) {
                if (isNaN(optionIdx)) {
                    return res.json(
                        obj(false, 400, "optionIdx를 Int 형으로 넣어주세요.")
                    );
                }

                const optionArray = await storeDao.selectOptionByIdx(
                    [optionIdx],
                    connection
                );

                if (optionArray.length < 1) {
                    return res.json(
                        obj(false, 402, "선택할 수 없는 옵션입니다.")
                    );
                }

                const { title, price } = optionArray[0];

                buffer.push(`${title}${price == 0 ? "" : `(${price}원)`}`);
                totalPrice += price;
            }

            tempString += buffer.join(" / ");
            resultArray.push(tempString);
        }

        return res.json({
            result: {
                menuTitle,
                price: totalPrice,
                options: resultArray
            },
            ...obj(true, 200, "장바구니 메뉴 정보 조회 성공")
        });
    });
};

exports.searchStore = async function(req, res) {
    const userIdx = req.verifiedToken.idx;

    let { keyword, order, minAmount, tip, star, page, size } = req.query;

    const orderBy = {
        기본순: "modifiedAt",
        주문많은순: "reviewNum",
        별점높은순: "avgStar",
        찜많은순: "bookmarkNum"
    };

    if (!keyword) {
        return res.json(
            obj(false, 400, "Query Parameter Error : keyword를 입력해주세요.")
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
            [userIdx, 0, 1],
            connection
        );

        if (currentUserLocationArray.length < 1) {
            return res.json(obj(false, 400, "유저 위치를 먼저 지정해주세요"));
        }

        const { longitude, latitude } = currentUserLocationArray[0];

        const storeListParams = [
            userIdx,
            minAmount,
            tip,
            star,
            keyword,
            keyword,
            orderBy[order],
            page,
            size
        ];

        const filteredStoreArray = await storeDao.selectStoreByKeyword(
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
                deliveryTime: deliveryTime,
                minOrderAmount: "최소주문" + minOrderAmount + "원",
                tip: "배달팁 " + tip + "원"
            });
        }

        return res.json({
            result,
            ...obj(true, 200, "음식점 리스트 검색 조회 성공")
        });
    });
};
