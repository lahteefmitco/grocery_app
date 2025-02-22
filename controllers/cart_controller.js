const sequelize = require("../helpers/database");
const createError = require("http-errors");

const mode = process.env.NODE_ENV || "development";

const addToCart = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.payload.userId;
        const receivedData = req.body;
        const { dateTime, totalItems, totalAmount, productList } = receivedData;

        if (!dateTime || !totalItems || !totalAmount || !productList) return next(createError.BadRequest("Missing required fields"));
        if (productList.length === 0) return next(createError.BadRequest("No products in the order"));

        if (totalItems === 0) return next(createError.BadRequest("Total items should be greater than 0"));

        // Calculate totalItems and totalAmount from productList
        let calculatedTotalItems = 0;
        let calculatedTotalAmount = 0;

        for (let i = 0; i < productList.length; i++) {
            const { productId, quantity, productName, soldPrice } = productList[i];

            if (!productId || !quantity || !productName || !soldPrice) return next(createError.BadRequest("Missing required fields in product list"));

            const productQuery = `
                SELECT id, "productName","stockQuantity"
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
                return next(createError.BadRequest(`Product with name ${productName} is not found in product list`));
            }
            if (product.productName !== productName) {
                await t.rollback();
                return next(createError.BadRequest(`Product with name ${productName} is not found`));
            }

            if (product.stockQuantity < quantity) {
                await t.rollback();
                return next(createError.Forbidden(`Insufficient stock for product ${productName}`));
            }

            calculatedTotalItems += 1;
            calculatedTotalAmount += soldPrice * quantity;
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

        let cartId = 0;

        if (mode === "production") {
            const [result, metadata] = await sequelize.query(`
                INSERT INTO "Cart" ("dateTime", "totalItems", "totalAmount", "userId")
                VALUES (:dateTime, :totalItems, :totalAmount, :userId)
                RETURNING id;
            `, {
                replacements: { dateTime, totalItems, totalAmount, userId },
                transaction: t
            });

            cartId = result[0]["id"];
            console.log(`Cart id in postgresql ${cartId}`);
        } else {
            // Get the ID of the last inserted row

            await sequelize.query(`
                INSERT INTO "Cart" ("dateTime", "totalItems", "totalAmount", "userId")
                VALUES (:dateTime, :totalItems, :totalAmount, :userId);
            `, {
                replacements: { dateTime, totalItems, totalAmount, userId },
                transaction: t
            });


            const [result] = await sequelize.query(`
                SELECT id FROM "Cart"
                ORDER BY id DESC
                LIMIT 1;
                `,
                {
                    type: sequelize.QueryTypes.SELECT,
                    transaction: t
                });

            console.log(`Result is ${result}`);





            cartId = result.id;

            console.log(`Cart id in sqlite ${cartId}`);

        }





        for (let i = 0; i < productList.length; i++) {
            const { productId, quantity, productName, soldPrice } = productList[i];

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

            console.log(`updating passsed ${updateResult} ,  metadata ${updateMetadata}`);

            if (updateMetadata.rowCount === 0) {
                await t.rollback();
                return next(createError.Forbidden(`Insufficient stock for product ID ${productId}`));
            }

            const newStockQuantity = updateResult[0]["stockQuantity"];

            console.log(`New stock quantity ${newStockQuantity}`);

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
                INSERT INTO "CartProductJunctionTable" ("cartId", "productId", "quantity","productName","soldPrice")
                VALUES (:cartId, :productId, :quantity,:productName,:soldPrice);
            `, {
                replacements: { cartId, productId, quantity, productName, soldPrice },
                transaction: t
            });
        }

        await t.commit();
        res.send({ message: "Added to cart successfully", orderId: cartId });
    } catch (error) {
        await t.rollback();
        console.log(error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return next(createError.InternalServerError("Check date and time, try with different date and time"));
        }

        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        return next(createError.BadRequest(`Error in placing this order ${error.message}`));
    }
}

// only for testing
const addToCart2 = async (req, res, next) => {
    try {
        const userId = req.payload.userId;
        const receivedData = req.body;
        const { dateTime, totalItems, totalAmount, productList } = receivedData;

        if (!dateTime || !totalItems || !totalAmount || !productList) return next(createError.BadRequest("Missing required fields"));
        if (productList.length === 0) return next(createError.BadRequest("No products in the cart"));
        if (totalItems === 0) return next(createError.BadRequest("Total items should be greater than 0"));

        const productListJson = JSON.stringify(productList);

        const [result] = await sequelize.query(`
            SELECT * FROM add_to_cart(:userId, :dateTime, :totalItems, :totalAmount, :productListJson)
        `, {
            replacements: { userId, dateTime, totalItems, totalAmount, productListJson },
            type: sequelize.QueryTypes.SELECT
        });

        res.send({ message: "Added to cart successfully", cartId: result.cart_id });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            console.log("sequalize error in addToCart2-------");

            console.log(error.message);

            return next(createError.InternalServerError(`Database problem, please contact with developer ${error.message}`));
        }

        return next(createError.BadRequest(`Error in adding to cart ${error.message}`));
    }
}




