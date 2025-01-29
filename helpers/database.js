const { Sequelize } = require("sequelize");
require("dotenv").config();

const mode = process.env.NODE_ENV || "development";


const user = mode == "production" ? process.env.AIVEN_DATABASE_USER : "postgres";
const host = mode == "production" ? process.env.AIVEN_DATABASE_HOST : "localhost";
const database = mode == "production" ? process.env.AIVEN_DATABASE_NAME : "grocery";
const password = mode == "production" ? process.env.AIVEN_DATABASE_PASSWORD : "la@1234";
const port = mode == "production" ? process.env.AIVEN_DATABASE_PORT : "5432";




const sequelize = mode == "production" ?



  new Sequelize(database, user, password, {
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
  })

  // Replace with your actual Neon connection string
  // new Sequelize(process.env.NEON_DATABASE_URL, {
  //   dialect: "postgres",
  //   dialectOptions: {
  //     ssl: {
  //       require: true, // Ensure SSL is used
  //       rejectUnauthorized: false, // Prevent SSL issues with Neon
  //     },
  //   },
  //   logging: false, // Disable SQL logging (optional)
  // })

  : new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false,
  });



(async () => {
  try {
    console.log("Connection established successfully.");
    if (mode === "production") {
      // Raw query to create the User table
      await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id SERIAL PRIMARY KEY, 
        name VARCHAR(255) DEFAULT NULL,
        "userName" VARCHAR(255) NOT NULL UNIQUE, 
        password VARCHAR(255) NOT NULL, 
        email VARCHAR(255) DEFAULT NULL,
        "phoneNumber" VARCHAR(16) DEFAULT NULL,
        "profileImage" VARCHAR(255) DEFAULT NULL,
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
          "stockQuantity" DECIMAL(9, 2) NOT NULL DEFAULT 0.00,
          unit VARCHAR(50),
          "isAvailable" BOOLEAN DEFAULT TRUE,
          "isTrending" BOOLEAN DEFAULT FALSE
      );

    `);


      // Raw query to create the Category table
      await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Category" (
      id SERIAL PRIMARY KEY,
      name  VARCHAR(255) NOT NULL UNIQUE
    );
  `);

      // Raw query to create the Category product table
      await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "CategoryProductJunctionTable" (
    id SERIAL PRIMARY KEY,
    "categoryId" INTEGER REFERENCES "Category"(id)
      ON DELETE CASCADE 
      ON UPDATE CASCADE,
    "productId" INTEGER REFERENCES "Product"(id)
      ON DELETE CASCADE 
      ON UPDATE CASCADE
  );
`);

      // Raw query to create the Cart table
      await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Cart" (
        id SERIAL PRIMARY KEY, 
        "dateTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP UNIQUE, 
        "totalItems" FLOAT NOT NULL DEFAULT 0.0, 
        "totalAmount" DECIMAL NOT NULL, 
        acknowledged BOOLEAN DEFAULT FALSE,
        "userId" INTEGER REFERENCES "User"(id) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE
      );
    `);

      // Raw query to create the CartProductJunctionTable
      await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "CartProductJunctionTable" (
        id SERIAL PRIMARY KEY, 
        quantity FLOAT NOT NULL DEFAULT 1.0, 
        "productName" VARCHAR(255) NOT NULL,
        "soldPrice" DECIMAL(9,2) NOT NULL,
        "cartId" INTEGER NOT NULL REFERENCES "Cart"(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE, 
        "productId" INTEGER REFERENCES "Product"(id)
          ON DELETE SET NULL 
          ON UPDATE CASCADE
      );
    `);

      // Create banner table
      await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "Banner" (
      id SERIAL PRIMARY KEY,
      "bannerUrl" VARCHAR(1024) NOT NULL UNIQUE
    );
  `);


      //  sample table to insert date time
      //   await sequelize.query(`
      //   CREATE TABLE IF NOT EXISTS "Sample" (
      //     id SERIAL PRIMARY KEY, 
      //    "dateTime" TIMESTAMP NOT NULL
      //   );
      // `);
    } else {

      // For development
      // Raw query to create the User table
      await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name VARCHAR(255) DEFAULT NULL,
        "userName" VARCHAR(255) NOT NULL UNIQUE, 
        password VARCHAR(255) NOT NULL, 
         email VARCHAR(255) DEFAULT NULL,
        "phoneNumber" VARCHAR(16) DEFAULT NULL,
        "profileImage" VARCHAR(255) DEFAULT NULL,
        "isAdmin" INTEGER DEFAULT 1
      );
    `);

      // Raw query to create the Product table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Product" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "productName" VARCHAR(255) NOT NULL UNIQUE,
        "productDescription" TEXT,
        price DECIMAL(9, 2) NOT NULL DEFAULT 0.00,
        image VARCHAR(1024),
        "stockQuantity" Real NOT NULL DEFAULT 0,
        unit VARCHAR(50),
        "isAvailable" INTEGER DEFAULT 1
      );

    `);

      // Raw query to create the Category table
      await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Category" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name  VARCHAR(255) NOT NULL UNIQUE
    );
  `);

      // Raw query to create the Category product table
      await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "CategoryProductJunctionTable" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER REFERENCES "Category"(id)
      ON DELETE CASCADE 
      ON UPDATE CASCADE,
    "productId" INTEGER REFERENCES "Product"(id)
      ON DELETE CASCADE 
      ON UPDATE CASCADE
  );
`);

      // Raw query to create the Cart table
      await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "Cart" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "dateTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP UNIQUE,
      "totalItems" FLOAT NOT NULL DEFAULT 0.0,
      "totalAmount" DECIMAL NOT NULL,
      acknowledged INTEGER DEFAULT 0,
      "userId" INTEGER REFERENCES "User"(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
      );
    `);

      // Raw query to create the CartProductJunctionTable
      await sequelize.query(`
     CREATE TABLE IF NOT EXISTS "CartProductJunctionTable" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quantity FLOAT NOT NULL DEFAULT 1.0,
      "productName" VARCHAR(255) NOT NULL,
      "soldPrice" DECIMAL(9,2) NOT NULL,
      "cartId" INTEGER NOT NULL REFERENCES "Cart"(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      "productId" INTEGER REFERENCES "Product"(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
      );
    `);

      // Create banner table
      await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Banner" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "bannerUrl" VARCHAR(1024) NOT NULL UNIQUE
      );
    `);

    }


    console.log("Tables are created successfully.");
  } catch (error) {
    console.error("Error creating the table:", error);
  }
})();


module.exports = sequelize;