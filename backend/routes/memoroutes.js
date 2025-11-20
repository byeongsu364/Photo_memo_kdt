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
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/**
 * POST /api/memo
 * presigned 업로드(프론트) → imageUrl 넘어옴
 * 단건/다건 상관없이 항상 groupId 부여하도록 수정
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            type,
            category,
            title,
            content,
            imageUrl,
            isAnonymous,
            date,
            tripName,
            tripStartDate,
            tripEndDate,
            day,
            activity,
            groupId,
            groupTitle,
            totalMemos
        } = req.body;

        if (!title) return res.status(400).json({ message: "제목은 필수입니다." });
        if (!imageUrl) return res.status(400).json({ message: "이미지가 없습니다." });

        // ✅ 항상 groupId 부여 (단일도 포함)
        const resolvedGroupId = groupId || uuidv4();

        // ✅ 그룹 제목도 최소 1개 기본값 보장
        const resolvedGroupTitle =
            groupTitle ||
            tripName ||
            date ||
            "포토메모 그룹";

        const memo = await PhotoMemo.create({
            user: req.user.id,
            type: type || category || "일상",
            title,
            content,
            imageUrl,
            isAnonymous: !!isAnonymous,
            date: date || null,
            tripName: tripName || null,
            tripStartDate: tripStartDate || null,
            tripEndDate: tripEndDate || null,
            day: day || null,
            activity: activity || null,
            groupId: resolvedGroupId,
            groupTitle: resolvedGroupTitle
        });

        // Post에도 복제 (게시판용)
        await Post.create(
            pickDefined({
                user: req.user.id,
                title: resolvedGroupTitle || title,
                content,
                imageUrl,
                isAnonymous: !!isAnonymous,
                groupId: resolvedGroupId,
                groupTitle: resolvedGroupTitle,
                day: type === "여행" ? day : undefined
            })
        );

        console.log(`✅ 업로드 완료: ${title} (그룹ID: ${resolvedGroupId})`);

        return res.status(201).json({
            message: "포토메모 및 게시글 업로드 완료",
            memo
        });
    } catch (error) {
        console.error("❌ 업로드 실패:", error);
        return res.status(500).json({ message: "업로드 실패", error: error.message });
    }
});

/**
 * GET /api/memo/me
 * 내 메모 원본 목록(그룹 정보 포함)
 */
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const memos = await PhotoMemo.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .lean();
        return res.status(200).json(memos);
    } catch (error) {
        console.error("❌ 조회 실패:", error);
        return res.status(500).json({ message: "조회 실패", error: error.message });
    }
});

/**
 * GET /api/memo/group/:groupId
 * 같은 그룹의 메모들 조회
 * → 단일 메모만 있어도 groupId가 존재하므로 항상 정상 반환
 */
router.get("/group/:groupId", authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const list = await PhotoMemo.find({
            user: req.user.id,
            groupId
        })
            .sort({ createdAt: 1 })
            .lean();

        // ✅ 수정: 단일 메모라도 존재하면 성공 응답
        if (!list || list.length === 0) {
            // 혹시 groupId 없이 단일 저장된 메모 대응
            const single = await PhotoMemo.findOne({
                user: req.user.id,
                _id: groupId
            }).lean();
            if (single) {
                return res.json({
                    groupId: single.groupId || single._id,
                    groupTitle: single.groupTitle || single.title,
                    items: [single]
                });
            }
            return res.status(404).json({ message: "그룹 메모가 없습니다." });
        }

        return res.json({
            groupId,
            groupTitle: list[0].groupTitle || list[0].title,
            items: list
        });
    } catch (err) {
        console.error("❌ 그룹 조회 실패:", err);
        return res.status(500).json({ message: "그룹 조회 실패", error: err.message });
    }
});

/**
 * PUT /api/memo/group/:groupId
 * 그룹 제목 변경 + 개별 메모 수정/삭제 일괄 처리
 */
