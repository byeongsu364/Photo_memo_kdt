// backend/src/s3.js
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// ✅ 필수 환경변수 확인
const required = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "S3_BUCKET"
];

const missing = required.filter(k => !process.env[k]);
if (missing.length) {
    console.error("[S3 ENV Missing]", missing);
}

// ✅ S3 클라이언트 생성
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const Bucket = process.env.S3_BUCKET;

// ✅ S3 업로드용 presigned URL 생성
async function presignPut(Key, ContentType, sec = 300) {
    if (!Bucket) throw new Error("S3 bucket is undefined");
    if (!Key) throw new Error("Key is required"); // 필수 값 확인

    const cmd = new PutObjectCommand({ Bucket, Key, ContentType });
    return getSignedUrl(s3, cmd, { expiresIn: sec });
}

// ✅ S3 다운로드용 presigned URL 생성
async function presignGet(Key, sec = 300) {
    if (!Bucket) throw new Error("S3 bucket is undefined");
    if (!Key) throw new Error("Key is required"); // 필수 값 확인

    const cmd = new GetObjectCommand({ Bucket, Key });
    return getSignedUrl(s3, cmd, { expiresIn: sec });
}

module.exports = { s3, presignPut, presignGet, Bucket };
