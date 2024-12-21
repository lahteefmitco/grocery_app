const sequelize = require("../helpers/database");
const JWT = require("../helpers/jwt_helper");
const createError = require("http-errors");


const signUp = async (req, res, next) => {
    try {

        var { name, userName, password, isAdmin } = req.body;


        if (!userName || !password) return next(createError.BadRequest("No password or password"));
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




        res.send({ token: accessToken })



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


        if (!userName || !password) return next(createError.BadRequest());
        if (userName.length < 4) return next(createError.BadRequest("Username length is less than 4"));
        if (password.length < 6) return next(createError.BadRequest("password length is less than 6"));



        const query = `
                SELECT id, "isAdmin"
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

        if (!result) return next(createError.BadRequest("User not registered"));
        console.log(metadata);




        const userId = result["id"];
        const isAdmin = result["isAdmin"]

        const accessToken = await JWT.signInAccessToken(userId, userName, isAdmin)




        res.send({ token: accessToken })



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
        const { isAdmin } = req.payload;

        console.log(isAdmin);


        if (!isAdmin) return next(createError.BadRequest("Admin users only allowed to fetch user list"));

        const searchKey = req.query.isAdmin
        console.log("search key");

        console.log(searchKey);


        let response;

        if (searchKey === undefined) {
            const query = `
                SELECT *
                FROM public."User";
                `;

            const [result, metadata] = await sequelize.query(query);

            console.log(result);

            response = result;


        } else {
            const query = `
                SELECT *
                FROM public."User" WHERE "isAdmin" = ${searchKey};
                `;


            const [result, metadata] = await sequelize.query(query,);

            console.log(result);
            console.log("metadata");

            console.log(metadata);

            response = result;

        }




        res.send(response);

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
        const { isAdmin, userId } = req.payload;

        console.log(isAdmin);


        if (!isAdmin) return next(createError.Forbidden("Admin users only allowed to delete user"));

        const userIdToDelete = req.params.id;

        // Check if the user exists
        const userExistsQuery = `SELECT id FROM "User" WHERE id = :userIdToDelete`;
        const [userExistsResult] = await sequelize.query(userExistsQuery, {
            replacements: { userIdToDelete },
            type: sequelize.QueryTypes.SELECT
        });

        if (!userExistsResult) {
            return next(createError.BadRequest(`User with id ${userIdToDelete} not found`));
        }

        if (userId === userIdToDelete) {
            return next(createError.Forbidden("Admin users can't delete his own account"));
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
       

        
        console.log(req.payload.isAdmin);
        


        if (!req.payload.isAdmin) return next(createError.Forbidden("Admin users only allowed to update users"));

        const userIdToUpdate = req.params.id;

        // Check if the user exists
        const userExistsQuery = `SELECT id FROM "User" WHERE id = :userIdToUpdate`;
        const [userExistsResult] = await sequelize.query(userExistsQuery, {
            replacements: { userIdToUpdate },
            type: sequelize.QueryTypes.SELECT
        });

        if (!userExistsResult) {
            return next(createError.BadRequest(`User with id ${userIdToUpdate} not found`));
        }

        const { name, userName, password, isAdmin } = req.body;

        if (!userName || !password) return next(createError.BadRequest("No password or password"));
        if (userName.length < 4) return next(createError.BadRequest("Username length is less than 4"));
        if (password.length < 6) return next(createError.BadRequest("password length is less than 4"));

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
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

        console.log(error);
        next(error)
    }
}

module.exports = { signUp, signIn, listAllUsers, deleteUser,updateUser };