const getCartById = async (req, res, next) => {
    try {
        const { cartId } = req.params;



        if (cartId === undefined) return next(createError.BadRequest("Order ID is required"));
        if (isNaN(Number(cartId))) return next(createError.BadRequest("Order ID should be a number"));

        // Query to get the cart details
        const cartQuery = `SELECT * FROM "Cart" WHERE id = :cartId`;
        const [cart] = await sequelize.query(cartQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.SELECT
        });

        if (!cart) {
            return next(createError.NotFound("Order not found"));
        }


        // Date is changed to iso format
        let date = new Date(cart.dateTime);
        date.setMinutes(date.getMinutes() + 330);
        cart.dateTime = date.toISOString().slice(0, -1);



        // Query to get the products in the cart 
        const productQuery = `
            SELECT p.*, cp.quantity,cp."productName",cp."soldPrice" 
            FROM "CartProductJunctionTable" cp
            LEFT JOIN "Product" p ON cp."productId" = p.id
            WHERE cp."cartId" = :cartId
        `;

        const products = await sequelize.query(productQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.SELECT
        });

        // Separate quantity and product details, and set product to null if all values are null
        const productDetails = products.map(product => {
            const { quantity, productName, soldPrice, id, productDescription, price, image, stockQuantity, unit, isAvailable, isTrending } = product;
            const productInfo = { id, productName, productDescription, price, image, stockQuantity, unit, isAvailable, isTrending };

            // Check if all product properties are null
            const isProductNull = Object.values(productInfo).every(value => value === null);

            return {
                productId: id,
                quantity,
                productName,
                soldPrice,
                product: isProductNull ? null : productInfo
            };
        });

        res.send({
            // order: cart, 
            dateTime: cart.dateTime,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            products: productDetails
        });

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in getting Order: ${error.message}`));
    }
}




const listAllCarts = async (req, res, next) => {
    try {


        const listQuery = `SELECT * FROM "Cart"`;

        const carts = await sequelize.query(listQuery, {
            type: sequelize.QueryTypes.SELECT
        });

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

        next(createError.InternalServerError(`Error in listing Orders: ${error.message}`));
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
            return next(createError.NotFound("No orders found for this user"));
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

        next(createError.InternalServerError(`Error in getting orders: ${error.message}`));
    }
}


const searchCartsBetweenDates = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return next(createError.BadRequest("Please provide both startDate and endDate"));
        }

        // Validate date format (optional, but recommended)
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return next(createError.BadRequest("Invalid date format"));
        }

        // Query to get the carts between the specified dates
        const cartsQuery = `
            SELECT * FROM "Cart"
            WHERE "dateTime" BETWEEN :startDate AND :endDate
        `;

        const carts = await sequelize.query(cartsQuery, {
            replacements: { startDate, endDate },
            type: sequelize.QueryTypes.SELECT
        });

        // Convert dateTime to ISO format and adjust time zone if needed
        carts.forEach(cart => {
            let date = new Date(cart.dateTime);
            date.setMinutes(date.getMinutes() + 330); // Adjust time zone if needed
            cart.dateTime = date.toISOString().slice(0, -1); // Remove the trailing 'Z'
        });

        res.send(carts);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in searching orders: ${error.message}`));
    }
}

