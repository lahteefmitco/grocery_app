const sequelize = require("../helpers/database");
const createError = require("http-errors");



const addToCart = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.payload.userId;
        const receivedData = req.body;
        const { dateTime, totalItems, totalAmount, productList } = receivedData;

        if (!dateTime || !totalItems || !totalAmount || !productList) return next(createError.BadRequest("Missing required fields"));
        if (productList.length === 0) return next(createError.BadRequest("No products in the cart"));

        if(totalItems===0) return next(createError.BadRequest("Total items should be greater than 0"));

        // Calculate totalItems and totalAmount from productList
        let calculatedTotalItems = 0;
        let calculatedTotalAmount = 0;

        for (let i = 0; i < productList.length; i++) {
            const { productId, quantity } = productList[i];

            const productQuery = `
                SELECT price, "stockQuantity"
                FROM "Product"
                WHERE id = :productId
            `;

            const [product] = await sequelize.query(productQuery, {
                replacements: { productId },
                type: sequelize.QueryTypes.SELECT,
                transaction: t
            });

            if (!product) {
                await t.rollback();
                return next(createError.BadRequest(`Product with ID ${productId} not found`));
            }

            if (product.stockQuantity < quantity) {
                await t.rollback();
                return next(createError.Forbidden(`Insufficient stock for product ID ${productId}`));
            }

            calculatedTotalItems += 1;
            calculatedTotalAmount += product.price * quantity;
        }

        console.log(calculatedTotalItems, totalItems, calculatedTotalAmount, totalAmount);


        // Verify totalItems
        if (calculatedTotalItems !== totalItems) {
            await t.rollback();
            return next(createError.BadRequest("Total items do not match the calculated values"));
        }

        // Verify totalAmount
        if (calculatedTotalAmount.toFixed(2) !== totalAmount.toFixed(2)) {
            await t.rollback();
            return next(createError.BadRequest("Total amount does not match the calculated values"));
        }

        const [result, metadata] = await sequelize.query(`
            INSERT INTO "Cart" ("dateTime", "totalItems", "totalAmount", "userId")
            VALUES (:dateTime, :totalItems, :totalAmount, :userId)
            RETURNING id;
        `, {
            replacements: { dateTime, totalItems, totalAmount, userId },
            transaction: t
        });

        const cartId = result[0]["id"];

        for (let i = 0; i < productList.length; i++) {
            const { productId, quantity } = productList[i];

            // Decrement the stock quantity in the Product table
            const updateProductQuery = `
                UPDATE "Product"
                SET "stockQuantity" = "stockQuantity" - :quantity
                WHERE id = :productId AND "stockQuantity" >= :quantity
                RETURNING "stockQuantity"
            `;

            const [updateResult, updateMetadata] = await sequelize.query(updateProductQuery, {
                replacements: { productId, quantity },
                transaction: t
            });

            if (updateMetadata.rowCount === 0) {
                await t.rollback();
                return next(createError.Forbidden(`Insufficient stock for product ID ${productId}`));
            }

            const newStockQuantity = updateResult[0]["stockQuantity"];

            // Update isAvailable if stockQuantity is zero
            if (newStockQuantity === 0) {
                const updateAvailabilityQuery = `
                    UPDATE "Product"
                    SET "isAvailable" = false
                    WHERE id = :productId
                `;

                await sequelize.query(updateAvailabilityQuery, {
                    replacements: { productId },
                    transaction: t
                });
            }

            // Insert into CartProductJunctionTable
            await sequelize.query(`
                INSERT INTO "CartProductJunctionTable" ("cartId", "productId", "quantity")
                VALUES (:cartId, :productId, :quantity);
            `, {
                replacements: { cartId, productId, quantity },
                transaction: t
            });
        }

        await t.commit();
        res.send({ message: "Added to cart successfully", cartId });
    } catch (error) {
        await t.rollback();
        console.log(error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return next(createError.InternalServerError("Check date and time, try with different date and time"));
        }

        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        return next(createError.BadRequest(`Error in adding to cart ${error.message}`));
    }
}




