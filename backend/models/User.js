const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
    {
        // ✅ 이메일
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
            match: [EMAIL_REGEX, "유효한 이메일 형식이 아닙니다."],
        },

        // ✅ 비밀번호 해시
        passwordHash: {
            type: String,
            required: true,
        },

        // ✅ 유저 이름 (게시글에 표시될 이름)
        displayName: {
            type: String,
            required: true,
            trim: true,
        },

        // ✅ 역할
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
            index: true,
        },

        // ✅ 활성화 여부
        isActive: {
            type: Boolean,
            default: true,
        },

        // ✅ 로그인 상태
        isLoggined: {
            type: Boolean,
            default: false,
        },

        // ✅ 로그인 시도 횟수
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

// ✅ 민감 정보 제거 후 안전한 JSON 반환
userSchema.methods.toSafeJSON = function () {
    const obj = this.toObject({ versionKey: false });
    delete obj.passwordHash;
    delete obj.loginAttempts;
    delete obj.isActive;
    delete obj.isLoggined;
    return obj;
};

module.exports = mongoose.model("User", userSchema);
