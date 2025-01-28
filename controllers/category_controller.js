const sequelize = require("../helpers/database");
const JWT = require("../helpers/jwt_helper");
const createError = require("http-errors");
require("dotenv").config();

const mode = process.env.NODE_ENV || "development";

const createCategory = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name) {
            return next(createError.BadRequest("Name is required"));
        }

        const [result] = await sequelize.query(`
            INSERT INTO "Category" (name)
            VALUES (:name)
            RETURNING id, name;
        `, {
            replacements: { name },
            type: sequelize.QueryTypes.INSERT
        },);

        const category = result[0];

        res.status(200).send(category);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeUniqueConstraintError") {
            return next(createError.BadRequest("Unique constraint error, category name is used already"))
        }
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in deleting cart: ${error.message}`));
    }
}

const getAllCategories = async (req, res, next) => {
    try {
        const categories = await sequelize.query(`
            SELECT id, name
            FROM "Category"
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).send(categories);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in deleting cart: ${error.message}`));
    }
}

const getACategoryById = async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!id || isNaN(Number(id))) {
            return next(createError.BadRequest("Invalid category ID"));
        }

        const category = await sequelize.query(`
            SELECT id, name
            FROM "Category"
            WHERE id = :id
        `, {
            replacements: { id },
            type: sequelize.QueryTypes.SELECT
        });

        if (category.length === 0) {
            return next(createError.NotFound("Category not found"));
        }

        res.status(200).send(category[0]);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in deleting cart: ${error.message}`));
    }
}

const updateACategory = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name } = req.body;

        if (!id || isNaN(Number(id))) {
            return next(createError.BadRequest("Invalid category ID"));
        }

        if (!name) {
            return next(createError.BadRequest("Name is required"));
        }

        const category = await sequelize.query(`
            SELECT id, name
            FROM "Category"
            WHERE id = :id
        `, {
            replacements: { id },
            type: sequelize.QueryTypes.SELECT
        });

        if (category.length === 0) {
            return next(createError.NotFound("Category not found"));
        }

        await sequelize.query(`
            UPDATE "Category"
            SET name = :name
            WHERE id = :id
        `, {
            replacements: { id, name },
            type: sequelize.QueryTypes.UPDATE
        });


        res.status(200).send("Category updated successfully");

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeUniqueConstraintError") {
            return next(createError.BadRequest("Unique constraint error, category name is used already"))
        }
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in deleting cart: ${error.message}`));
    }
}

const deleteACategory = async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!id || isNaN(Number(id))) {
            return next(createError.BadRequest("Invalid category ID"));
        }

        const category = await sequelize.query(`
            SELECT id, name
            FROM "Category"
            WHERE id = :id
        `, {
            replacements: { id },
            type: sequelize.QueryTypes.SELECT
        });

        if (category.length === 0) {
            return next(createError.NotFound("Category not found"));
        }
        await sequelize.query(`
            DELETE FROM "Category"
            WHERE id = :id
        `, {
            replacements: { id },
            type: sequelize.QueryTypes.DELETE
        });

        res.status(200).send("Deleted successfully");


    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.InternalServerError(`Error in deleting cart: ${error.message}`));
    }
}

module.exports = { createCategory, getAllCategories, getACategoryById, updateACategory, deleteACategory };