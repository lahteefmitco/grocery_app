const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const sequelize = require("./database");



module.exports = {
    signInAuthToken: () => {
        return new Promise((resolve, reject) => {
            const payload = {
                developer: "Abdul Latheeef"
            };
            const secret = process.env.AUTH_TOKEN_SECRET;
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
            const secret = process.env.ACCESS_TOKEN_SECRET;
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
    verifyAuthToken: (req, res, next) => {
        const authHeader = req.headers["authorization"];
        if (!authHeader) return next(createError.Unauthorized());
        const bearerToken = authHeader.split(" ");
        const token = bearerToken[1];

        JWT.verify(token, process.env.AUTH_TOKEN_SECRET, (err, payload) => {
            if (err) {
                if (err.name === "JsonWebTokenError") {
                    return next(createError.Unauthorized("UnAuthorized"));
                } else if (err.name == "TokenExpiredError") {
                    return next(createError.Unauthorized("TokenExpiredError"))
                }
                else {
                    return next(createError.Unauthorized("Token is not verified"))
                }
            }
            console.log(payload);
            next();
        });
    },
    verifyAccessToken: (req, res, next) => {
        console.log("Entered-------------");
        
        try {
            const authHeader = req.headers["authorization"];
            if (!authHeader) return next(createError.Unauthorized());
            const bearerToken = authHeader.split(" ");
            const token = bearerToken[1];

            JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
                if (err) {
                    console.log(err.name);
                    if (err.name === "JsonWebTokenError") {
                        return next(createError.Unauthorized("UnAuthorized"));
                    } else if (err.name == "TokenExpiredError") {
                        return next(createError.Unauthorized("TokenExpiredError"))
                    }
                    else {
                        console.log(`Error ${err}`);
                        
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

                console.log(result);

                if (!result) return next(createError.Unauthorized("Token for the user deleted"));
                req.payload = payload;
                next();
            },
            );
        } catch (error) {
            console.log(`Auth error ${error}`);
            
            next(createError.InternalServerError(`Un expected key:- ${error}`))
        }

    }

}