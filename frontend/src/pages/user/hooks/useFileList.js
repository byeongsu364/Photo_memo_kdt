import { useEffect, useMemo, useState } from "react";
import {
    fetchMyMemos,
    updateGroupMemos,
    updateMemo,
    deleteMemo,
} from "../../../api/client";

export const useFileList = () => {
    const [memos, setMemos] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [editItems, setEditItems] = useState([]);

    /* ===============================
       초기 로드
    =============================== */
    useEffect(() => {
        loadMemos();
    }, []);

    const loadMemos = async () => {
        try {
            const data = await fetchMyMemos();
            setMemos(data);
        } catch (e) {
            console.error("불러오기 실패:", e);
        }
    };

    /* ===============================
       groupId 기준 그룹화
    =============================== */
    const grouped = useMemo(() => {
        return memos.reduce((acc, memo) => {
            const key = memo.groupId || memo._id;
            if (!acc[key]) acc[key] = [];
            acc[key].push(memo);
            return acc;
        }, {});
    }, [memos]);

    /* ===============================
       DAY1 기준 정렬
    =============================== */
    const sortGroup = (group) =>
        [...group].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

    /* ===============================
       대표 썸네일 계산
    =============================== */
    const getThumbnailFromGroup = (group) => {
        if (!group?.length) return null;

        const resolved = group.find(
            (m) => m.resolvedThumbnail
        )?.resolvedThumbnail;
        if (resolved) return resolved;

        const travelThumb = group.find(
            (m) => m.thumbnailUrl
        )?.thumbnailUrl;
        if (travelThumb) return travelThumb;

        return sortGroup(group)[0]?.imageUrl || null;
    };

    /* ===============================
       여행 Day 구조
    =============================== */
    const makeTravelStructure = (groupItems) => {
        const days = groupItems.reduce((acc, memo) => {
            const key = memo.day || "일상";
            if (!acc[key]) acc[key] = [];
            acc[key].push(memo);
            return acc;
        }, {});

        return Object.keys(days)
            .sort(
                (a, b) =>
                    parseInt(a.replace(/\D/g, "")) -
                    parseInt(b.replace(/\D/g, ""))
            )
            .map((day) => ({ day, memos: days[day] }));
    };

    /* ===============================
       그룹 열기
    =============================== */
    const handleOpenGroup = (groupId) => {
        const group = grouped[groupId];
        if (!group) return;

        const sortedGroup = sortGroup(group);
        const isTravel = sortedGroup.some((m) => m.day);
        const groupTitle =
            sortedGroup[0].groupTitle || sortedGroup[0].title;

        const thumbnail = getThumbnailFromGroup(sortedGroup);

        setSelectedGroup({
            groupId,
            groupTitle,
            isTravel,
            thumbnail,
            days: isTravel ? makeTravelStructure(sortedGroup) : null,
        });

        setEditItems(
            sortedGroup.map((m) => ({
                ...m,
                _delete: false,
                isThumbnail: m.thumbnailUrl === thumbnail,
                removeThumbnail: false,
                newThumbnail: null,
                newTitle: m.title,
                newContent: m.content,
                newImage: null,
            }))
        );
    };

    /* ===============================
       ESC 닫기
    =============================== */
    useEffect(() => {
        if (!selectedGroup) return;
        const onKey = (e) => e.key === "Escape" && setSelectedGroup(null);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selectedGroup]);

    /* ===============================
       편집 핸들러
    =============================== */
    const handleChangeGroupTitle = (e) => {
        setSelectedGroup((prev) => ({
            ...prev,
            groupTitle: e.target.value,
        }));
    };

    const handleEditItem = (index, field, value) => {
        setEditItems((prev) =>
            prev.map((it, i) =>
                i === index ? { ...it, [field]: value } : it
            )
        );
    };

    const toggleDeleteItem = (index) => {
        setEditItems((prev) =>
            prev.map((it, i) =>
                i === index ? { ...it, _delete: !it._delete } : it
            )
        );
    };

    /* ===============================
       저장 (🔥 썸네일 포함 핵심)
    =============================== */
    const handleSaveGroup = async () => {
        if (!selectedGroup) return;

        try {
            await updateGroupMemos(selectedGroup.groupId, {
                groupTitle: selectedGroup.groupTitle,
                items: editItems.map((m) => ({
                    _id: m._id,
                    title: m.newTitle,
                    content: m.newContent,
                    delete: m._delete,
                    day: m.day,

                    // 🔥 썸네일 제어
                    ...(m.isThumbnail && m.newThumbnail
                        ? { newThumbnail: m.newThumbnail }
                        : {}),
                    ...(m.isThumbnail && m.removeThumbnail
                        ? { removeThumbnail: true }
                        : {}),
                    ...(m.isThumbnail &&
                        !m.newThumbnail &&
                        !m.removeThumbnail
                        ? { thumbnailUrl: m.imageUrl }
                        : {}),
                })),
            });

            await loadMemos();
            setSelectedGroup(null);
            alert("저장 완료");
        } catch (e) {
            console.error("수정 실패:", e);
            alert("수정 실패");
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm("이 그룹의 모든 메모를 삭제할까요?")) return;
        try {
            for (const memo of grouped[groupId]) {
                await deleteMemo(memo._id);
            }
            await loadMemos();
        } catch (e) {
            console.error("삭제 실패:", e);
        }
    };

    const closeGroup = () => setSelectedGroup(null);

    return {
        grouped,
        selectedGroup,
        editItems,
        handleOpenGroup,
        handleChangeGroupTitle,
        handleEditItem,
        toggleDeleteItem,
        handleSaveGroup,
        handleDeleteGroup,
        closeGroup,
    };
};
