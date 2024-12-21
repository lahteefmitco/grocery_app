const sequelize = require("../helpers/database");
const createError = require("http-errors");


const createProduct = async (req, res, next) => {
    try {
        var { productName, productDescription, price, image, stockQuantity, unit } = req.body;
        if (!productName || !price || !unit) {
            return next(createError.BadRequest("Please provide product name, price, and unit of the product"));
        }
        if (!productDescription) {
            productDescription = null;
        }
        if (!image) {
            image = null;
        }
        if (!stockQuantity) {
            stockQuantity = 0;
        }
        const [result, metadata] = await sequelize.query(`
            INSERT INTO "Product" ("productName", "productDescription", "price", "image", "stockQuantity", "unit")
            VALUES (:productName, :productDescription, :price, :image, :stockQuantity, :unit)
            RETURNING id;
        `,
            {
                replacements: { productName, productDescription, price, image, stockQuantity, unit },
            });

        console.log(result);

        const productId = result[0]["id"];

        res.status(201).send({ message: "Product created successfully", productId });



    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeUniqueConstraintError") {
            return next(createError.BadRequest("Unique constraint error, productName is already used"))
        }
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}


const listAllProducts = async (req, res, next) => {
    try {
        const isAvailable = req.query.isAvailable;
        console.log(isAvailable);

        var [products, metadata] = [];

        if (!isAvailable) {
            [products, metadata] = await sequelize.query(`
                SELECT * FROM "Product";
            `);
        } else {
            [products, metadata] = await sequelize.query(`
                SELECT * FROM "Product" WHERE "isAvailable" = ${isAvailable};
            `);
        }


        res.send(products);


    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}

const updateProductImage = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { image } = req.body;

        if (!image) {
            return next(createError.BadRequest("Please provide image url"));
        }

        await sequelize.query(`
            UPDATE "Product"
            SET image = :image
            WHERE id = :productId;
        `,
            {
                replacements: { image, productId },
            });

        res.send({ message: "Product image updated successfully" });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}


const getProductById = async (req, res, next) => {
    try {
        const { productId } = req.params;

        console.log(productId);

        if(!productId)  next(createError.BadRequest("Please provide product id"));


        // Check if the product exists
        const productQuery = `SELECT * FROM "Product" WHERE id = :productId`;
        const [product] = await sequelize.query(productQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.SELECT
        });

        if (!product) {
            return next(createError.NotFound("Product not found"));
        }

        res.send(product);

    } catch (error) {
        console.log(error);
        next(error);
    }
}


const updateProduct = async (req, res, next) => {
    try {


        const { productId } = req.params;

        // Check if the product exists
        const productExistsQuery = `SELECT id FROM "Product" WHERE id = :productId`;
        const [productExistsResult] = await sequelize.query(productExistsQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.SELECT
        });

        if (!productExistsResult) {
            return next(createError.NotFound(`Product with  ${productId} not found`));
        }

        var { productName, productDescription, price, image, stockQuantity, unit, isAvailable } = req.body;


        if (!productName || !price || !unit) {
            return next(createError.BadRequest("Please provide product name, price, and unit of the product"));
        }
        if (!productDescription) {
            productDescription = null;
        }
        if (!image) {
            image = null;
        }
        if (!stockQuantity) {
            stockQuantity = 0;
        }

        if (isAvailable === undefined) {
            return next(createError.BadRequest("Please provide isAvailable value of the product"));
        }



        await sequelize.query(`
            UPDATE "Product"
            SET productName = :productName, 
            productDescription = :productDescription,
            price = :price, 
            image = :image, 
            stockQuantity = :stockQuantity, 
            unit = :unit,
            isAvailable = :isAvailable
            WHERE id = :productId;
        `,
            {
                replacements: { productName, productDescription, price, image, stockQuantity, unit, isAvailable, productId },
            });

        res.send({ message: "Product is updated successfully" });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}


const updateProductAvailabilty = async (isAvailable, productId) => {
    try {


        if (isAvailable === undefined) {
            return createError.BadRequest("Please provide is available value");
        }

        await sequelize.query(`
            UPDATE "Product"
            SET isAvailable = :isAvailable
            WHERE id = :productId;
        `,
            {
                replacements: { isAvailable, productId },
            });

        return true;

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        createError.InternalServerError("Please provide stock quantity");
    }
}


const updateProductStockQuantity = async (stockQuantity, productId) => {
    try {


        if (!stockQuantity) {
            return createError.BadRequest("Please provide stock quantity");
        }

        await sequelize.query(`
            UPDATE "Product"
            SET stockQuantity = :stockQuantity
            WHERE id = :productId;
        `,
            {
                replacements: { stockQuantity, productId },
            });

        return true;

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        createError.InternalServerError("Please provide stock quantity");
    }
}


const deleteProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        // Check if the product exists
        const productExistsQuery = `SELECT id FROM "Product" WHERE id = :productId`;
        const [productExistsResult] = await sequelize.query(productExistsQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.SELECT
        });

        if (!productExistsResult) {
            return next(createError.NotFound(`Product with  ${productId} not found`));
        }

        const deleteQuery = `DELETE FROM "Product" WHERE id = :productId`;
        const [result, metadata] = await sequelize.query(deleteQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.DELETE
        });

        console.log(result);
        console.log(metadata);

        res.send({ message: "Product deleted successfully" });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}


const searchProduct = async (req, res, next) => {
    try {
        const { productName } = req.query;

        if (!productName) {
            return next(createError.BadRequest("Please provide a product name to search"));
        }

        const searchQuery = `
            SELECT * FROM "Product"
            WHERE productName ILIKE :productName
        `;

        const products = await sequelize.query(searchQuery, {
            replacements: { productName: `%${productName}%` },
            type: sequelize.QueryTypes.SELECT
        });

        // if (products.length === 0) {
        //     return next(createError.NotFound("No products found with the given name"));
        // }

        res.send(products);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}





module.exports = { createProduct, listAllProducts,updateProductImage, updateProduct, deleteProduct, searchProduct, updateProductAvailabilty, updateProductStockQuantity, getProductById };