const getCartById = async (req, res, next) => {
    try {
        const { cartId } = req.params;



        if (cartId === undefined) return next(createError.BadRequest("Cart ID is required"));
        if (isNaN(Number(cartId))) return next(createError.BadRequest("Cart ID should be a number"));

        // Query to get the cart details
        const cartQuery = `SELECT * FROM "Cart" WHERE id = :cartId`;
        const [cart] = await sequelize.query(cartQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.SELECT
        });

        if (!cart) {
            return next(createError.NotFound("Cart not found"));
        }


        let date = new Date(cart.dateTime);
        date.setMinutes(date.getMinutes() + 330);
        cart.dateTime = date.toISOString().slice(0, -1);




        const productQuery = `
            SELECT p.*, cp.quantity 
            FROM "CartProductJunctionTable" cp
            JOIN "Product" p ON cp."productId" = p.id
            WHERE cp."cartId" = :cartId
        `;

        const products = await sequelize.query(productQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.SELECT
        });

        // Separate quantity and product details
        const productDetails = products.map(product => {
            const { quantity, ...productInfo } = product;
            return { quantity, product: productInfo };
        });

        res.send({ cart, products: productDetails });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in getting cart: ${error.message}`));
    }
}

const listAllCarts = async (req, res, next) => {
    try {
        const {isAdmin} = req.payload;
        console.log(isAdmin);
        
        if(!isAdmin) return next(createError.Unauthorized("You are not authorized to view this page"));

        const listQuery = `SELECT * FROM "Cart"`;

        const carts = await sequelize.query(listQuery, {
            type: sequelize.QueryTypes.SELECT
        });

        const productQuery = `
            SELECT p.*, cp.quantity 
            FROM "CartProductJunctionTable" cp
            JOIN "Product" p ON cp."productId" = p.id
            WHERE cp."cartId" = :cartId
        `;

        const cartList = [];

        for (let index = 0; index < carts.length; index++) {
            const cart = carts[index];

            let date = new Date(cart.dateTime);
            date.setMinutes(date.getMinutes() + 330);
            cart.dateTime = date.toISOString().slice(0, -1);

            const cartId = cart.id;

            const products = await sequelize.query(productQuery, {
                replacements: { cartId },
                type: sequelize.QueryTypes.SELECT
            });

            // Separate quantity and product details
            const productDetails = products.map(product => {
                const { quantity, ...productInfo } = product;
                return { quantity, product: productInfo };
            });


            cartList.push({ cart, products: productDetails });
        }



        res.send(cartList);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in listing carts: ${error.message}`));
    }
}

const getCartsByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (isNaN(Number(userId))) return next(createError.BadRequest("User ID should be a number"));


        // Query to get the carts created by the user
        const cartsQuery = `SELECT * FROM "Cart" WHERE "userId" = :userId`;
        const carts = await sequelize.query(cartsQuery, {
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT
        });

        if (carts.length === 0) {
            return next(createError.NotFound("No carts found for this user"));
        }

        carts.forEach(cart => {
            let date = new Date(cart.dateTime);
            date.setMinutes(date.getMinutes() + 330);
            cart.dateTime = date.toISOString().slice(0, -1);
        });

        res.send(carts);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in getting carts: ${error.message}`));
    }
}

const updateCartWithProducts = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { cartId } = req.params;

        if (cartId === undefined) return next(createError.BadRequest("Cart ID is required"));
        if (isNaN(Number(cartId))) return next(createError.BadRequest("Cart ID should be a number"));


        const { dateTime, totalItems, totalAmount, productList } = req.body;

        if (!dateTime || !totalItems || !totalAmount || !productList) return next(createError.BadRequest("Missing required fields"));
        if (productList.length === 0) return next(createError.BadRequest("No products in the cart"));
        if(totalItems===0) return next(createError.BadRequest("Total items should be greater than 0"));


        // Calculate totalItems and totalAmount from productList
        let calculatedTotalItems = 0;
        let calculatedTotalAmount = 0;

        for (let i = 0; i < productList.length; i++) {
            const { productId, quantity } = productList[i];

            const productQuery = `
                SELECT price, "stockQuantity"
                FROM "Product"
                WHERE id = :productId
            `;

            const [product] = await sequelize.query(productQuery, {
                replacements: { productId },
                type: sequelize.QueryTypes.SELECT,
                transaction: t
            });

            if (!product) {
                await t.rollback();
                return next(createError.BadRequest(`Product with ID ${productId} not found`));
            }

            if (product.stockQuantity < quantity) {
                await t.rollback();
                return next(createError.Forbidden(`Insufficient stock for product ID ${productId}`));
            }

            calculatedTotalItems += 1;
            calculatedTotalAmount += product.price * quantity;
        }

        console.log(calculatedTotalItems, totalItems, calculatedTotalAmount, totalAmount);


        // Verify totalItems
        if (calculatedTotalItems !== totalItems) {
            await t.rollback();
            return next(createError.BadRequest("Total items do not match the calculated values"));
        }

        // Verify totalAmount
        if (calculatedTotalAmount.toFixed(2) !== totalAmount.toFixed(2)) {
            await t.rollback();
            return next(createError.BadRequest("Total amount does not match the calculated values"));
        }

        // Update the cart details
        const updateCartQuery = `
            UPDATE "Cart"
            SET "dateTime" = :dateTime,
                "totalItems" = :totalItems,
                "totalAmount" = :totalAmount
            WHERE id = :cartId
        `;

        await sequelize.query(updateCartQuery, {
            replacements: { cartId, dateTime, totalItems, totalAmount },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
        });

        // Retrieve existing products in the cart
        const getExistingProductsQuery = `
            SELECT "productId", quantity
            FROM "CartProductJunctionTable"
            WHERE "cartId" = :cartId
        `;

        const existingProducts = await sequelize.query(getExistingProductsQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.SELECT,
            transaction: t
        });

        // Increment the stock quantity in the Product table for existing products
        for (const product of existingProducts) {
            const { productId, quantity } = product;
            const incrementProductQuery = `
                UPDATE "Product"
                SET "stockQuantity" = "stockQuantity" + :quantity
                WHERE id = :productId
            `;

            await sequelize.query(incrementProductQuery, {
                replacements: { productId, quantity },
                type: sequelize.QueryTypes.UPDATE,
                transaction: t
            });
        }

        // Delete existing products in the cart
        const deleteProductsQuery = `
            DELETE FROM "CartProductJunctionTable"
            WHERE "cartId" = :cartId
        `;

        await sequelize.query(deleteProductsQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.DELETE,
            transaction: t
        });

        // Insert new products into the cart and decrement the stock quantity
        for (const product of productList) {
            const { productId, quantity } = product;
            const insertProductQuery = `
                INSERT INTO "CartProductJunctionTable" ("cartId", "productId", quantity)
                VALUES (:cartId, :productId, :quantity)
            `;

            await sequelize.query(insertProductQuery, {
                replacements: { cartId, productId, quantity },
                type: sequelize.QueryTypes.INSERT,
                transaction: t
            });

            const decrementProductQuery = `
                UPDATE "Product"
                SET "stockQuantity" = "stockQuantity" - :quantity
                WHERE id = :productId AND "stockQuantity" >= :quantity
                RETURNING "stockQuantity"
            `;

            const [updateResult, updateMetadata] = await sequelize.query(decrementProductQuery, {
                replacements: { productId, quantity },
                type: sequelize.QueryTypes.UPDATE,
                transaction: t
            });

            if (updateMetadata.rowCount === 0) {
                await t.rollback();
                return next(createError.Forbidden(`Insufficient stock for product ID ${productId}`));
            }

            const newStockQuantity = updateResult[0]["stockQuantity"];

            // Update isAvailable if stockQuantity is zero
            if (newStockQuantity === 0) {
                const updateAvailabilityQuery = `
                    UPDATE "Product"
                    SET "isAvailable" = false
                    WHERE id = :productId
                `;

                await sequelize.query(updateAvailabilityQuery, {
                    replacements: { productId },
                    transaction: t
                });
            }
        }

        await t.commit();
        res.send("Cart and products updated successfully");

    } catch (error) {
        await t.rollback();
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in updating cart: ${error.message}`));
    }
}





