import React, { useMemo } from "react";
import "./styles/FileList.scss";
import { useFileList } from "./hooks/useFileList";

/* ======================================================
   대표 썸네일 계산
====================================================== */
const getGroupThumbnail = (items) => {
    if (!items || items.length === 0) return null;

    const resolved = items.find(
        (m) => m.resolvedThumbnail
    )?.resolvedThumbnail;
    if (resolved) return resolved;

    const travelThumb = items.find(
        (m) => m.thumbnailUrl
    )?.thumbnailUrl;
    if (travelThumb) return travelThumb;

    return items[0]?.imageUrl || null;
};

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

    /* ===============================
       🔥 즉시 미리보기 썸네일
    =============================== */
    const previewThumbnail = useMemo(() => {
        if (!selectedGroup) return null;

        const picked = editItems.find(
            (m) => m.isThumbnail && m.newThumbnail
        );
        if (picked) return picked.newThumbnail;

        const selected = editItems.find(
            (m) => m.isThumbnail
        );
        return selected?.imageUrl || selectedGroup.thumbnail;
    }, [editItems, selectedGroup]);

    return (
        <section className="file-list-section">
            <h2>내 포토메모 목록</h2>

            {/* ===============================
               카드 목록
            =============================== */}
            <div className="file-list">
                {Object.entries(grouped).map(
                    ([groupId, items]) => {
                        const sorted = [...items].sort(
                            (a, b) =>
                                new Date(a.createdAt) -
                                new Date(b.createdAt)
                        );

                        const first = sorted[0];
                        const isTravel = sorted.some(
                            (m) => m.day
                        );
                        const groupTitle =
                            first.groupTitle || first.title;

                        const date = new Date(
                            first.createdAt
                        ).toLocaleDateString("ko-KR");

                        const thumbnail =
                            getGroupThumbnail(sorted);

                        return (
                            <div
                                key={groupId}
                                className="file-card"
                            >
                                {thumbnail && (
                                    <img
                                        src={thumbnail}
                                        alt={groupTitle}
                                        onClick={() =>
                                            handleOpenGroup(
                                                groupId
                                            )
                                        }
                                    />
                                )}

                                <div className="info">
                                    <h3>
                                        {groupTitle} (
                                        {sorted.length}개)
                                        {isTravel && " (여행)"}
                                    </h3>
                                    <p>{date}</p>

                                    <div className="actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() =>
                                                handleOpenGroup(
                                                    groupId
                                                )
                                            }
                                        >
                                            수정
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                handleDeleteGroup(
                                                    groupId
                                                )
                                            }
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                )}
            </div>

            {/* ===============================
               ✏️ 수정 모달
            =============================== */}
            {selectedGroup && (
                <div
                    className="modal"
                    onClick={closeGroup}
                >
                    <div
                        className="modal-content"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <h3>
                            {selectedGroup.isTravel
                                ? "여행 수정"
                                : "메모 수정"}
                        </h3>

                        {/* 🔥 썸네일 미리보기 */}
                        <div className="thumbnail-preview">
                            {previewThumbnail && (
                                <img
                                    src={previewThumbnail}
                                    alt="대표 썸네일"
                                />
                            )}
                            <button
                                className="thumb-remove"
                                onClick={() =>
                                    editItems.forEach(
                                        (_, i) =>
                                            handleEditItem(
                                                i,
                                                "removeThumbnail",
                                                true
                                            )
                                    )
                                }
                            >
                                대표 썸네일 삭제
                            </button>
                        </div>

                        <input
                            value={selectedGroup.groupTitle}
                            onChange={
                                handleChangeGroupTitle
                            }
                            placeholder="그룹 제목"
                        />

                        <div className="edit-list">
                            {editItems.map((m, i) => (
                                <div
                                    key={m._id}
                                    className={`item-box ${
                                        m._delete
                                            ? "deleted"
                                            : ""
                                    } ${
                                        m.isThumbnail
                                            ? "selected-thumbnail"
                                            : ""
                                    }`}
                                >
                                    <div className="thumb-select">
                                        <input
                                            type="radio"
                                            name="thumbnail"
                                            checked={
                                                m.isThumbnail
                                            }
                                            onChange={() =>
                                                editItems.forEach(
                                                    (_, idx) =>
                                                        handleEditItem(
                                                            idx,
                                                            "isThumbnail",
                                                            idx === i
                                                        )
                                                )
                                            }
                                        />
                                        {m.isThumbnail && (
                                            <span className="badge">
                                                대표
                                            </span>
                                        )}
                                    </div>

                                    <img
                                        src={m.imageUrl}
                                        alt={m.title}
                                        className="preview"
                                    />

                                    <div className="item-fields">
                                        <input
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
                                            value={
                                                m.newContent
                                            }
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
                                                    "newThumbnail",
                                                    URL.createObjectURL(
                                                        e.target
                                                            .files[0]
                                                    )
                                                )
                                            }
                                        />
                                    </div>

                                    <button
                                        className="delete-toggle"
                                        onClick={() =>
                                            toggleDeleteItem(
                                                i
                                            )
                                        }
                                    >
                                        {m._delete
                                            ? "복구"
                                            : "삭제"}
                                    </button>
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
