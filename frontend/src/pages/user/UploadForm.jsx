import React, { useState } from "react";
import "./styles/UploadForm.scss";
import { useUploadForm } from "./hooks/useUploadForm";

const UploadForm = () => {
    const {
        category,
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

        handleCategoryChange,
        handleThumbnailChange,
        handleTripRange,
        addMemo,
        removeMemo,
        removeDay,
        handleChange,
        handleSubmit,

        handleDragStart,
        handleDrop,
        getDayDate,
    } = useUploadForm();

    const [step, setStep] = useState(1);

    const [dragMemo, setDragMemo] = useState({
        dayIndex: null,
        memoIndex: null,
    });

    const canGoStep2 =
        tripTitle &&
        tripStart &&
        tripEnd &&
        thumbnailPreview;

    const handleMemoDragStart = (dayIndex, memoIndex) => {
        setDragMemo({ dayIndex, memoIndex });
    };

    const handleMemoDrop = (dayIndex, memoIndex) => {
        if (dragMemo.dayIndex === null || dragMemo.memoIndex === null) return;
        if (dragMemo.dayIndex !== dayIndex) return;

        const updated = [...days];
        const memos = [...updated[dayIndex].memos];

        const [moved] = memos.splice(dragMemo.memoIndex, 1);
        memos.splice(memoIndex, 0, moved);

        updated[dayIndex].memos = memos;
        setDragMemo({ dayIndex: null, memoIndex: null });
    };

    return (
        <div className="upload-form">
            <h2>포토메모 업로드</h2>

            <select value={category} onChange={handleCategoryChange}>
                <option value="일상">일상</option>
                <option value="여행">여행</option>
            </select>

            <form onSubmit={handleSubmit}>
                {category === "일상" && (
                    <>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />

                        {days.map((day, dayIndex) => (
                            <div key={dayIndex} className="day-section">
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
                                                    삭제
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="제목"
                                            value={memo.title}
                                            onChange={(e) =>
                                                handleChange(dayIndex, memoIndex, "title", e.target.value)
                                            }
                                            required
                                        />

                                        <textarea
                                            placeholder="내용"
                                            value={memo.content}
                                            onChange={(e) =>
                                                handleChange(dayIndex, memoIndex, "content", e.target.value)
                                            }
                                        />

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleChange(dayIndex, memoIndex, "image", e.target.files[0])
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
                                    메모 추가
                                </button>
                            </div>
                        ))}

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
                    </>
                )}

                {category === "여행" && (
                    <>
                        <div className="step-bar">
                            <span className={step === 1 ? "active" : ""}>STEP 1</span>
                            <span className="step-sep">·</span>
                            <span className={step === 2 ? "active" : ""}>STEP 2</span>
                        </div>

                        {step === 1 && (
                            <>
                                <div className="trip-title">
                                    <label>여행 제목</label>
                                    <input
                                        type="text"
                                        value={tripTitle}
                                        onChange={(e) => setTripTitle(e.target.value)}
                                        required
                                        placeholder="여행 제목을 입력하세요"
                                    />
                                </div>

                                <div className="trip-range">
                                    <input
                                        type="date"
                                        value={tripStart}
                                        onChange={(e) => handleTripRange(e.target.value, tripEnd)}
                                        required
                                    />
                                    <span>~</span>
                                    <input
                                        type="date"
                                        value={tripEnd}
                                        onChange={(e) => handleTripRange(tripStart, e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="trip-thumbnail">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailChange}
                                        required
                                    />
                                    {thumbnailPreview && (
                                        <img
                                            src={thumbnailPreview}
                                            className="preview"
                                            alt="thumbnail preview"
                                        />
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="btn next-btn"
                                    disabled={!canGoStep2}
                                    onClick={() => setStep(2)}
                                >
                                    다음 단계
                                </button>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                {days.map((day, dayIndex) => (
                                    <div
                                        key={dayIndex}
                                        className="day-section"
                                        draggable
                                        onDragStart={() => handleDragStart(dayIndex)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => handleDrop(dayIndex)}
                                    >
                                        <div className="day-header">
                                            <h3 className="day-title">
                                                {day.label} ({getDayDate(dayIndex)})
                                            </h3>
                                            <button type="button" onClick={() => removeDay(dayIndex)}>
                                                DAY 삭제
                                            </button>
                                        </div>

                                        {day.memos.map((memo, memoIndex) => (
                                            <div
                                                key={memoIndex}
                                                className="entry-box"
                                                draggable
                                                onDragStart={() => handleMemoDragStart(dayIndex, memoIndex)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleMemoDrop(dayIndex, memoIndex)}
                                            >
                                                <div className="entry-header">
                                                    <span className="entry-label">
                                                        메모 {memoIndex + 1}
                                                    </span>

                                                    {day.memos.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="delete-btn"
                                                            onClick={() => removeMemo(dayIndex, memoIndex)}
                                                        >
                                                            삭제
                                                        </button>
                                                    )}
                                                </div>

                                                <input
                                                    type="text"
                                                    placeholder="제목"
                                                    value={memo.title}
                                                    onChange={(e) =>
                                                        handleChange(dayIndex, memoIndex, "title", e.target.value)
                                                    }
                                                    required
                                                />

                                                <textarea
                                                    placeholder="내용"
                                                    value={memo.content}
                                                    onChange={(e) =>
                                                        handleChange(dayIndex, memoIndex, "content", e.target.value)
                                                    }
                                                />

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        handleChange(dayIndex, memoIndex, "image", e.target.files[0])
                                                    }
                                                    required
                                                />
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => addMemo(dayIndex)}
                                            className="btn plus-btn"
                                        >
                                            메모 추가
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="btn back-btn"
                                >
                                    이전 단계
                                </button>

                                <button type="submit" className="btn submit-btn">
                                    저장하기
                                </button>
                            </>
                        )}
                    </>
                )}
            </form>

            {status && <p className="status">{status}</p>}
        </div>
    );
};

export default UploadForm;
