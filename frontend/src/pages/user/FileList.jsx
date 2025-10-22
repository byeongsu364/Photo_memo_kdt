import React, { useEffect, useState } from "react";
import { fetchMyMemos, deleteMemo, updateMemo } from "../../api/client";
import "./style/FileList.scss";

const FileList = () => {
    const [memos, setMemos] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ title: "", content: "" });

    // ✅ 메모 불러오기
    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchMyMemos();
                setMemos(data);
            } catch (err) {
                console.error("불러오기 실패:", err);
            }
        };
        load();
    }, []);

    // ✅ 삭제
    const handleDelete = async (id) => {
        if (!window.confirm("정말 삭제할까요?")) return;
        try {
            await deleteMemo(id);
            setMemos((prev) => prev.filter((m) => m._id !== id));
        } catch (err) {
            console.error("삭제 실패:", err);
        }
    };

    // ✅ 수정 모드 진입
    const handleEdit = (memo) => {
        setEditingId(memo._id);
        setEditData({ title: memo.title, content: memo.content });
    };

    // ✅ 수정 완료
    const handleUpdate = async (id) => {
        try {
            await updateMemo(id, editData);
            setEditingId(null);
            const updated = await fetchMyMemos();
            setMemos(updated);
        } catch (err) {
            console.error("수정 실패:", err);
        }
    };

    return (
        <section className="file-list-section">
            <h2>📸 내 포토메모 목록</h2>

            <div className="file-list">
                {memos.length === 0 && <p className="empty">작성한 포토메모가 없습니다.</p>}

                {memos.map((memo) => (
                    <div key={memo._id} className="file-card">
                        <img src={memo.imageUrl} alt={memo.title} />
                        <div className="info">
                            {editingId === memo._id ? (
                                <>
                                    <input
                                        type="text"
                                        value={editData.title}
                                        onChange={(e) =>
                                            setEditData({ ...editData, title: e.target.value })
                                        }
                                        placeholder="제목"
                                    />
                                    <textarea
                                        value={editData.content}
                                        onChange={(e) =>
                                            setEditData({ ...editData, content: e.target.value })
                                        }
                                        placeholder="내용"
                                    />
                                    <div className="edit-actions">
                                        <button
                                            className="save-btn"
                                            onClick={() => handleUpdate(memo._id)}
                                        >
                                            저장
                                        </button>
                                        <button
                                            className="cancel-btn"
                                            onClick={() => setEditingId(null)}
                                        >
                                            취소
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3>{memo.title}</h3>
                                    <p>{memo.content}</p>
                                    <p className="date">
                                        {new Date(memo.createdAt).toLocaleDateString("ko-KR")}
                                    </p>
                                    <div className="actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleEdit(memo)}
                                        >
                                            수정
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(memo._id)}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FileList;
