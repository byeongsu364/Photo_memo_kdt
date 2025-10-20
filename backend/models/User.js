const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
            match: [EMAIL_REGEX, "유효한 이메일"],
        },
        passwordHash: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            trim: true,
            default: "",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isLoggined: {
            type: Boolean,
            default: false,
        },
        loginAttempts: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// ✅ 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function (plain) {
    return await bcrypt.compare(plain, this.passwordHash);
};

// ✅ 민감 정보 제거 후 JSON 반환
userSchema.methods.toSafeJSON = function () {
    const obj = this.toObject({ versionKey: false });
    delete obj.passwordHash;
    delete obj.loginAttempts;
    delete obj.isActive;
    delete obj.isLoggined;
    return obj;
};

module.exports = mongoose.model("User", userSchema);
