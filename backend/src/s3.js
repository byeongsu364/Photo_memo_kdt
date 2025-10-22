const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const Bucket = process.env.S3_BUCKET;

async function presignPut(Key, ContentType, sec = 300) {
    const cmd = new PutObjectCommand({ Bucket, Key, ContentType });
    return getSignedUrl(s3, cmd, { expiresIn: sec });
}

module.exports = { presignPut };
