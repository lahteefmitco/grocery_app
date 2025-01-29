
const { exec } = require("child_process");

const DB_USER = process.env.AIVEN_DATABASE_USER;
const DB_HOST = process.env.AIVEN_DATABASE_HOST;
const DB_NAME = process.env.AIVEN_DATABASE_NAME;
const DB_PASSWORD = process.env.AIVEN_DATABASE_PASSWORD;
const DB_PORT = process.env.AIVEN_DATABASE_PORT;


const backUp = async (req, res, next) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFileName = `backup_${timestamp}.sql`;

        // Run pg_dump and capture output as a buffer
        const command = `PGPASSWORD="${DB_PASSWORD}" pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -F c -b -v ${DB_NAME}`;

        exec(command, { encoding: "buffer", maxBuffer: 1024 * 1024 * 50 }, async (error, stdout, stderr) => {
            if (error) {
                console.error("Backup error:", stderr);
                return res.status(500).json({ message: "Backup failed", error: stderr });
            }

            // Convert buffer output to byte array
            const byteArray = Buffer.from(stdout);

            // Upload backup to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from("backups") // Ensure this storage bucket exists in Supabase
                .upload(backupFileName, byteArray, {
                    contentType: "application/octet-stream",
                    cacheControl: "3600",
                    upsert: true
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                return res.status(500).json({ message: "Upload failed", error: uploadError });
            }

            console.log("Backup uploaded successfully:", data.path);
            res.json({ message: "Backup uploaded successfully", path: data.path });
        });
    } catch (error) {
        console.log(error);

        next(error);
    }
}


module.exports = { backUp };
