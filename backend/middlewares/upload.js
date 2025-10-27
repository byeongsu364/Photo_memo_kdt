// backend/middlewares/upload.js
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");
const crypto = require("crypto");

// ✅ S3 클라이언트 (AWS SDK v3)
const s3 = new S3Client({
    region: "ap-northeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// ✅ 허용 확장자
const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

const upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            if (!allowedExtensions.includes(ext)) {
                const err = new Error("허용되지 않은 파일 형식입니다.");
                err.status = 400;
                return cb(err);
            }

            const uniqueName = `photoMemo/${Date.now()}_${crypto.randomUUID()}${ext}`;
            cb(null, uniqueName);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
