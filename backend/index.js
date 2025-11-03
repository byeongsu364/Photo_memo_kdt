const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ JSON 파싱을 cors보다 위에 선언
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ CORS 설정 (기본값 보완)
app.use(
    cors({
        origin: process.env.FRONT_ORIGIN || "http://localhost:5173", // ✅ 기본값 추가
        credentials: true,
    })
);

// ✅ MongoDB 연결
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB 연결 성공"))
    .catch((err) => console.error("❌ MongoDB 연결 실패:", err.message));

// ✅ 기본 라우트 확인용
app.get("/", (_req, res) =>
    res.send("📸 PhotoMemo + Post API 정상 작동 중 🚀")
);

// ✅ 라우터 등록
const authroutes = require("./routes/authroutes");
const memoroutes = require("./routes/memoroutes");
const fileroutes = require("./routes/fileroutes");
const postroutes = require("./routes/posts"); // 🆕 게시글 라우터 추가

// ✅ 실제 경로 등록
app.use("/api/auth", authroutes);
app.use("/api/memo", memoroutes);
app.use("/api/upload", fileroutes);
app.use("/api/posts", postroutes);

// ✅ 404 처리
app.use((req, res) => {
    res.status(404).json({ message: "요청하신 경로를 찾을 수 없습니다." });
});

// ✅ 500 에러 처리
app.use((err, req, res, next) => {
    console.error("🔥 서버 오류:", err);
    res.status(500).json({
        message: "서버 오류가 발생했습니다.",
        error: err.message,
    });
});

// ✅ 서버 실행
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
