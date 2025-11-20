import React, { useEffect, useState } from "react";
import {
    fetchMyMemos,
    updateGroupMemos,
    updateMemo,
    deleteMemo,
} from "../../api/client";
import "./style/FileList.scss";

const FileList = () => {
    const [memos, setMemos] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [editItems, setEditItems] = useState([]);

    // 초기 로드
    useEffect(() => {
        (async () => {
            try {
                const data = await fetchMyMemos();
                setMemos(data);
            } catch (err) {
                console.error("불러오기 실패:", err);
            }
        })();
    }, []);

    // 1) groupId 기준 1차 그룹화
    const grouped = memos.reduce((acc, memo) => {
        const key = memo.groupId || memo._id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(memo);
        return acc;
    }, {});

    // 2) 여행이면 Day 기준으로도 재그룹화
    const makeTravelStructure = (groupItems) => {
        const days = groupItems.reduce((acc, memo) => {
            const key = memo.day || "일상";
            if (!acc[key]) acc[key] = [];
            acc[key].push(memo);
            return acc;
        }, {});

        // Day 순서 정렬 (Day 1, Day 2 순서 유지)
        const sortedKeys = Object.keys(days).sort((a, b) => {
            const aNum = parseInt(a.replace(/\D/g, ""));
            const bNum = parseInt(b.replace(/\D/g, ""));
            return aNum - bNum;
        });

        return sortedKeys.map((key) => ({
            day: key,
            memos: days[key],
        }));
    };

    // 그룹 열기
    const handleOpenGroup = (groupId) => {
        const group = grouped[groupId];
        if (!group) return;

        const isTravel = group.some((m) => m.day); // day가 존재하면 여행
        const groupTitle = group[0].groupTitle || group[0].title;

        if (isTravel) {
            // 여행 Day 구조 만들기
            const days = makeTravelStructure(group);

            setSelectedGroup({
                groupId,
                groupTitle,
                isTravel: true,
                days, // ★ Day 구조 저장
            });

            // editItems = 모든 day의 memos를 한 배열로 평탄화
            const flatList = days.flatMap((d) =>
                d.memos.map((m) => ({
                    ...m,
                    day: d.day,
                    _delete: false,
                    newTitle: m.title,
                    newContent: m.content,
                    newImage: null,
                }))
            );

            setEditItems(flatList);
        } else {
            // 일상 그룹 / 단일
            setSelectedGroup({
                groupId,
                groupTitle,
                isTravel: false,
                items: group,
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

    // 제목 변경
    const handleChangeGroupTitle = (e) => {
        setSelectedGroup({ ...selectedGroup, groupTitle: e.target.value });
    };

    // edit 항목 변경
    const handleEditItem = (index, field, value) => {
        setEditItems((prev) =>
            prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
        );
    };

    const toggleDeleteItem = (index) => {
        setEditItems((prev) =>
            prev.map((it, i) =>
                i === index ? { ...it, _delete: !it._delete } : it
            )
        );
    };

    // 저장
    const handleSaveGroup = async () => {
        try {
            if (!selectedGroup) return;

            if (!selectedGroup.isTravel && editItems.length === 1) {
                // 일상 단일
                const m = editItems[0];
                await updateMemo(m._id, {
                    title: m.newTitle,
                    content: m.newContent,
                    image: m.newImage,
                });

            } else {
                // 그룹 / 여행 Day 전부 updateGroupMemos 로 통일
                const itemsPayload = editItems.map((m) => ({
                    _id: m._id,
                    title: m.newTitle,
                    content: m.newContent,
                    delete: m._delete,
                    day: m.day,
                    ...(m.newImage ? { newImage: m.newImage } : {}),
                }));

                await updateGroupMemos(selectedGroup.groupId, {
                    groupTitle: selectedGroup.groupTitle,
                    items: itemsPayload,
                });
            }

            alert("저장 완료!");

            const refreshed = await fetchMyMemos();
            setMemos(refreshed);
            setSelectedGroup(null);
        } catch (err) {
            console.error("수정 실패:", err);
            alert("❌ 수정 실패");
        }
    };

    // 그룹 삭제
    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm("이 그룹의 모든 메모를 삭제할까요?")) return;

        try {
            for (const memo of grouped[groupId]) {
                await deleteMemo(memo._id);
            }
            setMemos((prev) => prev.filter((m) => m.groupId !== groupId));
        } catch (err) {
            console.error("삭제 실패:", err);
        }
    };

    return (
        <section className="file-list-section">
            <h2>📸 내 포토메모 목록</h2>

            {/* 카드 리스트 */}
            <div className="file-list">
                {Object.entries(grouped).map(([groupId, items]) => {
                    const first = items[0];
                    const isTravel = items.some((m) => m.day);
                    const groupTitle = first.groupTitle || first.title;
                    const date = new Date(first.createdAt).toLocaleDateString("ko-KR");

                    return (
                        <div key={groupId} className="file-card">
                            <img
                                src={first.imageUrl}
                                alt={groupTitle}
                                onClick={() => handleOpenGroup(groupId)}
                            />
                            <div className="info">
                                <h3>
                                    {groupTitle} ({items.length}개)
                                    {isTravel && " 🗺️"} {/* 여행 표시 */}
                                </h3>
                                <p>{date}</p>
                                <div className="actions">
                                    <button className="edit-btn" onClick={() => handleOpenGroup(groupId)}>
                                        수정
                                    </button>
                                    <button className="delete-btn" onClick={() => handleDeleteGroup(groupId)}>
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 여행/일상 수정 모달 */}
            {selectedGroup && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>{selectedGroup.isTravel ? "🗺️ 여행 수정" : "📝 메모 수정"}</h3>

                        <input
                            className="group-title-input"
                            type="text"
                            value={selectedGroup.groupTitle}
                            onChange={handleChangeGroupTitle}
                            placeholder="그룹 제목 수정"
                        />

                        <div className="edit-list">
                            {editItems.map((m, i) => (
                                <div key={m._id} className={`edit-item ${m._delete ? "deleted" : ""}`}>
                                    <strong>{m.day}</strong>
                                    <img src={m.imageUrl} alt={m.title} className="preview" />

                                    <div className="edit-fields">
                                        <input
                                            type="text"
                                            value={m.newTitle}
                                            onChange={(e) => handleEditItem(i, "newTitle", e.target.value)}
                                        />
                                        <textarea
                                            value={m.newContent}
                                            onChange={(e) => handleEditItem(i, "newContent", e.target.value)}
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleEditItem(i, "newImage", e.target.files[0])
                                            }
                                        />
                                    </div>

                                    {editItems.length > 1 && (
                                        <button className="delete-toggle" onClick={() => toggleDeleteItem(i)}>
                                            {m._delete ? "복구" : "삭제"}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button className="save-btn" onClick={handleSaveGroup}>저장</button>
                            <button className="cancel-btn" onClick={() => setSelectedGroup(null)}>닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default FileList;
