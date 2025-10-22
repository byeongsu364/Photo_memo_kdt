const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    number: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    fileUrl: { type: [String], trim: true },
    viewLogs: [
        {
            ip: String,
            userAgent: String,
            timestamp: { type: Date, default: Date.now },
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
