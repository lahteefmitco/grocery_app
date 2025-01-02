const express = require("express");
const createError = require("http-errors");
const sequelize = require("./helpers/database");
const JWT = require("./helpers/jwt_helper");
require("dotenv").config();

const fs = require('fs');
const path = require('path');

const mode = process.env.NODE_ENV || "development";


const createFolderIfNotExists = (folderName) => {
  const folderPath = path.join(__dirname, folderName);
  if (!fs.existsSync(folderPath)) {
      fs.mkdir(folderPath, { recursive: true }, (err) => {
          if (err) {
              console.error(`Error creating folder "${folderName}":`, err);
          } else {
              console.log(`Folder "${folderName}" created successfully.`);
          }
      });
  } else {
      console.log(`Folder "${folderName}" already exists.`);
  }
};

const app = express();
app.use(express.json());


sequelize.sync({ force: true }).then(
  () => {
    console.log("db is ready");
  },
  (error) => {
    console.log(error);
  }
);

if(mode === "development"){
  createFolderIfNotExists("images");
  app.use("/images", express.static(path.join(__dirname, "images")));

}


app.get("/", (req, res) => {
  res.send("Welcome to OXDO Technologies");
});

app.get("/createAuthToken", async (req, res, next) => {
  try {
    if (req.headers.owner !== "OXDO") return next(createError.Unauthorized("Invalid owner"));
    const token = await JWT.signInAuthToken();
    res.send(token);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

app.use("/api/user", require("./routes/user_routes"));
app.use("/api/product", require("./routes/product_routes"));
app.use("/api/cart", require("./routes/cart_routes"));
app.use("/api/sample", require("./routes/sample_route"));


app.use((req, res, next) => {
  next(createError.NotFound("This route is not defined"));
});

app.use((err, req, res, next) => {
  console.log(err.message);
  console.log(err.status);
  res.status(!err.status ? 500 : err.status).send(!err.message ? "Server error, please contact with developer" : err.message);
});





const PORT = process.env.PORT || 5056
app.listen(PORT, () => console.log(`App is listening on http://localhost:${PORT}`));














