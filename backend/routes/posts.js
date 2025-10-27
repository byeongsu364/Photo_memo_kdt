const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const mongoose = require("mongoose");
const { authenticateToken } = require("../middlewares/auth");

const S3_BASE_URL = process.env.S3_BASE_URL || `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;

function joinS3Url(base, key) {
    const b = String(base || "").replace(/\/+$/, "");
    const k = String(key || "").replace(/^\/+/, "");
    return `${b}/${k}`;
}

const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === "string") {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [val];
        } catch {
            return [val];
        }
    }
    return [];
};

const ensureObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "잘못된 id 형식입니다." });
    next();
};

const pickDefined = (obj) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

// ✅ 게시글 생성
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, content, fileUrl, imageUrl } = req.body;
        let files = toArray(fileUrl);
        if (!files.length && imageUrl) files = toArray(imageUrl);

        const uid = req.user._id || req.user.id;
        const latest = await Post.findOne({ user: uid }).sort({ number: -1 });
        const nextNumber = latest ? Number(latest.number) + 1 : 1;

        const post = await Post.create({
            user: uid,
            number: nextNumber,
            title,
            content,
            fileUrl: files,
            imageUrl
        });

        res.status(201).json(post);
    } catch (error) {
        console.error("POST /api/posts 실패:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

// ✅ 전체 게시글 조회
router.get("/", async (req, res) => {
    try {
        const list = await Post.find().sort({ createdAt: -1 }).lean();
        const data = list.map((p) => {
            const raw = Array.isArray(p.fileUrl) ? p.fileUrl : p.imageUrl ? [p.imageUrl] : [];
            const urls = raw.map((v) => (v.startsWith("http") ? v : joinS3Url(S3_BASE_URL, v)));
            return { ...p, fileUrl: urls };
        });
        res.json(data);
    } catch (error) {
        console.error("GET /api/posts 실패:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// ✅ 내 게시글 조회
router.get("/my", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const myPosts = await Post.find({ user: userId }).sort({ createdAt: -1 }).lean();

        const data = myPosts.map((p) => {
            const raw = Array.isArray(p.fileUrl) ? p.fileUrl : p.imageUrl ? [p.imageUrl] : [];
            const urls = raw.map((v) => (v.startsWith("http") ? v : joinS3Url(S3_BASE_URL, v)));
            return { ...p, fileUrl: urls };
        });

        res.json(data);
    } catch (error) {
        console.error("GET /api/posts/my 실패:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// ✅ 게시글 수정
router.put("/:id", authenticateToken, ensureObjectId, async (req, res) => {
    try {
        const { title, content, fileUrl, imageUrl } = req.body;
        const updates = pickDefined({
            title,
            content,
            fileUrl: fileUrl ? toArray(fileUrl) : undefined,
            imageUrl
        });

        const doc = await Post.findById(req.params.id).select("user").lean();
        if (!doc) return res.status(404).json({ message: "존재하지 않는 게시글" });
        if (String(doc.user) !== String(req.user.id))
            return res.status(403).json({ message: "권한이 없습니다." });

        const updated = await Post.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
        res.json(updated);
    } catch (error) {
        console.error("PUT /api/posts/:id 실패:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// ✅ 게시글 삭제
router.delete("/:id", authenticateToken, ensureObjectId, async (req, res) => {
    try {
        const doc = await Post.findById(req.params.id).select("user");
        if (!doc) return res.status(404).json({ message: "존재하지 않는 게시글" });
        if (String(doc.user) !== String(req.user.id))
            return res.status(403).json({ message: "권한이 없습니다." });

        await doc.deleteOne();
        res.json({ ok: true, id: doc._id });
    } catch (error) {
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
