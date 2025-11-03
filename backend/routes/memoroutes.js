const express = require("express");
const router = express.Router();
const PhotoMemo = require("../models/PhotoMemo");
const Post = require("../models/Post");
const { authenticateToken } = require("../middlewares/auth");

// ✅ 포토메모 업로드 (게시글 자동 생성)
router.post("/", authenticateToken, async (req, res) => {
    try {
        console.log("📩 받은 메모 요청:", req.body);

        const {
            type,
            date,
            tripName,
            tripStartDate,
            tripEndDate,
            day,
            activity,
            title,
            content,
            category,
            imageUrl,
            isAnonymous, // ✅ 추가
        } = req.body;

        if (!title) return res.status(400).json({ message: "제목은 필수입니다." });
        if (!imageUrl) return res.status(400).json({ message: "이미지가 없습니다." });

        // ✅ PhotoMemo 저장
        const memo = await PhotoMemo.create({
            user: req.user.id,
            type: type || category || "일상",
            title,
            content,
            imageUrl,
            isAnonymous: isAnonymous || false,
        });

        // ✅ Post의 number 자동 증가 (유저별)
        const lastPost = await Post.findOne({ user: req.user.id }).sort({ number: -1 });
        const nextNumber = lastPost ? lastPost.number + 1 : 1;

        // ✅ Post 생성
        await Post.create({
            number: nextNumber,
            user: req.user.id,
            title,
            content,
            imageUrl,
            isAnonymous: isAnonymous || false,
        });

        console.log(`✅ 포토메모 + 게시글 업로드 완료 (${isAnonymous ? "익명" : "실명"})`);

        res.status(201).json({
            message: "포토메모 및 게시글 업로드 완료",
            memo,
        });
    } catch (error) {
        console.error("❌ 업로드 실패:", error);
        res.status(500).json({ message: "업로드 실패", error: error.message });
    }
});

// ✅ 내 메모 조회
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const memos = await PhotoMemo.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(memos);
    } catch (error) {
        console.error("❌ 조회 실패:", error);
        res.status(500).json({ message: "조회 실패", error: error.message });
    }
});

// ✅ 메모 삭제 (Post도 같이 삭제)
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const memo = await PhotoMemo.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!memo) return res.status(404).json({ message: "메모 없음" });

        // ✅ Post도 같이 삭제
        await Post.findOneAndDelete({
            title: memo.title,
            user: req.user.id,
        });

        res.status(200).json({ message: "삭제 완료" });
    } catch (error) {
        console.error("❌ 삭제 실패:", error);
        res.status(500).json({ message: "삭제 실패", error: error.message });
    }
});

// ✅ 수정 (PhotoMemo & Post 동기화)
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const {
            type,
            date,
            tripName,
            tripStartDate,
            tripEndDate,
            day,
            activity,
            title,
            content,
            imageUrl,
            isAnonymous,
        } = req.body;

        const update = {
            type,
            date,
            tripName,
            tripStartDate,
            tripEndDate,
            day,
            activity,
            title,
            content,
            isAnonymous: isAnonymous || false,
        };

        if (imageUrl) update.imageUrl = imageUrl;

        // ✅ PhotoMemo 수정
        const memo = await PhotoMemo.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: update },
            { new: true }
        );

        if (!memo) return res.status(404).json({ message: "메모 없음" });

        // ✅ Post 수정
        await Post.findOneAndUpdate(
            { title: title, user: req.user.id },
            { $set: { title, content, imageUrl: memo.imageUrl, isAnonymous } }
        );

        res.status(200).json(memo);
    } catch (error) {
        console.error("❌ 수정 실패:", error);
        res.status(500).json({ message: "수정 실패", error: error.message });
    }
});

module.exports = router;
