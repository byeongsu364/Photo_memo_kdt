import React from "react";
import "./styles/FileList.scss";
import { useFileList } from "./hooks/useFileList";

const FileList = () => {
    const {
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
    } = useFileList();

    return (
        <section className="file-list-section">
            <h2>📸 내 포토메모 목록</h2>

            <div className="file-list">
                {Object.entries(grouped).map(([groupId, items]) => {
                    const first = items[0];
                    const isTravel = items.some((m) => m.day);
                    const groupTitle =
                        first.groupTitle || first.title;
                    const date = new Date(
                        first.createdAt
                    ).toLocaleDateString("ko-KR");

                    return (
                        <div key={groupId} className="file-card">
                            <img
                                src={first.imageUrl}
                                alt={groupTitle}
                                onClick={() =>
                                    handleOpenGroup(groupId)
                                }
                            />
                            <div className="info">
                                <h3>
                                    {groupTitle} ({items.length}개)
                                    {isTravel && " 🗺️"}
                                </h3>
                                <p>{date}</p>
                                <div className="actions">
                                    <button
                                        className="edit-btn"
                                        onClick={() =>
                                            handleOpenGroup(groupId)
                                        }
                                    >
                                        수정
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            handleDeleteGroup(groupId)
                                        }
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedGroup && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>
                            {selectedGroup.isTravel
                                ? "🗺️ 여행 수정"
                                : "📝 메모 수정"}
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
                                    key={m._id}
                                    className={`edit-item ${
                                        m._delete ? "deleted" : ""
                                    }`}
                                >
                                    <strong>{m.day}</strong>
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
                                            onClick={() =>
                                                toggleDeleteItem(i)
                                            }
                                        >
                                            {m._delete
                                                ? "복구"
                                                : "삭제"}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button
                                className="save-btn"
                                onClick={handleSaveGroup}
                            >
                                저장
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={closeGroup}
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
