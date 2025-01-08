const sequelize = require("../helpers/database");
const createError = require("http-errors");



const fs = require('fs');
const path = require('path');

require("dotenv").config();

const mode = process.env.NODE_ENV || "development";





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
        let productId = 0;

        // production
        if (mode == "production") {
            const [result, metadata] = await sequelize.query(`
            INSERT INTO "Product" ("productName", "productDescription", "price", "image", "stockQuantity", "unit")
            VALUES (:productName, :productDescription, :price, :image, :stockQuantity, :unit)
            RETURNING id;
            `,
                {
                    replacements: { productName, productDescription, price, image, stockQuantity, unit },
                });

            

            productId = result[0]["id"];
        } else {
             await sequelize.query(`
                INSERT INTO "Product" ("productName", "productDescription", "price", "image", "stockQuantity", "unit")
                VALUES (:productName, :productDescription, :price, :image, :stockQuantity, :unit);
                `,
                {
                    replacements: { productName, productDescription, price, image, stockQuantity, unit },
                });

                // Get the ID of the last inserted row
                const [result] = await sequelize.query(`
                SELECT last_insert_rowid() AS id;
                `, 
                {
                    type: sequelize.QueryTypes.SELECT
                });

                productId = result.id;

        }

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


const listAllAvailableProducts = async (req, res, next) => {
    try {
        // Query to get all available products
        const productQuery = `
            SELECT * FROM "Product"
            WHERE "isAvailable" = true
        `;

        const products = await sequelize.query(productQuery, {
            type: sequelize.QueryTypes.SELECT
        });

        res.send(products);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.BadRequest(`Error in listing available products: ${error.message}`));
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
        const supabase = require("../helpers/supabase_client");
        const { productId } = req.params;

        if (isNaN(Number(productId))) {
            return next(createError.BadRequest("Please provide a valid product id"));
        }

        // Check if the product exists
        const productQuery = `SELECT * FROM "Product" WHERE id = :productId`;
        const [product] = await sequelize.query(productQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.SELECT
        });

        console.log(product);




        if (!product) {
            return next(createError.NotFound(`Product not found with the given id ${productId}`));
        }


        const file = req.file;

        if (!file) {
            return res.status(400).send('No image uploaded');
        }

        console.log(file.originalname);

        const fileName = `${Date.now()}_${file.originalname}`;


        // Delete existing image from Supabase if it exists
        if (product.image) {
            const imagePath = product.image.split('/').pop(); // Extract the image path from the URL
            const { error: deleteError } = await supabase.storage.from(process.env.SUPABASE_BUCKET_NAME).remove([imagePath]);

            if (deleteError) {
                console.error('Error deleting image from Supabase:', deleteError);
                return next(createError.InternalServerError('Error deleting existing image'));
            }
        }// Generate a unique filename

        console.log("Supabase");
        

        // Upload the file buffer directly to Supabase
        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET_NAME)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false, // Set to true if you want to overwrite files with the same name
            });

        if (error) throw error;

        console.log("passed");
        


        const image = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET_NAME}/${fileName}`;

        await sequelize.query(`
            UPDATE "Product"
            SET image = :image
            WHERE id = :productId;
        `,
            {
                replacements: { image, productId },
            });

        console.log(image);


        res.send({ message: "Product image updated successfully", image });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}

const uploadImageToLocalFile = async (req, res, next) => {
    try {
        const { productId } = req.params;

        if (isNaN(Number(productId))) {
            return next(createError.BadRequest("Please provide a valid product id"));
        }

        // Check if the product exists
        const productQuery = `SELECT * FROM "Product" WHERE id = :productId`;
        const [product] = await sequelize.query(productQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.SELECT
        });

        console.log(product);




        if (!product) {
            return next(createError.NotFound(`Product not found with the given id ${productId}`));
        }


        const file = req.file;

        if (!file) {
            return res.status(400).send('No image uploaded');
        }

        // Delete existing image from Local if it exists
        if (product.image) {
            const imagePath = product.image;
            fs.unlinkSync(path.join(__dirname, '..', 'images', imagePath));
        }


        const image = file.filename;

        await sequelize.query(`
            UPDATE "Product"
            SET image = :image
            WHERE id = :productId;
        `,
            {
                replacements: { image, productId },
            });

        console.log(image);


        res.send({ message: "Product image updated successfully", image });
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

        if (!productId) next(createError.BadRequest("Please provide product id"));


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
        const productExistsQuery = `SELECT id, image FROM "Product" WHERE id = :productId`;
        const [productExistsResult] = await sequelize.query(productExistsQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.SELECT
        });

        if (!productExistsResult) {
            return next(createError.NotFound(`Product with  ${productId} not found`));
        }

        console.log(`Product exist result ${productExistsResult}`);
        

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
            isAvailable = false;
        }

        if (isAvailable === undefined) {
            return next(createError.BadRequest("Please provide isAvailable value of the product"));
        }

        if (isNaN(Number(price))) {
            return next(createError.BadRequest("Please provide a valid price"));
        }

        if (isNaN(Number(stockQuantity)) || stockQuantity < 0) {
            return next(createError.BadRequest("Please provide a valid stock quantity"));
        }

        if (stockQuantity === 0) {
            isAvailable = false;
        }



        await sequelize.query(`
            UPDATE "Product"
            SET "productName" = :productName, 
            "productDescription" = :productDescription,
            price = :price, 
            image = :image, 
            "stockQuantity" = :stockQuantity, 
            unit = :unit,
            "isAvailable" = :isAvailable
            WHERE id = :productId;
        `,
            {
                replacements: { productName, productDescription, price, image, stockQuantity, unit, isAvailable, productId },
            });

            if(image ===null && productExistsResult.image){
                removeProductImage(productExistsResult.image);
            }

        

        res.send({ message: "Product is updated successfully" });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        next(error)
    }
}


const updateProductPrice = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { price } = req.body;



        // Validate the input
        if (!productId || isNaN(Number(productId))) {
            return next(createError.BadRequest("Please provide a valid product ID"));
        }

        if (price === undefined || isNaN(Number(price))) {
            return next(createError.BadRequest("Please provide a valid price"));
        }

        if (price <= 0) {
            return next(createError.BadRequest("Price should be greater than 0"));
        }

        // Update the product price
        await sequelize.query(`
            UPDATE "Product"
            SET price = :price
            WHERE id = :productId;
        `, {
            replacements: { price, productId },
        });

        res.send({ message: "Product price updated successfully" });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError(`Database problem, please contact with developer ${error.message}`));
        }

        next(createError.BadRequest(`Error in updating product price: ${error.message}`));
    }
}





const updateProductAvailability = async (req, res, next) => {
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

        const { isAvailable } = req.body;


        if (isAvailable === undefined) {
            return createError.BadRequest("Please provide is available value");
        }

        await sequelize.query(`
            UPDATE "Product"
            SET "isAvailable" = :isAvailable
            WHERE id = :productId;
        `,
            {
                replacements: { isAvailable, productId },
            });

        res.send({ message: "Product availability updated successfully" });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        createError.InternalServerError("Please provide stock quantity");
    }
}


const updateProductStockQuantity = async (req, res, next) => {
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



        const { stockQuantity } = req.body;

        if (stockQuantity === undefined) {
            return next(createError.BadRequest("Please provide stock quantity"));
        }

        if (isNaN(Number(stockQuantity))) {
            return next(createError.BadRequest("Please provide a valid stock quantity"));
        }

        if (stockQuantity <= 0) {
            return next(createError.BadRequest("Stock quantity should be greater than 0"));
        }


        if (!stockQuantity) {
            return createError.BadRequest("Please provide stock quantity");
        }

        await sequelize.query(`
            UPDATE "Product"
            SET "stockQuantity" = :stockQuantity
            WHERE id = :productId;
        `,
            {
                replacements: { stockQuantity, productId },
            });

        res.send({ message: "Stock quantity updated successfully" });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError(`Database problem, please contact with developer ${error.message}`))
        }

        createError.InternalServerError("Please provide stock quantity");
    }
}


const deleteProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        // Check if the product exists
        const productExistsQuery = `SELECT id, image FROM "Product" WHERE id = :productId`;
        const [productExistsResult] = await sequelize.query(productExistsQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.SELECT
        });

        if (!productExistsResult) {
            return next(createError.NotFound(`Product with  ${productId} not found`));
        }

        const deleteQuery = `DELETE FROM "Product" WHERE id = :productId`;
        await sequelize.query(deleteQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.DELETE
        });

        console.log("product exists image");

        console.log(productExistsResult.image);


        if (productExistsResult.image) {

            const imageDeleteResult = removeProductImage(productExistsResult.image);
            if (imageDeleteResult === false) {
                return next(createError.InternalServerError("Error deleting image from Supabase or Local"));
            }
        }

        

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

        let searchQuery =  "";

        if(mode === "production"){
            searchQuery = `
            SELECT * FROM "Product"
            WHERE "productName" ILIKE :productName
        `;
        }else{
            searchQuery = `
             SELECT * FROM "Product"
            WHERE LOWER("productName") LIKE LOWER(:productName)
            `;
        }
          

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


const deleteProductImage = async (req, res, next) => {
    try {
        const { productId } = req.params;

        if (isNaN(Number(productId))) {
            return next(createError.BadRequest("Please provide a valid product id"));
        }

        // Check if the product exists
        const productQuery = `SELECT * FROM "Product" WHERE id = :productId`;
        const [product] = await sequelize.query(productQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.SELECT
        });

        if (!product) {
            return next(createError.NotFound(`Product not found with the given id ${productId}`));
        }

        // Check if the product has an image
        if (!product.image) {
            return next(createError.BadRequest("No image found for the given product"));
        }



        const imageDeleteResult = removeProductImage(product.image);

        if (imageDeleteResult === false) {
            return next(createError.InternalServerError("Error deleting image from Supabase or Local"));
        }

        // Update the product record to remove the image URL
        const updateProductQuery = `
            UPDATE "Product"
            SET image = NULL
            WHERE id = :productId
        `;

        await sequelize.query(updateProductQuery, {
            replacements: { productId },
            type: sequelize.QueryTypes.UPDATE
        });

        res.send({ message: 'Product image deleted successfully' });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.BadRequest(`Error in deleting product image: ${error.message}`));
    }
}



const getProductInventory = async (req, res, next) => {
    try {


        // Query to get the product inventory
        const productQuery = `
            SELECT id, "productName", "stockQuantity", "isAvailable"
            FROM "Product"
        `;

        const products = await sequelize.query(productQuery, {
            type: sequelize.QueryTypes.SELECT
        });

        res.send(products);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.BadRequest(`Error in getting product inventory: ${error.message}`));
    }
}









module.exports = { createProduct, listAllAvailableProducts, listAllProducts, updateProductImage, updateProduct, deleteProduct, searchProduct, updateProductAvailability, updateProductStockQuantity, getProductById, deleteProductImage, uploadImageToLocalFile, updateProductPrice, getProductInventory };

const removeProductImage = async (image) => {
    try {
        if (mode === "development") {
            console.log("development mode");

            console.log(image);

            fs.unlinkSync(path.join(__dirname, '..', 'images', image));
            return true;
        } else {
            const supabase = require("../helpers/supabase_client");
            const imagePath = image.split('/').pop(); // Extract the image path from the URL}
            const { error } = await supabase.storage.from(process.env.SUPABASE_BUCKET_NAME).remove([imagePath]);

            if (error) {
                console.error('Error deleting image from Supabase:', error);
                return false;
            }

            return true;
        }

    } catch (error) {
        console.log(error);
        return false;
    }
}



















