const sequelize = require("../helpers/database");
const JWT = require("../helpers/jwt_helper");
const createError = require("http-errors");

const mode = process.env.NODE_ENV || "development";

const adminDashBoardForSqlite = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const usersCountQuery = `SELECT COUNT(*) AS userCount FROM "User";`;
        const productCountQuery = `SELECT COUNT(*) AS productCount FROM "Product";`;
        const stockOutProductCountQuery = `SELECT COUNT(*) AS productCount FROM "Product" WHERE "stockQuantity" = 0;`;
        const trendingProductsquery = `SELECT * FROM "Product" ORDER BY id ASC LIMIT 10;`;
        const allOrdersDescQuery = `SELECT * FROM "Cart" ORDER BY id DESC LIMIT 15`

        const [userCount, usersMetada] = await sequelize.query(
            usersCountQuery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );
        console.log(userCount.userCount);

        const [productCount, productCountMetaData] = await sequelize.query(
            productCountQuery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );
        console.log(productCount.productCount);

        const [stockOutProductCount, stockOutProductCountMetadata] = await sequelize.query(
            stockOutProductCountQuery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );
        console.log(stockOutProductCount.productCount);

        const trendingProducts = await sequelize.query(
            trendingProductsquery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );

        console.log(trendingProducts);


        const allOrders = await sequelize.query(
            allOrdersDescQuery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );

        console.log(allOrders);






        await t.commit();
        res.send({
            usersCount: userCount.userCount,
            productCount: productCount.productCount,
            stockOutProductCount: stockOutProductCount.productCount,
            trendingProducts: trendingProducts,
            allOrders: allOrders
        });





    } catch (error) {
        await t.rollback();
        console.log(error);
        
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}


const adminDashBoardForPostgres = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const usersCountQuery = `SELECT COUNT(*) AS userCount FROM "User";`;
        const productCountQuery = `SELECT COUNT(*) AS productCount FROM "Product";`;
        const stockOutProductCountQuery = `SELECT COUNT(*) AS productCount FROM "Product" WHERE "stockQuantity" = 0;`;
        const trendingProductsquery = `SELECT * FROM "Product" ORDER BY id ASC LIMIT 10;`;
        const allOrdersDescQuery = `SELECT * FROM "Cart" ORDER BY id DESC LIMIT 15`

        const [userCount, usersMetada] = await sequelize.query(
            usersCountQuery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );
        // console.log(userCount.usercount);

        const [productCount, productCountMetaData] = await sequelize.query(
            productCountQuery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );
        // console.log(productCount[0].productCount);

        const [stockOutProductCount, stockOutProductCountMetadata] = await sequelize.query(
            stockOutProductCountQuery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );
        //console.log(stockOutProductCount[0].productCount);

        const trendingProducts = await sequelize.query(
            trendingProductsquery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );

        console.log(trendingProducts);


        const allOrders = await sequelize.query(
            allOrdersDescQuery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );

        console.log(allOrders);






        await t.commit();
        res.send({
            usersCount: userCount.usercount,
            productCount: productCount.productcount,
            stockOutProductCount: stockOutProductCount.productcount,
            trendingProducts: trendingProducts,
            allOrders: allOrders
        });





    } catch (error) {
        await t.rollback();
        console.log(error);
        
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}

const userDashBoardsqlite = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.payload.userId;
        const banner = "/banner/banner.jpg";
        const trendingProductsquery = `SELECT * FROM "Product" ORDER BY id ASC LIMIT 10;`;
        const recentOrdersDescQuery = `SELECT * FROM "Cart" WHERE "userId" = :userId ORDER BY id DESC LIMIT 15`;


        const trendingProducts = await sequelize.query(
            trendingProductsquery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );

        const recentOrders = await sequelize.query(
            recentOrdersDescQuery,{
                replacements:{userId},
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        )

        await t.commit();

        res.send({
            "banner":banner,
            trendingProducts,
            recentOrders
        })



    } catch (error) {
        console.log(error);
        await t.rollback();
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }

}

const userDashBoardPostgres = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.payload.userId;
        const banner = "https://qscihnogyuzgcmmqmans.supabase.co/storage/v1/object/public/grocery/banner.jpg";
        const trendingProductsquery = `SELECT * FROM "Product" ORDER BY id ASC LIMIT 10;`;
        const recentOrdersDescQuery = `SELECT * FROM "Cart" WHERE "userId" = :userId ORDER BY id DESC LIMIT 15`;


        const trendingProducts = await sequelize.query(
            trendingProductsquery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );

        const recentOrders = await sequelize.query(
            recentOrdersDescQuery,{
                replacements:{userId},
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        )

        await t.commit();

        res.send({
            "banner":banner,
            trendingProducts,
            recentOrders
        })



    } catch (error) {
        await t.rollback();
        console.log(error);

        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }

}




module.exports = { adminDashBoardForSqlite, adminDashBoardForPostgres, userDashBoardsqlite,userDashBoardPostgres}