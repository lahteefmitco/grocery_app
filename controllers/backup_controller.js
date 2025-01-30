
const { exec } = require("child_process");
require("dotenv").config();
const supabase = require("../helpers/supabase_client");

const DB_USER = process.env.AIVEN_DATABASE_USER;
const DB_HOST = process.env.AIVEN_DATABASE_HOST;
const DB_NAME = process.env.AIVEN_DATABASE_NAME;
const DB_PASSWORD = process.env.AIVEN_DATABASE_PASSWORD;
const DB_PORT = process.env.AIVEN_DATABASE_PORT;

// const DB_USER = "postgres";
// const DB_HOST = "localhost";
// const DB_NAME = "grocery";
// const DB_PASSWORD = "la@1234";
// const DB_PORT = "5432";


const backUp = async (req, res, next) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        console.log(`Time stamp:- ${timestamp}`);
        
        const backupFileName = `backup_${timestamp}.sql`;

        // Construct the pg_dump command
        const command = `pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -F c -b -v ${DB_NAME}`;

        exec(command, { env: { ...process.env, PGPASSWORD: DB_PASSWORD }, encoding: "buffer", maxBuffer: 1024 * 1024 * 50 }, async (error, stdout, stderr) => {
            if (error) {
                console.error("Backup error:", stderr.toString());
                return res.status(500).json({ message: "Backup failed", error: stderr });
            }

            // Convert buffer output to byte array
            const byteArray = Buffer.from(stdout);

            // // Upload backup to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from("backup") // Ensure this storage bucket exists in Supabase
                .upload(backupFileName, byteArray, {
                    contentType: "application/octet-stream",
                    cacheControl: "3600",
                    upsert: true
                });

            if (uploadError) {
                console.error("sUPABASE Upload error:", uploadError);
                return res.status(500).json({ message: "Upload failed", error: uploadError });
            }

             console.log("Backup uploaded successfully:", data.path);
             res.json({ message: "Backup uploaded successfully"});
        });
    } catch (error) {
        console.log(error);

        next(error);
    }
}


module.exports = { backUp };
