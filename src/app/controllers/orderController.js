const tryCatch = require("modules/utils").connectionFunc;
const obj = require("modules/utils").responseObj;
const { logger } = require("config/winston");

const storeDao = require("../dao/storeDao");
const orderDao = require("../dao/orderDao");

exports.order = async function(req, res) {
    const { storeIdx, method, menu } = req.body;
    const userIdx = req.verifiedToken.idx;
    const mapMethod = {
        배달: "D",
        포장: "T"
    };

    if (!storeIdx || isNaN(storeIdx)) {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error: storeIdx를 Int형으로 입력해주세요."
            )
        );
    }

    if (!method || !(method == "배달" || method == "포장")) {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error: method에 (배달, 포장) 중 하나를 입력해주세요"
            )
        );
    }

    if (!menu || Array.isArray(menu.length)) {
        return res.json(
            obj(
                false,
                400,
                "Body Parameter Error: menu를 배열 형태로 입력해주세요"
            )
        );
    }

    await tryCatch(`Order`, async connection => {
        const isOrder = await storeDao.isOrderableStore([storeIdx], connection);

        if (!isOrder) {
            return res.json(obj(false, 401, "주문 가능한 식당이 아닙니다."));
        }

        for (const item of menu) {
            const { menuIdx, menuNum, optionIdxArray } = item;

            if (!menuIdx || isNaN(menuIdx)) {
                return res.json(
                    obj(
                        false,
                        400,
                        "Body Parameter Error: menuIdx를 Int 형으로 넣어주세요."
                    )
                );
            }

            const isExistMenu = await orderDao.isExistMenu(
                [menuIdx],
                connection
            );

            if (!isExistMenu) {
                return res.json(
                    obj(false, 402, "주문 가능한 메뉴가 아닙니다.")
                );
            }

            if (!menuNum || isNaN(menuNum) || menuNum < 1) {
                return res.json(
                    obj(
                        false,
                        400,
                        "Body Parameter Error: menuNum를 1 이상의 Int 형으로 넣어주세요."
                    )
                );
            }

            if (!optionIdxArray || !Array.isArray(optionIdxArray)) {
                return res.json(
                    obj(
                        false,
                        400,
                        "Body Parameter Error: optionIdxArray를 배열로 넣어주세요."
                    )
                );
            }

            for (const optionIdx of optionIdxArray) {
                const isExistOption = await orderDao.isExistOption(
                    [optionIdx],
                    connection
                );

                if (!isExistOption) {
                    return res.json(
                        obj(false, 402, "주문 가능한 옵션이 아닙니다.")
                    );
                }
            }

            try {
                await connection.beginTransaction();

                const insertOrderParams = [
                    userIdx,
                    storeIdx,
                    mapMethod[method]
                ];

                const insertOrderIdx = await orderDao.insertOrder(
                    insertOrderParams,
                    connection
                );

                const insertOrderMenuParams = [
                    menuIdx,
                    insertOrderIdx,
                    menuNum
                ];
                const insertOrderMenuIdx = await orderDao.insertOrderMenuIdx(
                    insertOrderMenuParams,
                    connection
                );

                for (const optionIdx of optionIdxArray) {
                    await orderDao.insertOrderOption(
                        [optionIdx, insertOrderMenuIdx],
                        connection
                    );
                }

                await connection.commit();
                return res.json({
                    result: {
                        orderIdx: insertOrderIdx,
                        status: "W"
                    },
                    ...obj(true, 200, "주문 성공")
                });
            } catch (err) {
                await connection.rollback();
                logger.error(`Transaction Error ${err}`);
                throw new Error(`Insert Order Error`);
            }
        }
    });
};
