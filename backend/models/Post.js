const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// ✅ 자동 증가용 Counter 스키마
const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

// ✅ 게시글 스키마
const postSchema = new mongoose.Schema(
    {
        // ✅ 작성자
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // ✅ 게시글 고유 번호 (전체 시스템 기준 자동 증가)
        number: {
            type: Number,
            unique: true,
        },

        // ✅ 제목
        title: {
            type: String,
            required: true,
            trim: true,
        },

        // ✅ 내용
        content: {
            type: String,
            required: true,
            trim: true,
        },

        // ✅ 대표 이미지
        imageUrl: {
            type: String,
            trim: true,
        },

        // ✅ 첨부파일 배열 (S3 URL들)
        fileUrl: {
            type: [String],
            trim: true,
        },

        // ✅ 익명 여부
        isAnonymous: {
            type: Boolean,
            default: false,
        },

        // ✅ 그룹 ID (일상·여행 공통)
        groupId: {
            type: String,
            default: null, // 단일 메모일 땐 null
            index: true,
        },

        // ✅ 그룹 제목 (예: “제주 2박3일 여행”, “주말 일상 모음”)
        groupTitle: {
            type: String,
            trim: true,
            default: null,
        },

        // ✅ 여행 전용 Day 정보 (일상은 null)
        day: {
            type: String,
            trim: true,
            default: null,
        },

        // ✅ 조회 로그
        viewLogs: [
            {
                ip: String,
                userAgent: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true, // createdAt, updatedAt 자동 기록
    }
);

// ✅ 자동 증가 (number)
postSchema.pre("save", async function (next) {
    if (this.isNew) {
        const counter = await Counter.findOneAndUpdate(
            { name: "postNumber" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.number = counter.seq;
    }

    // ✅ 그룹 ID 자동 생성 (여러 메모 업로드 시만)
    if (!this.groupId && this.groupTitle) {
        this.groupId = uuidv4();
    }

    next();
});

// ✅ 모델 생성
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
