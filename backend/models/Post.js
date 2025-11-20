const mongoose = require("mongoose");
const crypto = require("crypto");  // ← uuid 대신 crypto 사용

// 랜덤 ID 생성 함수
function generateUUID() {
    return crypto.randomUUID();
}

// ✅ 자동 증가용 Counter 스키마
const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

// ✅ 게시글 스키마
const postSchema = new mongoose.Schema(
    {
        // 작성자
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // 게시글 고유 번호 (자동 증가)
        number: {
            type: Number,
            unique: true,
        },

        // 제목
        title: {
            type: String,
            required: true,
            trim: true,
        },

        // 내용
        content: {
            type: String,
            required: true,
            trim: true,
        },

        // 대표 이미지
        imageUrl: {
            type: String,
            trim: true,
        },

        // 첨부파일 배열 (S3 URL)
        fileUrl: {
            type: [String],
            trim: true,
        },

        // 익명 여부
        isAnonymous: {
            type: Boolean,
            default: false,
        },

        // 그룹 ID (여행/일상 묶음)
        groupId: {
            type: String,
            default: null,
            index: true,
        },

        // 그룹 제목
        groupTitle: {
            type: String,
            trim: true,
            default: null,
        },

        // 여행 day 정보
        day: {
            type: String,
            trim: true,
            default: null,
        },

        // 조회 로그
        viewLogs: [
            {
                ip: String,
                userAgent: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// ✅ 자동 증가 + groupId 생성
postSchema.pre("save", async function (next) {
    if (this.isNew) {
        const counter = await Counter.findOneAndUpdate(
            { name: "postNumber" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.number = counter.seq;
    }

    // 그룹 ID 생성 (여러 메모 묶음일 때만)
    if (!this.groupId && this.groupTitle) {
        this.groupId = generateUUID();
    }

    next();
});

// 모델 생성
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
