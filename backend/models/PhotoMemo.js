const mongoose = require("mongoose");

const photoMemoSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        // ✅ 일상 or 여행
        type: { type: String, enum: ["일상", "여행"], default: "일상" },

        // ✅ 일상일 경우 단일 날짜
        date: { type: Date },

        // ✅ 여행일 경우
        tripName: { type: String, trim: true },
        tripStartDate: { type: Date },
        tripEndDate: { type: Date },
        day: { type: String }, // ex: 첫째날, 둘째날
        activity: { type: String }, // ex: 맛집, 카페, 운동 등

        title: { type: String, required: true },
        content: { type: String, trim: true, default: "" },
        imageUrl: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PhotoMemo", photoMemoSchema);
