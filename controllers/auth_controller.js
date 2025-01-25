const sequelize = require("../helpers/database");
const JWT = require("../helpers/jwt_helper");
const createError = require("http-errors");
require("dotenv").config();

const mode = process.env.NODE_ENV || "development";


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

        var { name, userName, password, isAdmin, email, phoneNumber, profileImage } = req.body;


        if (!userName || !password) return next(createError.BadRequest("No username or password"));
        if (userName.length < 4) return next(createError.BadRequest("Username length is less than 4"));
        if (password.length < 6) return next(createError.BadRequest("password length is less than 4"));

        if (isAdmin === undefined) return next(createError.BadRequest("isAdmin value not given"));

        if (name === undefined) {
            name = null;
        }

        if (email == undefined) {
            email = null;
        }

        if (phoneNumber == undefined) {
            phoneNumber = null;
        }

        if (profileImage == undefined) {
            profileImage = null;
        }

        let userId = 0;
        if (mode === "production") {

            const [result, metadata] = await sequelize.query(`
            INSERT INTO "User" (name,"userName", password, "isAdmin",email,"phoneNumber","profileImage")
            VALUES (:name, :userName, :password, :isAdmin, :email, :phoneNumber, :profileImage)
            RETURNING id;
           `,
                {
                    replacements: { name, userName, password, isAdmin, email, phoneNumber, profileImage },
                },
            )
            console.log("result-------------------------------------");

            console.log(result);

            userId = result[0]["id"];
        } else {
            // Development mode
            // Insert the new user into the User table
            await sequelize.query(`
            INSERT INTO "User" (name, "userName", password, "isAdmin",email,"phoneNumber","profileImage")
            VALUES (:name, :userName, :password, :isAdmin, :email, :phoneNumber, :profileImage);
        `, {
                replacements: { name, userName, password, isAdmin, email, phoneNumber, profileImage },
                type: sequelize.QueryTypes.INSERT
            });

            // Get the ID of the last inserted row
            const [result] = await sequelize.query(`
            SELECT last_insert_rowid() AS id;
        `, {
                type: sequelize.QueryTypes.SELECT
            });

            userId = result.id;

        }


        const accessToken = await JWT.signInAccessToken(userId, userName, isAdmin)

        res.send({ token: accessToken, name, isAdmin, email, phoneNumber, profileImage })



    } catch (error) {


        console.log(error);
        if (error.name === "SequelizeUniqueConstraintError") {
            return next(createError.BadRequest("Unique constraint error, username is already used"))
        }
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"))
        }

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
                SELECT id, "isAdmin",name, email, "phoneNumber", "profileImage"
                FROM "User" 
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
        var isAdmin = result["isAdmin"];
        const name = result["name"];

        const email = result["email"];
        const phoneNumber = result["phoneNumber"];
        const profileImage = result["profileImage"];



        const accessToken = await JWT.signInAccessToken(userId, userName, isAdmin)

        if (mode === "development") {
            if (isAdmin === 1) {
                isAdmin = true
            } else {
                isAdmin = false
            }
        }


        res.send({ token: accessToken, name, isAdmin, email, phoneNumber, profileImage })



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
                FROM "User";
                `;


        const [results, metadata] = await sequelize.query(query,);

        console.log(results);
        let updatedUsers = [];

        if (mode === "development") {
            updatedUsers = results.map(user => ({
                ...user,
                isAdmin: user.isAdmin === 1 ? true : false,
                password: "********"
            }));
        } else {
            updatedUsers = results.map(user => ({
                ...user,
                isAdmin: user.isAdmin === 1 ? true : false,
                password: "********"
            }));
        }




        console.log(updatedUsers);



        res.send(updatedUsers);

    } catch (error) {
        console.log(error);

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


        if (!userExistsResult) {
            return next(createError.BadRequest(`User with id ${userIdToDelete} not found`));
        }

        if (userExistsResult.id != userIdToDelete && userExistsResult["isAdmin"] === true) {
            return next(createError.Forbidden("Admin users can't delete others admin account"));
        }


        const query = `DELETE FROM "User" WHERE id = :userIdToDelete`;

        await sequelize.query(query, {
            replacements: { userIdToDelete },
            type: sequelize.QueryTypes.DELETE
        },);

        res.send("Deleted user");

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


        const { userId } = req.payload;



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


        if (userIdToUpdate != userId ) {
            return next(createError.Forbidden("users can't update other  users"));
        }

        let { name, userName, password, isAdmin, email, phoneNumber, profileImage } = req.body;

        if (!userName || !password) return next(createError.BadRequest("No userName or password"));
        if (userName.length < 4) return next(createError.BadRequest("Username length is less than 4"));
        if (password.length < 6) return next(createError.BadRequest("password length is less than 6"));

        if (isAdmin === undefined) return next(createError.BadRequest("isAdmin value not given"));

        if (name === undefined) {
            name = null;
        }

        if (email == undefined) {
            email = null;
        }

        if (phoneNumber == undefined) {
            phoneNumber = null;
        }

        if (profileImage == undefined) {
            profileImage = null;
        }

        const updateQuery = `
        UPDATE "User"
        SET name = :name,
            "userName" = :userName,
            password = :password,
            "isAdmin" = :isAdmin,
            email = :email,
            "phoneNumber" = :phoneNumber,
            "profileImage" = :profileImage
        WHERE id = :userIdToUpdate
    `;




        await sequelize.query(updateQuery, {
            replacements: { userIdToUpdate, name, userName, password, isAdmin, email, phoneNumber, profileImage },
            type: sequelize.QueryTypes.UPDATE
        });



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

const addImageToLocal = async (req, res, next) => {
    try {
        if (!req.file) {

            return next(createError("No file is uploaded"))
        }

        const id = req.params.id;

        if (isNaN(Number(id))) return next(createError.BadRequest("User ID should be a number"));

        const profileImage = req.file.filename;

        const updateImageQuery = `UPDATE "User" 
        SET "profileImage" = :profileImage 
        WHERE id = :id`;

        await sequelize.query(updateImageQuery, {
            replacements: { profileImage, id },
            type: sequelize.QueryTypes.UPDATE
        })



        res.send(`Uploaded image to userName ${req.userName}`)



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


const addImageToRemote = async (req, res, next) => {
    try {
        if (!req.file) {

            return next(createError("No file is uploaded"))
        }

        const supabase = require("../helpers/supabase_client");
        const { id } = req.params;

        if (isNaN(Number(id))) {
            return next(createError.BadRequest("Please provide a valid user id"));
        }

        // Check if the product exists
        const userQuery = `SELECT * FROM "User" WHERE id = :id`;
        const [user] = await sequelize.query(userQuery, {
            replacements: { id },
            type: sequelize.QueryTypes.SELECT
        });

        console.log(user);




        if (!user) {
            return next(createError.NotFound(`User not found with the given id ${id}`));
        }




        console.log(req.file.originalname);

        const fileName = `${Date.now()}_${req.file.originalname}`;



        // Delete existing image from Supabase if it exists
        if (user.profileImage) {




            const imagePath = user.profileImage.split('/').pop();
            console.log("---");

            console.log(imagePath);
            // Extract the image path from the URL
            const { error: deleteError } = await supabase.storage.from(process.env.SUPABASE_BUCKET_NAME).remove([imagePath]);

            if (deleteError) {
                console.error('Error deleting image from Supabase:', deleteError);
                return next(createError.InternalServerError('Error deleting existing image'));
            }
        }// Generate a unique filename

        console.log("Supabase");

        const file = req.file;


        // Upload the file buffer directly to Supabase
        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET_NAME)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false, // Set to true if you want to overwrite files with the same name
            });

        if (error) throw error;

        console.log("passed");



        const image = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET_NAME}/${fileName}`;

        await sequelize.query(`
            UPDATE "User"
            SET "profileImage" = :image
            WHERE id = :id;
        `,
            {
                replacements: { image, id },
                type: sequelize.QueryTypes.UPDATE
            });

        console.log(image);


        res.send({ message: `User image updated successfully`, image });



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

module.exports = { createAuthToken, signUp, signIn, listAllUsers, deleteUser, updateUser, addImageToLocal, addImageToRemote };
