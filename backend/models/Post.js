const mongoose = require("mongoose");
const crypto = require("crypto");

// 랜덤 ID 생성
function generateUUID() {
    return crypto.randomUUID();
}

/* ============================
   자동 증가 Counter
============================ */
const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

/* ============================
   게시글(Post) 스키마
============================ */
const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        number: {
            type: Number,
            unique: true,
        },

        category: {
            type: String,
            enum: ["일상", "여행"],
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        /*
         썸네일 규칙
         - 여행: 업로드한 thumbnailUrl 사용
         - 일상: 저장은 안 함 (첫 번째 fileUrl로 계산)
        */
        thumbnailUrl: {
            type: String,
            trim: true,
            default: null,
        },

        // 메모 이미지들
        fileUrl: {
            type: [String],
            default: [],
        },

        isAnonymous: {
            type: Boolean,
            default: false,
        },

        groupId: {
            type: String,
            default: null,
            index: true,
        },

        groupTitle: {
            type: String,
            trim: true,
            default: null,
        },

        day: {
            type: String,
            trim: true,
            default: null,
        },

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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/* ============================
   썸네일 계산 (핵심)
============================ */
postSchema.virtual("resolvedThumbnail").get(function () {
    if (this.category === "여행") {
        return this.thumbnailUrl || null;
    }
    return this.fileUrl?.[0] || null;
});

/* ============================
   자동 증가 + groupId
============================ */
postSchema.pre("save", async function (next) {
    if (this.isNew) {
        const counter = await Counter.findOneAndUpdate(
            { name: "postNumber" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.number = counter.seq;
    }

    if (!this.groupId && this.groupTitle) {
        this.groupId = generateUUID();
    }

    next();
});

module.exports = mongoose.model("Post", postSchema);
