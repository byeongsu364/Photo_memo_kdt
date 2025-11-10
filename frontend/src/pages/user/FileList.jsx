import React, { useEffect, useState } from "react";
import {
    fetchMyMemos,
    fetchGroupMemos,
    updateGroupMemos,
    updateMemo,
    deleteMemo,
} from "../../api/client";
import "./style/FileList.scss";

const FileList = () => {
    const [memos, setMemos] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [editItems, setEditItems] = useState([]);

    // ✅ 초기 로드
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

    // ✅ 그룹화
    const grouped = memos.reduce((acc, memo) => {
        const key = memo.groupId || memo._id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(memo);
        return acc;
    }, {});

    // ✅ 그룹 또는 단일 열기
    const handleOpenGroup = async (groupId) => {
        try {
            const group = grouped[groupId];
            if (!group || group.length === 1) {
                const single = group ? group[0] : memos.find((m) => m._id === groupId);
                if (!single) return;

                setSelectedGroup({
                    groupId: single.groupId || single._id,
                    groupTitle: single.groupTitle || single.title,
                    items: [single],
                });

                setEditItems([
                    {
                        ...single,
                        _delete: false,
                        newTitle: single.title,
                        newContent: single.content,
                        newImage: null,
                    },
                ]);
                return;
            }

            const groupData = await fetchGroupMemos(groupId);
            setSelectedGroup(groupData);
            setEditItems(
                groupData.items.map((m) => ({
                    ...m,
                    _delete: false,
                    newTitle: m.title,
                    newContent: m.content,
                    newImage: null,
                }))
            );
        } catch (err) {
            console.error("그룹 불러오기 실패:", err);
        }
    };

    // ✅ 입력 변경
    const handleEditItem = (index, field, value) => {
        setEditItems((prev) =>
            prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
        );
    };

    const handleChangeGroupTitle = (e) => {
        setSelectedGroup({ ...selectedGroup, groupTitle: e.target.value });
    };

    // ✅ 삭제 토글
    const toggleDeleteItem = (index) => {
        setEditItems((prev) =>
            prev.map((it, i) =>
                i === index ? { ...it, _delete: !it._delete } : it
            )
        );
    };

    // ✅ 저장
    const handleSaveGroup = async () => {
        try {
            if (!selectedGroup) return;

            if (editItems.length === 1) {
                const m = editItems[0];
                await updateMemo(m._id, {
                    title: m.newTitle,
                    content: m.newContent,
                    image: m.newImage,
                });
                alert("✅ 메모가 수정되었습니다");
            } else {
                const itemsPayload = editItems.map((m) => ({
                    _id: m._id,
                    title: m.newTitle,
                    content: m.newContent,
                    delete: m._delete,
                    ...(m.newImage ? { newImage: m.newImage } : {}),
                }));
                await updateGroupMemos(selectedGroup.groupId, {
                    groupTitle: selectedGroup.groupTitle,
                    items: itemsPayload,
                });
                alert("✅ 그룹이 수정되었습니다");
            }

            const refreshed = await fetchMyMemos();
            setMemos(refreshed);
            setSelectedGroup(null);
        } catch (err) {
            console.error("수정 실패:", err);
            alert("❌ 수정 중 오류 발생");
        }
    };

    // ✅ 그룹 삭제
    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm("이 그룹의 모든 메모를 삭제할까요?")) return;
        try {
            for (const memo of grouped[groupId]) {
                await deleteMemo(memo._id);
            }
            setMemos((prev) => prev.filter((m) => m.groupId !== groupId));
        } catch (err) {
            console.error("그룹 삭제 실패:", err);
        }
    };

    return (
        <section className="file-list-section">
            <h2>📸 내 포토메모 목록</h2>

            <div className="file-list">
                {Object.entries(grouped).map(([groupId, items]) => {
                    const first = items[0];
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
                                </h3>
                                <p>{date}</p>
                                <div className="actions">
                                    <button
                                        className="edit-btn"
                                        onClick={() => handleOpenGroup(groupId)}
                                    >
                                        그룹 수정
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDeleteGroup(groupId)}
                                    >
                                        그룹 삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ✅ 그룹/단일 수정 모달 */}
            {selectedGroup && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>
                            {editItems.length > 1 ? "📁 그룹 수정" : "📝 메모 수정"}
                        </h3>

                        <input
                            className="group-title-input"
                            type="text"
                            value={selectedGroup.groupTitle}
                            onChange={handleChangeGroupTitle}
                            placeholder="그룹 제목 수정"
                        />

                        <div className="edit-list">
                            {editItems.map((m, i) => (
                                <div
                                    key={`제목:${m._id}`}
                                    className={`edit-item ${
                                        m._delete ? "deleted" : ""
                                    }`}
                                >
                                    <img
                                        src={m.imageUrl}
                                        alt={m.title}
                                        className="preview"
                                    />
                                    <div className="edit-fields">
                                        <input
                                            type="text"
                                            value={m.newTitle}
                                            onChange={(e) =>
                                                handleEditItem(
                                                    i,
                                                    "newTitle",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="제목"
                                        />
                                        <textarea
                                            value={m.newContent}
                                            onChange={(e) =>
                                                handleEditItem(
                                                    i,
                                                    "newContent",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="내용"
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleEditItem(
                                                    i,
                                                    "newImage",
                                                    e.target.files[0]
                                                )
                                            }
                                        />
                                    </div>

                                    {editItems.length > 1 && (
                                        <button
                                            className="delete-toggle"
                                            onClick={() => toggleDeleteItem(i)}
                                        >
                                            {m._delete ? "복구" : "삭제"}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button className="save-btn" onClick={handleSaveGroup}>
                                저장
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={() => setSelectedGroup(null)}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default FileList;
