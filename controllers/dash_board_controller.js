const sequelize = require("../helpers/database");
const JWT = require("../helpers/jwt_helper");
const createError = require("http-errors");
require("dotenv").config();

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
            recentOrdersDescQuery, {
            replacements: { userId },
            transaction: t,
            type: sequelize.QueryTypes.SELECT
        }
        )

        await t.commit();

        res.send({
            "banner": banner,
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
        const bannersQuery = `SELECT * FROM "Banner";`;
        const trendingProductsquery = `SELECT * FROM "Product" ORDER BY id ASC LIMIT 10;`;
        const recentOrdersDescQuery = `SELECT * FROM "Cart" WHERE "userId" = :userId ORDER BY id DESC LIMIT 15`;


        const banners = await sequelize.query(bannersQuery, {
            transaction: t,
            type: sequelize.QueryTypes.SELECT
        });


        const trendingProducts = await sequelize.query(
            trendingProductsquery,
            {
                transaction: t,
                type: sequelize.QueryTypes.SELECT
            }
        );

        const recentOrders = await sequelize.query(
            recentOrdersDescQuery, {
            replacements: { userId },
            transaction: t,
            type: sequelize.QueryTypes.SELECT
        }
        )

        await t.commit();

        res.send({
            banners,
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

const createBannersRemote = async (req, res, next) => {
    // const t = await sequelize.transaction();
    try {
        const files = req.files; // Access the uploaded files
        if (!files || files.length === 0) {
            return res.status(400).send('No files uploaded');
        }

        const supabase = require("../helpers/supabase_client");

        let uploadedImages = [];


        for (const file of files) {
            const { data, error } = await supabase.storage.from(process.env.SUPABASE_BUCKET_NAME).upload(file.originalname, file.buffer, {
                contentType: file.mimetype,
                upsert: true, // Set to true if you want to overwrite files with the same name
            });

            if (error) {
                console.log(error);
                return next(createError.InternalServerError("Error in uploading files to Supabase"));
            }

            uploadedImages.push(`${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET_NAME}/${file.originalname}`);
        }

        // Create SQL values dynamically
        const values = uploadedImages
            .map((img) => `('${img}')`)
            .join(',');

        const query = `
            INSERT INTO "Banner" ("bannerUrl")
            VALUES ${values};
            `;
        await sequelize.query(query);

        res.send(uploadedImages);

    } catch (error) {

        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}

const removeABannerRemote = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { bannerId } = req.params;

        if (isNaN(Number(bannerId))) {
            return next(createError.BadRequest("Invalid Banner ID"));
        }

        const existingBanner = await sequelize.query(`
            SELECT "bannerUrl"
            FROM "Banner"
            WHERE id = :bannerId;
        `, {
            replacements: { bannerId },
            transaction: t,
            type: sequelize.QueryTypes.SELECT
        });

        if (!existingBanner) {
            return next(createError.NotFound("Banner not found"));
        }


        await sequelize.query(`
            DELETE FROM "Banner"
            WHERE id = :bannerId;
           
        `, {
            replacements: { bannerId },
            transaction: t,
            type: sequelize.QueryTypes.DELETE
        });

        const bannerUrlToDelete = existingBanner[0].bannerUrl;


        const supabase = require("../helpers/supabase_client");
        const imagePath = bannerUrlToDelete.split('/').pop(); // Extract the image path from the URL
        const { error } = await supabase.storage.from(process.env.SUPABASE_BUCKET_NAME).remove([imagePath]);

        if (error) {
            console.error('Error deleting image from Supabase:', error);
            return next(createError.InternalServerError("Error in deleting banner image from Supabase"));
        }

        await t.commit();
        res.send("Banner deleted successfully");

    } catch (error) {
        await t.rollback();
        console.log(error);

        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}




module.exports = { removeABannerRemote, createBannersRemote, adminDashBoardForSqlite, adminDashBoardForPostgres, userDashBoardsqlite, userDashBoardPostgres }

