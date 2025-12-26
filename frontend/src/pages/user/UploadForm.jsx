import React from "react";
import "./styles/UploadForm.scss";
import { useUploadForm } from "./hooks/useUploadForm";

const UploadForm = () => {
    const {
        type,
        date,
        tripStart,
        tripEnd,
        tripTitle,
        thumbnailPreview,
        days,
        status,
        isAnonymous,

        setDate,
        setTripTitle,
        setIsAnonymous,

        handleTypeChange,
        handleThumbnailChange,
        handleTripRange,
        addMemo,
        removeMemo,
        handleChange,
        handleSubmit,
    } = useUploadForm();

    return (
        <div className="upload-form">
            <h2>포토메모 업로드</h2>
            <form onSubmit={handleSubmit}>
                {/* ✅ 카테고리 선택 */}
                <select value={type} onChange={handleTypeChange}>
                    <option value="일상">일상</option>
                    <option value="여행">여행</option>
                </select>

                {type === "일상" && (
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                )}

                {/* ✅ 여행 관련 입력 */}
                {type === "여행" && (
                    <>
                        <div className="trip-title">
                            <label>여행 제목</label>
                            <input
                                type="text"
                                value={tripTitle}
                                onChange={(e) => setTripTitle(e.target.value)}
                                placeholder="예: 2박3일 제주도 여행"
                                required
                            />
                        </div>
                        <div className="trip-thumbnail">
                            <label>썸네일 이미지</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                            />
                            {thumbnailPreview && (
                                <img
                                    src={thumbnailPreview}
                                    alt="썸네일 미리보기"
                                    className="preview"
                                />
                            )}
                        </div>
                    </>
                )}

                {/* ✅ 메모 입력 */}
                {days.map((day, dayIndex) => (
                    <div key={dayIndex} className="day-section">
                        {type === "여행" && (
                            <h3 className="day-title">{day.label}</h3>
                        )}

                        {day.memos.map((memo, memoIndex) => (
                            <div key={memoIndex} className="entry-box">
                                <div className="entry-header">
                                    <span className="entry-label">
                                        메모 {memoIndex + 1}
                                    </span>
                                    {day.memos.length > 1 && (
                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() =>
                                                removeMemo(dayIndex, memoIndex)
                                            }
                                        >
                                            ❌
                                        </button>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    placeholder="제목"
                                    value={memo.title}
                                    onChange={(e) =>
                                        handleChange(
                                            dayIndex,
                                            memoIndex,
                                            "title",
                                            e.target.value
                                        )
                                    }
                                    required
                                />
                                <textarea
                                    placeholder="내용"
                                    value={memo.content}
                                    onChange={(e) =>
                                        handleChange(
                                            dayIndex,
                                            memoIndex,
                                            "content",
                                            e.target.value
                                        )
                                    }
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        handleChange(
                                            dayIndex,
                                            memoIndex,
                                            "image",
                                            e.target.files[0]
                                        )
                                    }
                                    required
                                />
                            </div>
                        ))}

                        <button
                            type="button"
                            className="add-btn"
                            onClick={() => addMemo(dayIndex)}
                        >
                            + 메모 추가
                        </button>
                    </div>
                ))}

                {/* ✅ 익명 여부 */}
                <div className="anonymous-toggle">
                    <label>
                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                        />
                        익명으로 게시하기
                    </label>
                </div>

                <button type="submit" className="submit-btn">
                    저장하기
                </button>
            </form>

            {status && <p className="status">{status}</p>}
        </div>
    );
};

export default UploadForm;
