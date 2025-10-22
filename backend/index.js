const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 미들웨어 설정
app.use(cors({
    origin: process.env.FRONT_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB 연결 성공"))
    .catch((err) => console.error("❌ MongoDB 연결 실패:", err.message));

// ✅ 기본 라우트 확인용
app.get("/", (_req, res) => res.send("📸 PhotoMemo API 정상 작동 중"));

// ✅ 라우터 등록
const authroutes = require("./routes/authroutes");
const memoroutes = require("./routes/memoroutes");
const fileroutes = require("./routes/fileroutes"); // ✅ 오늘 수업 내용 (presign 업로드)

// ✅ 실제 경로 등록
app.use("/api/auth", authroutes);
app.use("/api/memo", memoroutes);
app.use("/api/upload", fileroutes); // ✅ presigned URL 발급용 라우트

// ✅ 공통 에러 핸들링
app.use((req, res) => {
    res.status(404).json({ message: "요청하신 경로를 찾을 수 없습니다." });
});

// ✅ 서버 실행
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
