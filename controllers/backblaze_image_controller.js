const b2 = require("../helpers/backblaze");
require("dotenv").config();

const getBackBazeImage = async (fileName,next) => {
    try {
        
        const authResponse = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            fileNamePrefix: fileName,
            validDurationInSeconds: 3600,
        });

        const downloadUrl = `https://f005.backblazeb2.com/file/${process.env.BACKBLAZE_BUCKET_NAME}/${fileName}?Authorization=${authResponse.data.authorizationToken}`;
        
        return downloadUrl;


    } catch (error) {
        console.log(`Error geting image from backblaze ${error}`);
        next(`Error geting image from backblaze ${error}`);
    }
}

const uploadImageToBackBaze = async (file,next) => {
    try {

        const fileName = `${Date.now()}-${file.originalname}`;

        const bucketId = process.env.BACKBLAZE_BUCKET_ID;

        const uploadUrlResponse = await b2.getUploadUrl({ bucketId });

        const uploadResponse= await b2.uploadFile({
            uploadUrl: uploadUrlResponse.data.uploadUrl,
            uploadAuthToken: uploadUrlResponse.data.authorizationToken,
            fileName,
            data: file.buffer, // Directly passing the buffer data
            mime: file.mimetype,
        });

        console.log(`Response :- ${uploadResponse.data.fileId}`);
        
        return fileName;

    } catch (error) {
        console.log(`Error geting image from backblaze ${error}`);
        next(`Error geting image from backblaze ${error}`);
    }
}

module.exports = { getBackBazeImage,uploadImageToBackBaze }