const sequelize = require("../helpers/database");
const createError = require("http-errors");


const addSample = async (req, res, next) => {
    
    try {
       const {dateTime} = req.body;

        if (!dateTime) return next(createError.BadRequest("No dateTime"));

        console.log(dateTime);
        

        const [result, metadata] = await sequelize.query(`
            INSERT INTO "Sample" ("dateTime")
            VALUES (:dateTime)
            RETURNING id;
           `,
            {
                replacements: { dateTime},
            },
        )

        const sampleId = result[0]["id"];

        res.send({ sampleId })
        
    } catch (error) {
        console.log(error);
        
        next(error);
    }
}

const getAllSamples = async (req, res, next) => {
    try {
        const query = `SELECT * FROM "Sample"`;

        const  samples = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });

        samples.forEach(sample => {
            let date = new Date(sample.dateTime);
            date.setMinutes(date.getMinutes() + 330); // Add 330 minutes
            sample.dateTime = date.toISOString().slice(0, -1); // Remove the trailing 'Z'
        });

        console.log(samples);
        

        res.send(samples);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.BadRequest(`Error in getting samples: ${error.message}`));
    }
}

const getSamplesAboveDateTime = async (req, res, next) => {
    try {
        const { dateTime } = req.query;

        if (!dateTime) {
            return next(createError.BadRequest("Please provide a dateTime to filter samples"));
        }

        console.log(dateTime);
        

        const query = `SELECT * FROM "Sample" WHERE "dateTime" > :dateTime`;

        const samples = await sequelize.query(query, {
            replacements: { dateTime },
            type: sequelize.QueryTypes.SELECT
        });

        console.log(samples);
        

        res.send(samples);

    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeDatabaseError") {
            return next(createError.InternalServerError("Database problem, please contact with developer"));
        }

        next(createError.BadRequest(`Error in getting samples: ${error.message}`));
    }
}

module.exports = {  addSample, getAllSamples, getSamplesAboveDateTime };