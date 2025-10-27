// middleware/auth.js
const jwt = require("jsonwebtoken");

/**
 * ✅ JWT 인증 미들웨어
 *  - Authorization 헤더 또는 쿠키에서 토큰 추출
 *  - 검증 후 req.user에 저장
 *  - 실패 시 401 또는 403 반환
 */
const authenticateToken = (req, res, next) => {
    try {
        let token = null;

        // 1️⃣ Authorization 헤더에서 Bearer 토큰 추출
        const authHeader = req.headers.authorization || '';
        if (authHeader.toLowerCase().startsWith('bearer ')) {
            token = authHeader.slice(7).trim();
        }

        // 2️⃣ 쿠키에 토큰이 있으면 우선 적용
        if (req.cookies?.token) {
            token = req.cookies.token;
        }

        // 3️⃣ 토큰이 없는 경우
        if (!token) {
            return res.status(401).json({ message: "인증 토큰이 없습니다." });
        }

        // 4️⃣ JWT 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        console.error("❌ 인증 실패:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: "토큰이 만료되었습니다." });
        }
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};

module.exports = { authenticateToken };

