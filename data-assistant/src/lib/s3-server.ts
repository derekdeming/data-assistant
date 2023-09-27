import AWS from "aws-sdk";
import fs from "fs";

export async function downloadFromS3(fileKey: string) {
    try {
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        });

        const s3 = new AWS.S3({
            params: {
                Bucket: process.env.AWS_BUCKET_NAME!,
            }, 
            region: process.env.AWS_REGION!,
            });

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileKey,
        };

        
        const obj = await s3.getObject(params).promise();
        const extension = fileKey.split('.').pop();
        const file_name = `/tmp/data-${Date.now()}.${extension}`;
        fs.writeFileSync(file_name, obj.Body as Buffer);
        return file_name;

    } catch (error) {
        console.error(error);
        return null;
    }
}