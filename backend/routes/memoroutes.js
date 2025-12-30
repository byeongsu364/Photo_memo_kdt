const express = require("express");
const router = express.Router();
const PhotoMemo = require("../models/PhotoMemo");
const Post = require("../models/Post");
const { authenticateToken } = require("../middlewares/auth");
const crypto = require("crypto");

function uuidv4() {
    return crypto.randomUUID();
}

// truthy만 추려서 업데이트에 사용
const pickDefined = (obj) =>
    Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
    );

/**
 * POST /api/memo
 * 포토메모 업로드 + Post 자동 생성
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            category,
            title,
            content,
            imageUrl,
            thumbnailUrl,
            isAnonymous,
            date,
            tripName,
            tripStartDate,
            tripEndDate,
            day,
            groupId,
            groupTitle,
        } = req.body;

        if (!title)
            return res
                .status(400)
                .json({ message: "제목은 필수입니다." });
        if (!imageUrl)
            return res
                .status(400)
                .json({ message: "이미지가 없습니다." });
        if (!category)
            return res
                .status(400)
                .json({ message: "category는 필수입니다." });

        const resolvedGroupId = groupId || uuidv4();
        const resolvedGroupTitle =
            groupTitle || tripName || date || "포토메모";

        // 🔥 여행 썸네일 결정
        const resolvedThumbnailUrl =
            category === "여행"
                ? thumbnailUrl || imageUrl
                : null;

        /* =========================
           1️⃣ PhotoMemo 저장
        ========================= */
        const memo = await PhotoMemo.create({
            user: req.user.id,
            category,
            title,
            content,
            imageUrl,
            thumbnailUrl: resolvedThumbnailUrl,
            isAnonymous: !!isAnonymous,
            date: category === "일상" ? date : null,
            tripName: category === "여행" ? tripName : null,
            tripStartDate: category === "여행" ? tripStartDate : null,
            tripEndDate: category === "여행" ? tripEndDate : null,
            day: category === "여행" ? day : null,
            groupId: resolvedGroupId,
            groupTitle: resolvedGroupTitle,
        });

        /* =========================
           2️⃣ Post 생성
        ========================= */
        await Post.create({
            user: req.user.id,
            title: resolvedGroupTitle,
            content,
            category,
            fileUrl: [imageUrl],
            thumbnailUrl:
                category === "여행"
                    ? resolvedThumbnailUrl
                    : imageUrl,
            isAnonymous: !!isAnonymous,
            groupId: resolvedGroupId,
            groupTitle: resolvedGroupTitle,
            day: category === "여행" ? day : undefined,
        });

        return res.status(201).json({
            message: "포토메모 + 게시글 업로드 완료",
            memo,
        });
    } catch (error) {
        console.error("❌ 업로드 실패:", error);
        return res.status(500).json({
            message: "업로드 실패",
            error: error.message,
        });
    }
});

/**
 * GET /api/memo/me
 */
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const memos = await PhotoMemo.find({
            user: req.user.id,
        })
            .sort({ createdAt: -1 })
            .lean({ virtuals: true });

        return res.status(200).json(memos);
    } catch (error) {
        return res.status(500).json({
            message: "조회 실패",
            error: error.message,
        });
    }
});

/**
 * GET /api/memo/group/:groupId
 */
router.get("/group/:groupId", authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;

        const items = await PhotoMemo.find({
            user: req.user.id,
            groupId,
        })
            .sort({ createdAt: 1 })
            .lean({ virtuals: true });

        if (!items.length) {
            return res
                .status(404)
                .json({ message: "그룹 메모 없음" });
        }

        return res.json({
            groupId,
            groupTitle: items[0].groupTitle,
            items,
        });
    } catch (err) {
        return res.status(500).json({
            message: "그룹 조회 실패",
            error: err.message,
        });
    }
});

/**
 * PUT /api/memo/group/:groupId
 * ✔ 그룹 제목 수정
 * ✔ 대표 썸네일 선택
 * ✔ 새 썸네일 업로드
 * ✔ 대표 썸네일 삭제
 */
router.put("/group/:groupId", authenticateToken, async (req, res) => {
    const session = await PhotoMemo.startSession();
    session.startTransaction();

    try {
        const { groupId } = req.params;
        const { groupTitle, items = [] } = req.body;

        const existing = await PhotoMemo.find({
            user: req.user.id,
            groupId,
        }).session(session);

        if (!existing.length) {
            await session.abortTransaction();
            return res
                .status(404)
                .json({ message: "그룹 없음" });
        }

        /* =====================================
           🔥 대표 썸네일 처리 (선택 / 업로드 / 삭제)
        ===================================== */
        const thumbItem = items.find(
            (it) =>
                it.thumbnailUrl ||
                it.newThumbnail ||
                it.removeThumbnail
        );

        if (thumbItem) {
            // 1️⃣ 기존 썸네일 전부 제거
            await PhotoMemo.updateMany(
                { user: req.user.id, groupId },
                { $unset: { thumbnailUrl: "" } },
                { session }
            );

            // 2️⃣ 삭제 요청
            if (thumbItem.removeThumbnail) {
                await Post.updateMany(
                    { user: req.user.id, groupId },
                    { $unset: { thumbnailUrl: "" } },
                    { session }
                );
            } else {
                // 3️⃣ 새 썸네일 URL 결정
                const nextThumbUrl =
                    thumbItem.newThumbnail ||
                    thumbItem.thumbnailUrl;

                // 4️⃣ 선택된 메모에만 썸네일 설정
                await PhotoMemo.updateOne(
                    {
                        _id: thumbItem._id,
                        user: req.user.id,
                    },
                    { $set: { thumbnailUrl: nextThumbUrl } },
                    { session }
                );

                await Post.updateMany(
                    { user: req.user.id, groupId },
                    { $set: { thumbnailUrl: nextThumbUrl } },
                    { session }
                );
            }
        }

        /* =====================================
           그룹 제목 수정
        ===================================== */
        if (groupTitle !== undefined) {
            await PhotoMemo.updateMany(
                { user: req.user.id, groupId },
                { $set: { groupTitle } },
                { session }
            );

            await Post.updateMany(
                { user: req.user.id, groupId },
                { $set: { title: groupTitle, groupTitle } },
                { session }
            );
        }

        await session.commitTransaction();

        const fresh = await PhotoMemo.find({
            user: req.user.id,
            groupId,
        })
            .sort({ createdAt: 1 })
            .lean({ virtuals: true });

        return res.json({
            message: "그룹 수정 완료",
            groupId,
            groupTitle,
            items: fresh,
        });
    } catch (err) {
        await session.abortTransaction();
        return res.status(500).json({
            message: "그룹 수정 실패",
            error: err.message,
        });
    } finally {
        session.endSession();
    }
});

module.exports = router;
