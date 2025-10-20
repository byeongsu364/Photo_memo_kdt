const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require("../middlewares/auth");

function makeToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            role: user.role,
            email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

// ✅ 회원가입
router.post("/register", async (req, res) => {
    try {
        const { email, password, displayName, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "이메일/비밀번호 필요" });
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(400).json({ message: "이미 가입된 이메일입니다." });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const validRoles = ["user", "admin"];
        const safeRole = validRoles.includes(role) ? role : "user";

        const user = await User.create({
            email,
            displayName,
            passwordHash,
            role: safeRole,
        });

        res.status(201).json({ user: user.toSafeJSON() });
    } catch (error) {
        return res.status(500).json({
            message: "회원가입 실패",
            error: error.message,
        });
    }
});

// ✅ 로그인
const LOCK_MAX = 5;
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            email: email.toLowerCase(),
            isActive: true,
        });

        const invalidMsg = { message: "이메일 또는 비밀번호가 올바르지 않습니다." };

        if (!user) {
            return res.status(400).json({
                ...invalidMsg,
                loginAttempts: null,
                remainingAttempts: null,
                locked: false,
            });
        }

        const ok = await user.comparePassword(password);

        if (!ok) {
            user.loginAttempts += 1;
            const remaining = Math.max(0, LOCK_MAX - user.loginAttempts);

            if (user.loginAttempts >= LOCK_MAX) {
                user.isActive = false;
                await user.save();

                return res.status(423).json({
                    message: "계정이 잠겼습니다. 관리자에게 문의하세요.",
                    loginAttempts: user.loginAttempts,
                    remainingAttempts: 0,
                    locked: true,
                });
            }

            await user.save();
            return res.status(400).json({
                ...invalidMsg,
                loginAttempts: user.loginAttempts,
                remainingAttempts: remaining,
                locked: false,
            });
        }

        // ✅ 로그인 성공
        user.loginAttempts = 0;
        user.isLoggined = true;
        user.lastLoginAt = new Date();
        await user.save();

        const token = makeToken(user);

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            user: user.toSafeJSON(),
            token,
            loginAttempts: 0,
            remainingAttempts: LOCK_MAX,
            locked: false,
        });
    } catch (error) {
        return res.status(500).json({
            message: "로그인 실패",
            error: error.message,
        });
    }
});

// ✅ 인증 이후 라우트 보호
router.use(auth);

// ✅ 내 정보 조회
router.get("/me", async (req, res) => {
    try {
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ message: "사용자 없음" });

        return res.status(200).json(me.toSafeJSON());
    } catch (error) {
        res.status(401).json({ message: "조회 실패", error: error.message });
    }
});

// ✅ 관리자 전용 전체 유저 조회
router.get("/users", async (req, res) => {
    try {
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ message: "사용자 없음" });

        if (me.role !== "admin") {
            return res.status(403).json({ message: "권한 없음" });
        }

        const users = await User.find().select("-passwordHash");
        return res.status(200).json({ users });
    } catch (error) {
        res.status(401).json({ message: "조회 실패", error: error.message });
    }
});

// ✅ 로그아웃
router.post("/logout", async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $set: { isLoggined: false },
        });

        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });

        return res.status(200).json({ message: "로그아웃 성공" });
    } catch (error) {
        return res.status(500).json({
            message: "로그아웃 실패",
            error: error.message,
        });
    }
});

module.exports = router;
