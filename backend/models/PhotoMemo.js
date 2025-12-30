const mongoose = require("mongoose");

const photoMemoSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        category: {
            type: String,
            enum: ["일상", "여행"],
            default: "일상",
        },

        // 일상
        date: Date,

        // 여행
        tripName: String,
        tripStartDate: Date,
        tripEndDate: Date,
        day: String,

        // 공통
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            default: "",
        },

        imageUrl: {
            type: String,
            required: true,
        },

        // 🔥 여행 대표 썸네일
        thumbnailUrl: {
            type: String,
            default: null,
        },

        groupId: {
            type: String,
            index: true,
            default: null,
        },
        groupTitle: {
            type: String,
            default: null,
        },

        isAnonymous: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/**
 * 썸네일 규칙 (프론트 단순화용)
 * - 여행: thumbnailUrl
 * - 일상: imageUrl
 */
photoMemoSchema.virtual("resolvedThumbnail").get(function () {
    if (this.category === "여행") {
        return this.thumbnailUrl;
    }
    return this.imageUrl;
});

module.exports = mongoose.model("PhotoMemo", photoMemoSchema);
