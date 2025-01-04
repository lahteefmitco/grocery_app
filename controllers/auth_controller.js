const sequelize = require("../helpers/database");
const JWT = require("../helpers/jwt_helper");
const createError = require("http-errors");

const createAuthToken = async (req, res, next) => {
    try {   
        const token = await JWT.signInAuthToken();
        res.send(token);
    } catch (error) {
        console.log(error);
        next(error);
    }
};


const signUp = async (req, res, next) => {
    try {

        var { name, userName, password, isAdmin } = req.body;


        if (!userName || !password) return next(createError.BadRequest("No username or password"));
        if (userName.length < 4) return next(createError.BadRequest("Username length is less than 4"));
        if (password.length < 6) return next(createError.BadRequest("password length is less than 4"));

        if (isAdmin === undefined) return next(createError.BadRequest("isAdmin value not given"));

        if (name === undefined) {
            name = null;
        }




        const [result, metadata] = await sequelize.query(`
            INSERT INTO "User" ("name","userName", "password", "isAdmin")
            VALUES (:name, :userName, :password, :isAdmin)
            RETURNING id;
           `,
            {
                replacements: { name, userName, password, isAdmin },
            },
        )


        const userId = result[0]["id"];

        const accessToken = await JWT.signInAccessToken(userId, userName, isAdmin)




        res.send({ token: accessToken, name, isAdmin })



    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return next(createError.BadRequest("Unique constraint error, username is already used"))
        }
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }
        console.log(error);
        next(error)
    }
}

const signIn = async (req, res, next) => {
    try {

        var { userName, password } = req.body;


        if (!userName || !password) return next(createError.BadRequest("No username or password"));
        if (userName.length < 4) return next(createError.BadRequest("Username length is less than 4"));
        if (password.length < 6) return next(createError.BadRequest("password length is less than 6"));



        const query = `
                SELECT id, "isAdmin",name
                FROM public."User" 
                WHERE "userName" = :userName AND password = :password
                `;

        const [result, metadata] = await sequelize.query(query,
            {
                replacements: { userName, password },
                type: sequelize.QueryTypes.SELECT
            },
        )

        console.log(result);

        if (!result) return next(createError.NotFound("User not registered"));
        console.log(metadata);




        const userId = result["id"];
        const isAdmin = result["isAdmin"];
        const name = result["name"];


        const accessToken = await JWT.signInAccessToken(userId, userName, isAdmin)




        res.send({ token: accessToken, name, isAdmin })



    } catch (error) {
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        console.log(error);
        next(error)
    }
}

const listAllUsers = async (req, res, next) => {
    try {
       


        const query = `
                SELECT *
                FROM public."User";
                `;


        const [result, metadata] = await sequelize.query(query,);

        console.log(result);
        console.log("metadata");

        console.log(metadata);

        res.send(result);

    } catch (error) {
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        console.log(error);
        next(error)
    }
}


const deleteUser = async (req, res, next) => {
    try {
        

        const userIdToDelete = req.params.id;

        if (isNaN(Number(userIdToDelete))) return next(createError.BadRequest("User ID should be a number"));

        // Check if the user exists
        const userExistsQuery = `SELECT id, "isAdmin" FROM "User" WHERE id = :userIdToDelete`;
        const [userExistsResult] = await sequelize.query(userExistsQuery, {
            replacements: { userIdToDelete },
            type: sequelize.QueryTypes.SELECT
        });

        console.log(userExistsResult);
        console.log("-----");
        console.log(userIdToDelete);
        console.log(userId);
        
        
        
        

        if (!userExistsResult) {
            return next(createError.BadRequest(`User with id ${userIdToDelete} not found`));
        }

        if (userId != userIdToDelete && userExistsResult["isAdmin"] === true) {
            return next(createError.Forbidden("Admin users can't delete others admin account"));
        }

        const query = `DELETE FROM "User" WHERE id = :userIdToDelete`;

        const [result, metadata] = await sequelize.query(query, {
            replacements: { userIdToDelete },
            type: sequelize.QueryTypes.DELETE
        },);


        console.log(result);
        console.log(metadata);





        res.send("Deleted");

    } catch (error) {
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        console.log(error);
        next(error)
    }
}

const updateUser = async (req, res, next) => {
    try {


        const {userId} = req.payload;
        
       

        const userIdToUpdate = req.params.id;

        console.log("userIdToUpdate", userIdToUpdate);
        

        if (isNaN(Number(userIdToUpdate))) return next(createError.BadRequest("User ID should be a number"));


        // Check if the user exists
        const userExistsQuery = `SELECT id,"isAdmin" FROM "User" WHERE id = :userIdToUpdate`;
        const [userExistsResult] = await sequelize.query(userExistsQuery, {
            replacements: { userIdToUpdate },
            type: sequelize.QueryTypes.SELECT
        });

        if (!userExistsResult) {
            return next(createError.BadRequest(`User with id ${userIdToUpdate} not found`));
        }

        console.log(userExistsResult);
        

        if(userIdToUpdate != userId && userExistsResult["isAdmin"]){
            return next(createError.Forbidden("Admin users can't update other admin users"));
        }

        const { name, userName, password, isAdmin } = req.body;

        if (!userName || !password) return next(createError.BadRequest("No userName or password"));
        if (userName.length < 4) return next(createError.BadRequest("Username length is less than 4"));
        if (password.length < 6) return next(createError.BadRequest("password length is less than 6"));

        if (isAdmin === undefined) return next(createError.BadRequest("isAdmin value not given"));

        if (name === undefined) {
            name = null;
        }

        const updateQuery = `
        UPDATE "User"
        SET name = :name,
            "userName" = :userName,
            password = :password,
            "isAdmin" = :isAdmin
        WHERE id = :userIdToUpdate
    `;

        const [result, metadata] = await sequelize.query(updateQuery, {
            replacements: { userIdToUpdate, name, userName, password, isAdmin },
            type: sequelize.QueryTypes.UPDATE
        });

        if (metadata.rowCount === 0) {
            return next(createError.NotFound(`User with id ${userIdToUpdate} not found`));
        }

        res.send("User updated successfully");

    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return next(createError.BadRequest("Unique constraint error, username is already used"))
        }
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        console.log(error);
        next(error)
    }
}

module.exports = { createAuthToken,signUp, signIn, listAllUsers, deleteUser, updateUser };
