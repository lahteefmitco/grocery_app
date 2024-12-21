const JWT = require("jsonwebtoken");
const createError = require("http-errors");

// const signInAccessToken = (userId, userName)=>{
//     return new Promise((resolve, reject) => {
//         const payload = {
//             userId: userId,
//             userName: userName
//         };
//         const secret = process.env.ACCESS_TOKEN_SECRET;
//         const option = {
//             expiresIn: "10y",
//             issuer: "oxdotechnologies.com",
//             audience: userName,
//         };
//         JWT.sign(payload, secret, option, (err, token) => {
//             if (err) {
//                 reject(createError.InternalServerError());
//             }
//             resolve(token);
//         });
//     });

// }

// const verifyAccessToken = (req, res, next) => {
//     const authHeader = req.headers["authorization"];
//     if (!authHeader) return next(createError.Unauthorized());
//     const bearerToken = authHeader.split(" ");
//     const token = bearerToken[1];

//     JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
//         if (err) {
//             console.log(err.name);
//             if (err.name === "JsonWebTokenError") {
//                 return next(createError.Unauthorized("UnAuthorized"));
//             } else if (err.name == "TokenExpiredError") {
//                 return next(createError.Unauthorized("TokenExpiredError"))
//             }
//             else {
//                 return next(createError.Unauthorized("Token is not verified"))
//             }
//         }
//         req.payload = payload;
//         next();
//     });

module.exports = {
    signInAccessToken: (userId, userName,isAdmin) => {
        return new Promise((resolve, reject) => {
            const payload = {
                userId: userId,
                userName: userName,
                isAdmin:isAdmin
            };
            const secret = process.env.ACCESS_TOKEN_SECRET;
            const option = {
                expiresIn: "10y",
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
    verifyAccessToken: (req, res, next) => {
        const authHeader = req.headers["authorization"];
        if (!authHeader) return next(createError.Unauthorized());
        const bearerToken = authHeader.split(" ");
        const token = bearerToken[1];

        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
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
            req.payload = payload;
            next();
        },
    );
    }

}