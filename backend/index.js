const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ============================================================
   🔧 파서 설정
============================================================ */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ============================================================
   ⭐ CORS 최종본 — 로컬 + Vercel + CloudType 완전 지원
============================================================ */
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",

    // Vercel 공식 URL
    "https://photo-memo-kdt.vercel.app",

    // CloudType 백엔드 주소
    "https://port-0-photo-memo-kdt-mem3xhkp6425f75b.sel5.cloudtype.app",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true); // Postman 등

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("❌ CORS BLOCKED:", origin);
            return callback(new Error("CORS blocked: " + origin), false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        optionsSuccessStatus: 204,
    })
);

/* ============================================================
   🔌 MongoDB 연결
============================================================ */
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB 연결 성공"))
    .catch((err) => console.error("❌ MongoDB 연결 실패:", err.message));

/* ============================================================
   📌 기본 라우트
============================================================ */
app.get("/", (_req, res) =>
    res.send("📸 PhotoMemo + Post API 정상 작동 중 🚀")
);

/* ============================================================
   📌 실제 API 라우터
============================================================ */
app.use("/api/auth", require("./routes/authroutes"));
app.use("/api/memo", require("./routes/memoroutes"));
app.use("/api/upload", require("./routes/fileroutes"));
app.use("/api/posts", require("./routes/posts"));

/* ============================================================
   ❗ 404 처리
============================================================ */
app.use((req, res) => {
    res.status(404).json({ message: "요청하신 경로를 찾을 수 없습니다." });
});

/* ============================================================
   ❗ 500 에러 처리
============================================================ */
app.use((err, req, res, next) => {
    console.error("🔥 서버 오류:", err);
    res.status(500).json({
        message: "서버 오류가 발생했습니다.",
        error: err.message,
    });
});

/* ============================================================
   🚀 서버 실행
============================================================ */
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