const deleteCartWithProducts = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { cartId } = req.params;

        if (isNaN(Number(cartId))) return next(createError.BadRequest("Cart ID should be a number"));



        // Retrieve products associated with the cart
        const getProductsQuery = `
            SELECT "productId", quantity
            FROM "CartProductJunctionTable"
            WHERE "cartId" = :cartId
        `;

        const products = await sequelize.query(getProductsQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.SELECT,
            transaction: t
        });

        console.log(products);
        if(products.length === 0) {
            await t.rollback();
            return next(createError.NotFound("No cart with this id or No products found for this cart"));
        }
        

        // Increment the stock quantity in the Product table
        for (const product of products) {
            const { productId, quantity } = product;
            const updateProductQuery = `
                UPDATE "Product"
                SET "stockQuantity" = "stockQuantity" + :quantity
                WHERE id = :productId
            `;

            await sequelize.query(updateProductQuery, {
                replacements: { productId, quantity },
                type: sequelize.QueryTypes.UPDATE,
                transaction: t
            });
        }

        console.log("Stock quantity incremented successfully");
        

        // Delete products associated with the cart
        const deleteProductsQuery = `
            DELETE FROM "CartProductJunctionTable"
            WHERE "cartId" = :cartId
        `;

        await sequelize.query(deleteProductsQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.DELETE,
            transaction: t
        });

        console.log("Products deleted successfully");
        

        // Delete the cart
        const deleteCartQuery = `
            DELETE FROM "Cart"
            WHERE id = :cartId
            RETURNING id;
        `;



        const [result, metadata] = await sequelize.query(deleteCartQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.DELETE,
            transaction: t
        });

        console.log("Cart deleted successfully");

        console.log(metadata);
        console.log(result["id"]);
        
        
        
        console.log(cartId);
        
        if (result["id"]!=cartId) {
            await t.rollback();
            return next(createError.NotFound("Cart not found"));
        }

        console.log("Cart and associated products deleted successfully");
        

        await t.commit();
        res.send("Cart and associated products deleted successfully");

    } catch (error) {
        await t.rollback();
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in deleting cart: ${error.message}`));
    }
}







module.exports = { addToCart, listAllCarts, getCartById, getCartsByUserId, updateCartWithProducts, deleteCartWithProducts };