const updateCartWithProducts = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { cartId } = req.params;

        if (cartId === undefined) return next(createError.BadRequest("Order ID is required"));
        if (isNaN(Number(cartId))) return next(createError.BadRequest("Order ID should be a number"));

        // Check for existing cart
        const existingCartQuery = `
            SELECT * FROM "Cart" WHERE id = :cartId;
        `;

        const [existingCart] = await sequelize.query(existingCartQuery,
            {
                replacements: { cartId },
                type: sequelize.QueryTypes.SELECT,
                transaction: t
            }
        )

        console.log(`Existing cart`);


        if (!existingCart) {
            t.rollback();
            return next(createError.BadRequest(`No Order with ths id ${cartId}`))

        }






        const { dateTime, totalItems, totalAmount, productList } = req.body;

        if (!dateTime || !totalItems || !totalAmount || !productList) return next(createError.BadRequest("Missing required fields"));
        if (productList.length === 0) return next(createError.BadRequest("No products in the order"));
        if (totalItems === 0) return next(createError.BadRequest("Total items should be greater than 0"));


        // Calculate totalItems and totalAmount from productList
        let calculatedTotalItems = 0;
        let calculatedTotalAmount = 0;

        for (let i = 0; i < productList.length; i++) {
            const { productId, quantity, productName, soldPrice } = productList[i];

            if (!productId || !quantity || !productName || !soldPrice) return next(createError.BadRequest("Missing required fields in product list"));

            const productQuery = `
               SELECT id, "productName","stockQuantity"
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
                return next(createError.BadRequest(`Product with name ${productName} is not found`));
            }
            if (product.productName !== productName) {
                await t.rollback();
                return next(createError.BadRequest(`Product with name ${productName} is not found`));
            }




            const getExistingProductsStockInCartQuery = `
                SELECT  quantity
                FROM "CartProductJunctionTable"
                WHERE "cartId" = :cartId AND "productId" = :productId`;

            const [existingStockOfProductInCart] = await sequelize.query(getExistingProductsStockInCartQuery,
                {
                    replacements: { cartId, productId },
                    type: sequelize.QueryTypes.SELECT,
                    transaction: t
                }
            )
            if (existingStockOfProductInCart) {

                console.log(`Existing stock of product ${existingStockOfProductInCart.quantity}`);



                const newStockQuantity = product.stockQuantity + existingStockOfProductInCart.quantity;


                if (newStockQuantity < quantity) {
                    await t.rollback();
                    return next(createError.Forbidden(`Insufficient stock for product ${productName}`));
                }
            }

            calculatedTotalItems += 1;
            calculatedTotalAmount += soldPrice * quantity;
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
            if (productId !== null) {
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
            const { productId, quantity, productName, soldPrice } = product;
            const insertProductQuery = `
                INSERT INTO "CartProductJunctionTable" ("cartId", "productId", quantity,"productName","soldPrice")
                VALUES (:cartId, :productId, :quantity,:productName,:soldPrice)
            `;

            await sequelize.query(insertProductQuery, {
                replacements: { cartId, productId, quantity, productName, soldPrice },
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

            let newStockQuantity = 0;

            if (!updateResult) {
                const queryToGetNewStock = `
                    SELECT "stockQuantity" FROM "Product" WHERE id = :productId
                `;

                const [result] = await sequelize.query(queryToGetNewStock,
                    {
                        replacements: { productId },
                        type: sequelize.QueryTypes.SELECT,
                        transaction: t
                    }
                );

                newStockQuantity = result.newStockQuantity
            } else {
                newStockQuantity = updateResult[0]["stockQuantity"];
            }






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
        res.send("Order and products updated successfully");

    } catch (error) {
        await t.rollback();
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in updating order: ${error.message}`));
    }
}





const deleteCartWithProducts = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { cartId } = req.params;

        if (isNaN(Number(cartId))) return next(createError.BadRequest("Order ID should be a number"));

        // Check for existing cart
        const existingCartQuery = `
         SELECT * FROM "Cart" WHERE id = :cartId;
     `;

        const [existingCart] = await sequelize.query(existingCartQuery,
            {
                replacements: { cartId },
                type: sequelize.QueryTypes.SELECT,
                transaction: t
            }
        )




        if (!existingCart) {
            t.rollback();
            return next(createError.BadRequest(`No Order with ths id ${cartId}`))

        }

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
        if (products.length === 0) {
            await t.rollback();
            return next(createError.NotFound("No Order with this id or No products found for this cart"));
        }


        // Increment the stock quantity in the Product table
        for (const product of products) {
            const { productId, quantity } = product;
            if (productId !== null) {
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



        await sequelize.query(deleteCartQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.DELETE,
            transaction: t
        });





        console.log("Order and associated products deleted successfully");


        await t.commit();
        res.send("Order and associated products deleted successfully");

    } catch (error) {
        await t.rollback();
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in deleting Order: ${error.message}`));
    }
}


const sampleQuery = async (req, res, next) => {
    try {

        const [result] = await sequelize.query(`
            SELECT * FROM "Cart"
            ORDER BY id DESC
            LIMIT 1;
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        res.send(result);


    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in deleting cart: ${error.message}`));
    }
}

const aknowledgeCartRemote = async (req, res, next) => {
    try {
        const { cartId } = req.params;

        const { acknowledged } = req.body;

        if (isNaN(Number(cartId))) return next(createError.BadRequest("Cart ID should be a number"));

        if (acknowledged === undefined) return next(createError.BadRequest("Acknowledged field is required"));
        if (typeof acknowledged !== "boolean") return next(createError.BadRequest("Acknowledged field should be either true or false"));


        let acknowledgeCartQuery = ``;
        if (acknowledged === true) {


            acknowledgeCartQuery = `
            UPDATE "Cart"
            SET acknowledged = true
            WHERE id = :cartId
        `;
        } else {

            acknowledgeCartQuery = `UPDATE "Cart"
            SET acknowledged = false
            WHERE id = :cartId`;

        }

        await sequelize.query(acknowledgeCartQuery, {
            replacements: { cartId },
            type: sequelize.QueryTypes.UPDATE
        });

        if (acknowledged) {
            res.send("Order acknowledged successfully");
        } else {
            res.send("Order acknowledged set as false");
        }



    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in acknowledging cart: ${error.message}`));
    }
}







module.exports = { aknowledgeCartRemote, addToCart, addToCart2, listAllCarts, getCartById, getCartsByUserId, updateCartWithProducts, deleteCartWithProducts, searchCartsBetweenDates, sampleQuery };










