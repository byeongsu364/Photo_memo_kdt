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

    /* 초기 로드 */
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

    /* groupId 기준 그룹화 */
    const grouped = useMemo(() => {
        return memos.reduce((acc, memo) => {
            const key = memo.groupId || memo._id;
            if (!acc[key]) acc[key] = [];
            acc[key].push(memo);
            return acc;
        }, {});
    }, [memos]);

    /* 여행 Day 구조 */
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
       ✅ UI에서 쓰는 이름으로 통일
    =============================== */

    const handleOpenGroup = (groupId) => {
        const group = grouped[groupId];
        if (!group) return;

        const isTravel = group.some((m) => m.day);
        const groupTitle = group[0].groupTitle || group[0].title;

        if (isTravel) {
            const days = makeTravelStructure(group);

            setSelectedGroup({
                groupId,
                groupTitle,
                isTravel: true,
                days,
            });

            setEditItems(
                days.flatMap((d) =>
                    d.memos.map((m) => ({
                        ...m,
                        day: d.day,
                        _delete: false,
                        newTitle: m.title,
                        newContent: m.content,
                        newImage: null,
                    }))
                )
            );
        } else {
            setSelectedGroup({
                groupId,
                groupTitle,
                isTravel: false,
            });

            setEditItems(
                group.map((m) => ({
                    ...m,
                    _delete: false,
                    newTitle: m.title,
                    newContent: m.content,
                    newImage: null,
                }))
            );
        }
    };

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

    const handleSaveGroup = async () => {
        if (!selectedGroup) return;

        try {
            if (!selectedGroup.isTravel && editItems.length === 1) {
                const m = editItems[0];
                await updateMemo(m._id, {
                    title: m.newTitle,
                    content: m.newContent,
                    image: m.newImage,
                });
            } else {
                await updateGroupMemos(selectedGroup.groupId, {
                    groupTitle: selectedGroup.groupTitle,
                    items: editItems.map((m) => ({
                        _id: m._id,
                        title: m.newTitle,
                        content: m.newContent,
                        delete: m._delete,
                        day: m.day,
                        ...(m.newImage ? { newImage: m.newImage } : {}),
                    })),
                });
            }

            await loadMemos();
            setSelectedGroup(null);
            alert("저장 완료!");
        } catch (e) {
            console.error("수정 실패:", e);
            alert("❌ 수정 실패");
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

    /* ✅ UI와 1:1 매칭 */
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
