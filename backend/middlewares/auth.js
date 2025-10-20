const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
    try {
        // ✅ 올바른 헤더 접근
        const h = req.headers.authorization || '';

        // ✅ Bearer 토큰 형식 처리 + 쿠키 fallback
        const token = h.startsWith('Bearer ')
            ? h.slice(7)
            : (req.cookies?.token || null);

        if (!token) {
            return res.status(401).json({ message: "인증 필요" });
        }

        // ✅ JWT 검증
        req.user = jwt.verify(token, process.env.JWT_SECRET);

        return next();
    } catch (error) {
        return res.status(401).json({
            message: "토큰 무효",
            error: error.message
        });
    }
};
