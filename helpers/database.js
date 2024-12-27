const { Sequelize } = require("sequelize");
require("dotenv").config();

const mode = process.env.NODE_ENV || "development";


const user = mode == "production" ? process.env.AIVEN_DATABASE_USER : "postgres";
const host = mode == "production" ? process.env.AIVEN_DATABASE_HOST : "localhost";
const database = mode == "production" ? process.env.AIVEN_DATABASE_NAME : "grocery";
const password = mode == "production" ? process.env.AIVEN_DATABASE_PASSWORD : "la@1234";
const port = mode == "production" ? process.env.AIVEN_DATABASE_PORT : "5432";



const sequelize = mode == "production" ? new Sequelize(database, user, password, {
  host,
  port,
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
}) :
  new Sequelize(database, user, password, {
    host,
    port,
    dialect: "postgres",
    logging: false,
  });

(async () => {
  try {
    console.log("Connection established successfully.");

    // Raw query to create the User table
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "User" (
          id SERIAL PRIMARY KEY, 
          name VARCHAR(255) DEFAULT NULL,
          "userName" VARCHAR(255) NOT NULL UNIQUE, 
          password VARCHAR(255) NOT NULL, 
          "isAdmin" BOOLEAN DEFAULT TRUE
        );
      `);

    // Raw query to create the Product table
    await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "Product" (
            id SERIAL PRIMARY KEY,
            "productName" VARCHAR(255) NOT NULL UNIQUE,
            "productDescription" TEXT,
            price DECIMAL(9, 2) NOT NULL DEFAULT 0.00,
            image VARCHAR(1024),
            "stockQuantity" INTEGER NOT NULL DEFAULT 0,
            unit VARCHAR(50),
            "isAvailable" BOOLEAN DEFAULT TRUE
        );

      `);

    // Raw query to create the Cart table
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Cart" (
          id SERIAL PRIMARY KEY, 
          "dateTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP UNIQUE, 
          "totalItems" FLOAT NOT NULL DEFAULT 0.0, 
          "totalAmount" DECIMAL NOT NULL, 
          "userId" INTEGER NOT NULL REFERENCES "User"(id) 
            ON DELETE NO ACTION 
            ON UPDATE CASCADE
        );
      `);

    // Raw query to create the CartProductJunctionTable
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "CartProductJunctionTable" (
          id SERIAL PRIMARY KEY, 
          quantity FLOAT NOT NULL DEFAULT 1.0, 
          "cartId" INTEGER NOT NULL REFERENCES "Cart"(id) 
            ON DELETE CASCADE 
            ON UPDATE CASCADE, 
          "productId" INTEGER NOT NULL REFERENCES "Product"(id) 
            ON DELETE NO ACTION 
            ON UPDATE CASCADE
        );
      `);

    //  sample table to insert date time
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Sample" (
          id SERIAL PRIMARY KEY, 
         "dateTime" TIMESTAMP NOT NULL
        );
      `);

    console.log("Tables are created successfully.");
  } catch (error) {
    console.error("Error creating the table:", error);
  }
})();


module.exports = sequelize;