const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const mongoose = require("mongoose");
const { authenticateToken } = require("../middlewares/auth");

const S3_BASE_URL =
    process.env.S3_BASE_URL ||
    `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;

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

/* ======================================================
   ⭐ 공통 이미지 정규화 함수 (핵심)
====================================================== */
function normalizeImages(p) {
    const images = Array.isArray(p.fileUrl)
        ? p.fileUrl.map((v) =>
              v.startsWith("http") ? v : joinS3Url(S3_BASE_URL, v)
          )
        : [];

    const thumbnail = p.thumbnailUrl
        ? p.thumbnailUrl.startsWith("http")
            ? p.thumbnailUrl
            : joinS3Url(S3_BASE_URL, p.thumbnailUrl)
        : images[0] || null; // fallback

    return { images, thumbnail };
}

/* ======================================================
   ✅ 게시글 생성
====================================================== */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            title,
            content,
            fileUrl,
            thumbnailUrl,
            isAnonymous,
        } = req.body;

        const files = toArray(fileUrl);
        const uid = req.user._id || req.user.id;

        const latest = await Post.findOne({ user: uid }).sort({ number: -1 });
        const nextNumber = latest ? Number(latest.number) + 1 : 1;

        const post = await Post.create({
            user: uid,
            number: nextNumber,
            title,
            content,
            fileUrl: files,
            thumbnailUrl, // ⭐ 썸네일
            isAnonymous: isAnonymous || false,
        });

        res.status(201).json(post);
    } catch (error) {
        console.error("POST /api/posts 실패:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

/* ======================================================
   ✅ 전체 게시글 조회
====================================================== */
router.get("/", async (req, res) => {
    try {
        const list = await Post.find()
            .populate("user", "displayName")
            .sort({ createdAt: -1 })
            .lean();

        const data = list.map((p) => {
            const { images, thumbnail } = normalizeImages(p);

            return {
                ...p,
                fileUrl: images,
                thumbnailUrl: thumbnail,
                author: p.isAnonymous
                    ? "익명"
                    : p.user?.displayName || "탈퇴한 사용자",
            };
        });

        res.json(data);
    } catch (error) {
        console.error("GET /api/posts 실패:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

/* ======================================================
   ✅ 내 게시글 조회
====================================================== */
router.get("/my", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const myPosts = await Post.find({ user: userId })
            .populate("user", "displayName")
            .sort({ createdAt: -1 })
            .lean();

        const data = myPosts.map((p) => {
            const { images, thumbnail } = normalizeImages(p);

            return {
                ...p,
                fileUrl: images,
                thumbnailUrl: thumbnail,
                author: p.isAnonymous
                    ? "익명"
                    : p.user?.displayName || "탈퇴한 사용자",
            };
        });

        res.json(data);
    } catch (error) {
        console.error("GET /api/posts/my 실패:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

/* ======================================================
   ✅ 게시글 수정
====================================================== */
router.put("/:id", authenticateToken, ensureObjectId, async (req, res) => {
    try {
        const {
            title,
            content,
            fileUrl,
            thumbnailUrl,
            isAnonymous,
        } = req.body;

        const updates = pickDefined({
            title,
            content,
            fileUrl: fileUrl ? toArray(fileUrl) : undefined,
            thumbnailUrl,
            isAnonymous,
        });

        const doc = await Post.findById(req.params.id).select("user").lean();
        if (!doc)
            return res.status(404).json({ message: "존재하지 않는 게시글" });
        if (String(doc.user) !== String(req.user.id))
            return res.status(403).json({ message: "권한이 없습니다." });

        const updated = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );

        res.json(updated);
    } catch (error) {
        console.error("PUT /api/posts/:id 실패:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

/* ======================================================
   ✅ 게시글 삭제
====================================================== */
router.delete("/:id", authenticateToken, ensureObjectId, async (req, res) => {
    try {
        const doc = await Post.findById(req.params.id).select("user");
        if (!doc)
            return res.status(404).json({ message: "존재하지 않는 게시글" });
        if (String(doc.user) !== String(req.user.id))
            return res.status(403).json({ message: "권한이 없습니다." });

        await doc.deleteOne();
        res.json({ ok: true, id: doc._id });
    } catch (error) {
        res.status(500).json({ message: "서버 오류" });
    }
});

/* ======================================================
   ✅ 단일 게시글 조회
====================================================== */
router.get("/:id", ensureObjectId, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("user", "displayName")
            .lean();

        if (!post)
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

        const { images, thumbnail } = normalizeImages(post);

        res.json({
            ...post,
            fileUrl: images,
            thumbnailUrl: thumbnail,
            author: post.isAnonymous
                ? "익명"
                : post.user?.displayName || "탈퇴한 사용자",
        });
    } catch (error) {
        console.error("GET /api/posts/:id 실패:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
