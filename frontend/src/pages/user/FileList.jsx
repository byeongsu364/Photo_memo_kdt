import React, { useEffect, useState } from "react";
import {
    fetchMyMemos,
    fetchGroupMemos,
    updateGroupMemos,
    deleteMemo,
} from "../../api/client";
import "./style/FileList.scss";

const FileList = () => {
    const [memos, setMemos] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null); // ✅ 선택된 그룹 (groupId, items 등)
    const [editItems, setEditItems] = useState([]); // ✅ 그룹 내 메모 수정 데이터

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

    // 그룹화
    const grouped = memos.reduce((acc, memo) => {
        const key = memo.groupId || memo._id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(memo);
        return acc;
    }, {});

    // ✅ 그룹 클릭 → 그룹 전체 불러오기
    const handleOpenGroup = async (groupId) => {
        try {
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

    // ✅ 그룹명 변경
    const handleChangeGroupTitle = (e) => {
        setSelectedGroup({
            ...selectedGroup,
            groupTitle: e.target.value,
        });
    };

    // ✅ 개별 메모 내용 변경
    const handleEditItem = (index, field, value) => {
        setEditItems((prev) =>
            prev.map((it, i) =>
                i === index ? { ...it, [field]: value } : it
            )
        );
    };

    // ✅ 개별 메모 삭제 토글
    const toggleDeleteItem = (index) => {
        setEditItems((prev) =>
            prev.map((it, i) =>
                i === index ? { ...it, _delete: !it._delete } : it
            )
        );
    };

    // ✅ 그룹 수정 저장
    const handleSaveGroup = async () => {
        try {
            const itemsPayload = editItems.map((m) => ({
                _id: m._id,
                title: m.newTitle,
                content: m.newContent,
                delete: m._delete,
                ...(m.newImage ? { newImage: m.newImage } : {}),
            }));

            const res = await updateGroupMemos(selectedGroup.groupId, {
                groupTitle: selectedGroup.groupTitle,
                items: itemsPayload,
            });

            alert("✅ 그룹이 수정되었습니다");
            setSelectedGroup(null);

            // 새로고침 없이 로컬 반영
            const refreshed = await fetchMyMemos();
            setMemos(refreshed);
        } catch (err) {
            console.error("그룹 수정 실패:", err);
            alert("그룹 수정 중 오류 발생");
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
                                onClick={() => handleOpenGroup(groupId)} // ✅ 클릭 시 그룹 전체 수정 모달 열기
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

            {/* ✅ 그룹 수정 모달 */}
            {selectedGroup && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>📁 그룹 수정</h3>
                        <input
                            type="text"
                            value={selectedGroup.groupTitle}
                            onChange={handleChangeGroupTitle}
                            placeholder="그룹 제목 수정"
                        />

                        <div
                            style={{
                                maxHeight: "45vh",
                                overflowY: "auto",
                                marginTop: "1rem",
                            }}
                        >
                            {editItems.map((m, i) => (
                                <div
                                    key={m._id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: "0.6rem",
                                        padding: "0.8rem",
                                        marginBottom: "0.6rem",
                                        background: m._delete
                                            ? "#fef2f2"
                                            : "white",
                                    }}
                                >
                                    <div style={{ display: "flex", gap: "1rem" }}>
                                        <img
                                            src={m.imageUrl}
                                            alt={m.title}
                                            style={{
                                                width: "80px",
                                                height: "80px",
                                                borderRadius: "0.6rem",
                                                objectFit: "cover",
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
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
                                                style={{ width: "100%" }}
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
                                                style={{
                                                    width: "100%",
                                                    height: "60px",
                                                    marginTop: "4px",
                                                }}
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
                                        <button
                                            className="delete-btn"
                                            style={{ height: "2.8rem" }}
                                            onClick={() => toggleDeleteItem(i)}
                                        >
                                            {m._delete ? "복구" : "삭제"}
                                        </button>
                                    </div>
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
