const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        // ✅ 작성자 (User 컬렉션 참조)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // ✅ 게시글 고유 번호 (자동 증가)
        number: {
            type: Number,
            required: true,
        },

        // ✅ 제목
        title: {
            type: String,
            required: true,
            trim: true
        },

        // ✅ 내용
        content: {
            type: String,
            required: true,
            trim: true
        },

        // ✅ 첨부파일 (S3 presigned URL 형태 배열)
        fileUrl: {
            type: [String],
            trim: true
        },

        // ✅ 이미지 (썸네일 등 단일 파일 가능)
        imageUrl: {
            type: String,
            trim: true
        },

        // ✅ 조회 로그 (IP, 브라우저 정보 등)
        viewLogs: [
            {
                ip: String,
                userAgent: String,
                timestamp: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        // ✅ 생성 및 수정 시간 자동 기록
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true // createdAt, updatedAt 자동 생성
    }
);

// ✅ 모델 생성
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
