const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS 설정
app.use(
    cors({
        origin: process.env.FRONT_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// ✅ MongoDB 연결
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB 연결 성공"))
    .catch((err) => console.error("❌ MongoDB 연결 실패:", err.message));

// ✅ 기본 라우트
app.get("/", (_req, res) => res.send("PhotoMemo API OK"));

// ✅ Auth 라우트 연결
const authroutes = require("./routes/authroutes");
app.use("/api/auth", authroutes);

// ✅ 404 핸들러
app.use((req, res) => {
    res.status(404).json({ message: "요청하신 경로를 찾을 수 없습니다." });
});

// ✅ 전역 에러 핸들러
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "서버 내부 오류", error: err.message });
});

// ✅ 서버 실행
app.listen(PORT, () => {
    console.log(`🚀 Server running: http://localhost:${PORT}`);
});
