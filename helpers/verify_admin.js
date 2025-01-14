const createError = require("http-errors");

const verifyAdmin = (req, res, next) => {
    const { isAdmin } = req.payload;

    if(isAdmin === undefined){
        return next(createError.InternalServerError("Please contact with developer"));
    }

    if (!isAdmin) {
        return next(createError.Forbidden("Unauthorized: You are not allowed to perform this operation"));
    }

    
    

    next();
};

module.exports = { verifyAdmin };