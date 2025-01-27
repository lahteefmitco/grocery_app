const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const sequelize = require("./database");

const Crypto = require("../helpers/crypto");

require("dotenv").config();

const mode = process.env.NODE_ENV || "development";
const authTokenSecret = mode == "production" ? process.env.AUTH_TOKEN_SECRET : "aZ9dW4sGp2VtB7eF8jL0uQ1hCw3YkN6oP5mXrA2zK9TnJ8iD0gL7bCqS";
const accessTokenSecret = mode == "production" ? process.env.ACCESS_TOKEN_SECRET : "P7rG2vCkL9tY1mF3W0zB8qVjXnD6oT5aU4hKzI2JdM7sE3yLQ1wR9cA";
const resetPasswordSecret = mode == "production" ? process.env.PASSWORD_RESET_TOKEN_SECRET : "DcMjsEsuqQABBg71nCc6I3uOWIlXZ1mnUsJeT5DOrCgInKomwTj6AInPXyvsc4lw"




module.exports = {
    signInAuthToken: () => {
        return new Promise((resolve, reject) => {
            const payload = {
                developer: "Abdul Latheeef"
            };
            const secret = authTokenSecret;
            const option = {
                expiresIn: "90d",
                issuer: "oxdotechnologies.com",
            };
            JWT.sign(payload, secret, option, (err, token) => {
                if (err) {
                    reject(createError.InternalServerError());
                }
                resolve(token);
            });
        });
    },
    signInAccessToken: (userId, userName, isAdmin) => {
        return new Promise((resolve, reject) => {
            const payload = {
                userId: userId,
                userName: userName,
                isAdmin: isAdmin
            };
            const secret = accessTokenSecret;
            const option = {
                expiresIn: "90d",
                issuer: "oxdotechnologies.com",
                audience: userName,
            };
            JWT.sign(payload, secret, option, (err, token) => {
                if (err) {
                    reject(createError.InternalServerError());
                }
                resolve(token);
            });
        });

    },
    passwordResetToken: (userName) => {
        return new Promise((resolve, reject) => {
            const payload = {
                userName: userName,
            };
            const secret = resetPasswordSecret;
            const option = {
                expiresIn: "10m",
                issuer: "oxdotechnologies.com",
                audience: userName,
            };
            JWT.sign(payload, secret, option, (err, token) => {
                if (err) {
                    reject(createError.InternalServerError());
                }
                resolve(token);
            });
        });
    },
    verifyAuthToken: (req, res, next) => {
        try {

            const authHeader = req.headers["authorization"];
            if (!authHeader) return next(createError.Unauthorized());
            const bearerToken = authHeader.split(" ");
            const token = bearerToken[1];


            JWT.verify(token, authTokenSecret, (err, payload) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        console.log(`auth token error ${err}`);

                        return next(createError.Unauthorized("UnAuthorized"));
                    } else if (err.name == "TokenExpiredError") {
                        return next(createError.Unauthorized("TokenExpiredError"))
                    }
                    else {
                        return next(createError.Unauthorized("Token is not verified"))
                    }
                }

                req.payload = payload;
                next();
            });
        } catch (error) {
            console.log(`Auth error ${error}`);

            next(createError.InternalServerError(`Un expected key:- ${error}`))
        }
    },
    verifyAccessToken: (req, res, next) => {


        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) return next(createError.Unauthorized());
            const bearerToken = authHeader.split(" ");
            const token = bearerToken[1];

            JWT.verify(token, accessTokenSecret, async (err, payload) => {
                if (err) {
                    console.log(err.name);
                    if (err.name === "JsonWebTokenError") {
                        return next(createError.Unauthorized("UnAuthorized"));
                    } else if (err.name == "TokenExpiredError") {
                        return next(createError.Unauthorized("TokenExpiredError"))
                    }
                    else {


                        return next(createError.Unauthorized("Token is not verified"))
                    }
                }
                const userId = payload.userId;
                const query = `SELECT id FROM "User" WHERE id = ${userId}`;
                const [result, metadata] = await sequelize.query(query,
                    {
                        replacements: { userId },
                        type: sequelize.QueryTypes.SELECT
                    },
                )



                if (!result) return next(createError.Unauthorized("Token for the user deleted"));
                req.payload = payload;
                next();
            },
            );
        } catch (error) {
            console.log(`Auth error ${error}`);

            next(createError.InternalServerError(`Un expected key:- ${error}`))
        }

    },

    verifyPasswordResetToken: (req, res, next) => {
        try {
            const { resetPassword } = req.query;

            if (!resetPassword) {
                return next(createError.BadRequest("No secret password in query"));
            }

            const decryptedToken = Crypto.decrypt(resetPassword);

            JWT.verify(decryptedToken, resetPasswordSecret, async (err, payload) => {
                if (err) {
                    console.log(err.name);
                    if (err.name === "JsonWebTokenError") {
                        return next(createError.Unauthorized("UnAuthorized"));
                    } else if (err.name == "TokenExpiredError") {
                        return next(createError.Unauthorized("Password reset link is expired"))
                    }
                    else {
                        return next(createError.Unauthorized("Token is not verified"))
                    }
                }


                req.payload = payload;
                next();
            }
            );

        } catch (error) {
            console.log(`Auth error ${error}`);

            next(createError.InternalServerError(`Un expected problem on reseting password:- ${error}`))
        }

    },

    // verifyPasswordResetToken2: (req, res, next) => {
    //     try {
    //         const { resetPassword } = req.body;

    //         if (!resetPassword) {
    //             return next(createError.BadRequest("No secret password in query"));
    //         }

    //         const decryptedToken = Crypto.decrypt(resetPassword);

    //         JWT.verify(decryptedToken, resetPasswordSecret, async (err, payload) => {
    //             if (err) {
    //                 console.log(err.name);
    //                 if (err.name === "JsonWebTokenError") {
    //                     return next(createError.Unauthorized("UnAuthorized"));
    //                 } else if (err.name == "TokenExpiredError") {
    //                     return next(createError.Unauthorized("Password reset link is expired"))
    //                 }
    //                 else {
    //                     return next(createError.Unauthorized("Token is not verified"))
    //                 }
    //             }


    //             req.payload = payload;
    //             next();
    //         }
    //         );

    //     } catch (error) {
    //         console.log(`Auth error ${error}`);

    //         next(createError.InternalServerError(`Un expected problem on reseting password:- ${error}`))
    //     }

    // }

}