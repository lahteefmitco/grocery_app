const createError = require("http-errors");
require("dotenv").config();

const ownerKey = process.env.OWNER_KEY;

const verifyOwnerToken = (req, res, next) => {
    const { owner } = req.headers;

    if (!owner) return next(createError.BadRequest("Owner is not defined"));

    if (owner === ownerKey) return next();

    return next(createError.Unauthorized("invalid owner"));
}

module.exports = {verifyOwnerToken};