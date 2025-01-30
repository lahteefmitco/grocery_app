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

app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");


sequelize.sync({ force: true }).then(
  () => {
    console.log("db is ready");
  },
  (error) => {
    console.log(error);
  }
);

if (mode === "development") {
  createFolderIfNotExists("images");
  app.use("/images", express.static(path.join(__dirname, "images")));
  app.use("/banner", express.static(path.join(__dirname, "banner")))

}






app.get("/", (req, res) => {
  res.send("Welcome to OXDO Technologies");
});



app.get("/createApiKey", async (req, res, next) => {
  try {
    if (req.headers.owner !== "OXDO") return next(createError.Unauthorized("Invalid owner"));
    const token = await JWT.signInAuthToken();
    res.send(token);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// app.get("/ejsTest", (req, res, next) => {
//   try {
//     res.render('forgot_password');

//   } catch (error) {
//     next(error)
//   }
// })

app.use("/api/user", require("./routes/user_routes"));
app.use("/api/category", require("./routes/category_route"));
app.use("/api/product", require("./routes/product_routes"));
app.use("/api/order", require("./routes/cart_routes"));
app.use("/api/dashboard", require("./routes/dashboard_route"))
app.use("/api/sample", require("./routes/sample_route"));
app.use("/api/backup", require("./routes/backup_routes"));



app.use((req, res, next) => {
  next(createError.NotFound("This route is not defined"));
});

app.use((err, req, res, next) => {
  console.log(err.message);
  console.log(err.status);
  res.status(!err.status ? 500 : err.status).send(!err.message ? "Server error, please contact with developer" : err.message);
});





const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`App is listening on http://localhost:${PORT}`));