router.put("/group/:groupId", authenticateToken, async (req, res) => {
    const session = await PhotoMemo.startSession();
    session.startTransaction();
    try {
        const { groupId } = req.params;
        const { groupTitle, items = [] } = req.body;

        const existing = await PhotoMemo.find({ user: req.user.id, groupId }).session(session);
        if (!existing.length) {
            await session.abortTransaction();
            return res.status(404).json({ message: "그룹 메모가 없습니다." });
        }

        // 그룹 제목 변경
        if (groupTitle !== undefined) {
            await PhotoMemo.updateMany(
                { user: req.user.id, groupId },
                { $set: { groupTitle } },
                { session }
            );

            const imageUrls = existing.map((m) => m.imageUrl).filter(Boolean);
            if (imageUrls.length) {
                await Post.updateMany(
                    { user: req.user.id, imageUrl: { $in: imageUrls } },
                    { $set: { title: groupTitle } },
                    { session }
                );
            }
        }

        // 개별 아이템 처리
        for (const it of items) {
            const { _id, delete: willDelete, title, content, imageUrl, isAnonymous } = it || {};
            if (!_id) continue;

            if (willDelete) {
                const deleted = await PhotoMemo.findOneAndDelete(
                    { _id, user: req.user.id },
                    { session }
                );
                if (deleted) {
                    await Post.deleteOne(
                        { user: req.user.id, imageUrl: deleted.imageUrl },
                        { session }
                    );
                }
                continue;
            }

            const updated = await PhotoMemo.findOneAndUpdate(
                { _id, user: req.user.id },
                {
                    $set: pickDefined({
                        title,
                        content,
                        imageUrl,
                        isAnonymous: isAnonymous !== undefined ? !!isAnonymous : undefined,
                        groupTitle
                    })
                },
                { new: true, session }
            );

            if (updated) {
                await Post.updateOne(
                    { user: req.user.id, imageUrl: updated.imageUrl },
                    {
                        $set: pickDefined({
                            title: groupTitle || updated.title,
                            content: updated.content,
                            imageUrl: updated.imageUrl,
                            isAnonymous: updated.isAnonymous
                        })
                    },
                    { session }
                );
            }
        }

        await session.commitTransaction();
        const fresh = await PhotoMemo.find({ user: req.user.id, groupId }).sort({ createdAt: 1 });
        return res.json({
            message: "그룹 업데이트 완료",
            groupId,
            groupTitle: groupTitle ?? (fresh[0]?.groupTitle || fresh[0]?.title),
            items: fresh
        });
    } catch (err) {
        await session.abortTransaction();
        console.error("❌ 그룹 수정 실패:", err);
        return res.status(500).json({ message: "그룹 수정 실패", error: err.message });
    } finally {
        session.endSession();
    }
});

/**
 * DELETE /api/memo/:id
 * 메모 1건 삭제 + 동일 이미지의 Post도 삭제
 */
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const memo = await PhotoMemo.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!memo) return res.status(404).json({ message: "메모 없음" });

        await Post.findOneAndDelete({
            user: req.user.id,
            imageUrl: memo.imageUrl
        });

        return res.status(200).json({ message: "삭제 완료" });
    } catch (error) {
        console.error("❌ 삭제 실패:", error);
        return res.status(500).json({ message: "삭제 실패", error: error.message });
    }
});

/**
 * PUT /api/memo/:id
 * 메모 1건 수정 + Post 동기화
 */
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const {
            title,
            content,
            imageUrl,
            isAnonymous,
            type,
            date,
            tripName,
            tripStartDate,
            tripEndDate,
            day,
            activity,
            groupTitle
        } = req.body;

        const update = pickDefined({
            type,
            date,
            tripName,
            tripStartDate,
            tripEndDate,
            day,
            activity,
            title,
            content,
            isAnonymous: isAnonymous !== undefined ? !!isAnonymous : undefined,
            imageUrl,
            groupTitle
        });

        const memo = await PhotoMemo.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: update },
            { new: true }
        );

        if (!memo) return res.status(404).json({ message: "메모 없음" });

        await Post.findOneAndUpdate(
            { user: req.user.id, imageUrl: memo.imageUrl },
            {
                $set: pickDefined({
                    title: groupTitle || memo.title,
                    content: memo.content,
                    imageUrl: memo.imageUrl,
                    isAnonymous: memo.isAnonymous
                })
            }
        );

        return res.status(200).json(memo);
    } catch (error) {
        console.error("❌ 수정 실패:", error);
        return res.status(500).json({ message: "수정 실패", error: error.message });
    }
});

module.exports = router;
