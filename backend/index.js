const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 파싱
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ============================================================
   ⭐ CORS 설정 — 로컬 + Vercel + CloudType + 프리뷰 모두 지원
============================================================ */
app.use(
    cors({
        origin: function (origin, callback) {
            const allowed = [
                // 로컬 개발 환경
                "http://localhost:5173",
                "http://localhost:3000",

                // Vercel 정식 배포 도메인
                "https://photo-memo-kdt.vercel.app",

                // Vercel 프리뷰 도메인 허용 (*.vercel.app)
                /^https:\/\/.*\.vercel\.app$/,

                // CloudType 백엔드 도메인
                "https://port-0-photo-memo-kdt-mem3xhkp6425f75b.sel5.cloudtype.app",

                // CloudType 프리뷰 도메인 (*.cloudtype.app)
                /^https:\/\/.*\.cloudtype\.app$/,
            ];

            // origin이 없으면 허용 (Postman 등)
            if (!origin) return callback(null, true);

            // 문자열 매칭 또는 정규식 매칭
            const isAllowed = allowed.some((rule) => {
                if (typeof rule === "string") return rule === origin;
                if (rule instanceof RegExp) return rule.test(origin);
            });

            if (isAllowed) return callback(null, true);

            console.log("❌ CORS 차단됨:", origin);
            return callback(new Error("CORS Blocked: " + origin), false);
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
   📌 기본 라우트 (서버 올라왔는지 확인)
============================================================ */
app.get("/", (_req, res) =>
    res.send("📸 PhotoMemo + Post API 정상 작동 중 🚀")
);

/* ============================================================
   📌 실제 API 라우터 등록
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
   ❗ 500 처리 (공통 오류 핸들러)
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
