const express = require("express");
const createError = require("http-errors");
const sequelize = require("./helpers/database");
require("dotenv").config();

 




const app = express();



app.use(express.json());


sequelize.sync({ force: true}).then(
    () => {
      console.log("db is ready");
    },
    (error) => {
      console.log(error);
    }
  );


app.get("/", (req, res) => {
    res.send("Welcome to OXDO Technologies");
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
    res.status(!err.status ? 500 : err.status).send(!err.message ? "Server error, please contact with developer":err.message);
});



const PORT = process.env.PORT || 5056
app.listen(PORT, () => console.log(`App is listening on http://localhost:${PORT}`));










