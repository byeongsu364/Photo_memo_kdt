const express = require("express");
const router = express.Router();
const PhotoMemo = require("../models/PhotoMemo");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// ✅ 메모 업로드 (일상 / 여행 자동 구분)
router.post("/", auth, upload.single("image"), async (req, res) => {
    try {
        const {
            type,            // 일상 or 여행
            date,            // 일상 날짜
            tripName,        // 여행 이름
            tripStartDate,   // 여행 시작일
            tripEndDate,     // 여행 종료일
            day,             // 첫째날, 둘째날 ...
            activity,        // 맛집, 카페, 운동 등
            title,
            content,
        } = req.body;

        // ✅ 필수 값 검증
        if (!title || !req.file) {
            return res.status(400).json({ message: "제목과 이미지는 필수입니다." });
        }

        // ✅ 메모 생성
        const memo = await PhotoMemo.create({
            user: req.user.id,
            type: type || "일상",
            date: date || null,
            tripName: tripName || null,
            tripStartDate: tripStartDate || null,
            tripEndDate: tripEndDate || null,
            day: day || null,
            activity: activity || null,
            title,
            content,
            imageUrl: req.file.location,
        });

        return res.status(201).json(memo);
    } catch (error) {
        console.error("❌ 메모 업로드 실패:", error);
        res.status(500).json({ message: "메모 업로드 실패", error: error.message });
    }
});

// ✅ 내 메모 전체 조회
router.get("/me", auth, async (req, res) => {
    try {
        const memos = await PhotoMemo.find({ user: req.user.id }).sort({
            createdAt: -1,
        });
        return res.status(200).json(memos);
    } catch (error) {
        console.error("❌ 조회 실패:", error);
        res.status(500).json({ message: "조회 실패", error: error.message });
    }
});

// ✅ 특정 메모 삭제
router.delete("/:id", auth, async (req, res) => {
    try {
        const memo = await PhotoMemo.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!memo) {
            return res.status(404).json({ message: "메모 없음" });
        }

        return res.status(200).json({ message: "삭제 완료" });
    } catch (error) {
        console.error("❌ 삭제 실패:", error);
        res.status(500).json({ message: "삭제 실패", error: error.message });
    }
});

// ✅ 메모 수정 (이미지 교체 포함)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
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
        };

        if (req.file) {
            update.imageUrl = req.file.location;
        }

        const memo = await PhotoMemo.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: update },
            { new: true }
        );

        if (!memo) {
            return res.status(404).json({ message: "메모 없음" });
        }

        return res.status(200).json(memo);
    } catch (error) {
        console.error("❌ 수정 실패:", error);
        res.status(500).json({ message: "수정 실패", error: error.message });
    }
});

module.exports = router;
