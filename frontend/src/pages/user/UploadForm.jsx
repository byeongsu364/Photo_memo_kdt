import React, { useState } from "react";
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
        removeDay,
        handleChange,
        handleSubmit,

        handleDragStart,
        handleDrop,
        getDayDate,
    } = useUploadForm();

    /* 🔹 STEP은 여행에만 사용 */
    const [step, setStep] = useState(1);

    /* 🔹 메모 드래그 상태 */
    const [dragMemo, setDragMemo] = useState({
        dayIndex: null,
        memoIndex: null,
    });

    const canGoStep2 =
        tripTitle &&
        tripStart &&
        tripEnd &&
        thumbnailPreview;

    /* 🔹 메모 드래그 시작 */
    const handleMemoDragStart = (dayIndex, memoIndex) => {
        setDragMemo({ dayIndex, memoIndex });
    };

    /* 🔹 메모 드롭 */
    const handleMemoDrop = (dayIndex, memoIndex) => {
        if (
            dragMemo.dayIndex === null ||
            dragMemo.memoIndex === null
        )
            return;

        // 다른 DAY로 이동 방지
        if (dragMemo.dayIndex !== dayIndex) return;

        const updated = [...days];
        const memos = [...updated[dayIndex].memos];

        const [moved] = memos.splice(dragMemo.memoIndex, 1);
        memos.splice(memoIndex, 0, moved);

        updated[dayIndex].memos = memos;
        setDragMemo({ dayIndex: null, memoIndex: null });

        // days 업데이트
        updated.forEach((_, i) => {
            if (i === dayIndex) {
                updated[i] = {
                    ...updated[i],
                    memos,
                };
            }
        });
    };

    return (
        <div className="upload-form">
            <h2>포토메모 업로드</h2>

            {/* ✅ 카테고리 선택 */}
            <select value={type} onChange={handleTypeChange}>
                <option value="일상">일상</option>
                <option value="여행">여행</option>
            </select>

            <form onSubmit={handleSubmit}>
                {/* =========================
                   ✅ 일상 작성 (기존 그대로)
                ========================= */}
                {type === "일상" && (
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
                                                        removeMemo(
                                                            dayIndex,
                                                            memoIndex
                                                        )
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

                        <div className="anonymous-toggle">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) =>
                                        setIsAnonymous(e.target.checked)
                                    }
                                />
                                익명으로 게시하기
                            </label>
                        </div>

                        <button type="submit" className="submit-btn">
                            저장하기
                        </button>
                    </>
                )}

                {/* =========================
                   ✅ 여행 작성 (STEP 적용)
                ========================= */}
                {type === "여행" && (
                    <>
                        {/* STEP 진행 바 */}
                        <div className="step-bar">
                            <span className={step === 1 ? "active" : ""}>
                                STEP 1
                            </span>
                            <span className="step-sep">·</span>
                            <span className={step === 2 ? "active" : ""}>
                                STEP 2
                            </span>
                        </div>

                        {/* STEP 1 */}
                        {step === 1 && (
                            <>
                                <div className="trip-title">
                                    <label>여행 제목</label>
                                    <input
                                        type="text"
                                        value={tripTitle}
                                        onChange={(e) =>
                                            setTripTitle(e.target.value)
                                        }
                                        placeholder="2박3일 제주여행"
                                        required
                                    />
                                </div>

                                <div className="trip-range">
                                    <input
                                        type="date"
                                        value={tripStart}
                                        onChange={(e) =>
                                            handleTripRange(
                                                e.target.value,
                                                tripEnd
                                            )
                                        }
                                        required
                                    />
                                    <span>~</span>
                                    <input
                                        type="date"
                                        value={tripEnd}
                                        onChange={(e) =>
                                            handleTripRange(
                                                tripStart,
                                                e.target.value
                                            )
                                        }
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

                        {/* STEP 2 */}
                        {step === 2 && (
                            <>
                                {days.map((day, dayIndex) => (
                                    <div
                                        key={dayIndex}
                                        className="day-section"
                                        draggable
                                        onDragStart={() =>
                                            handleDragStart(dayIndex)
                                        }
                                        onDragOver={(e) =>
                                            e.preventDefault()
                                        }
                                        onDrop={() =>
                                            handleDrop(dayIndex)
                                        }
                                    >
                                        <div className="day-header">
                                            <h3 className="day-title">
                                                {day.label} (
                                                {getDayDate(dayIndex)})
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeDay(dayIndex)
                                                }
                                            >
                                                DAY 삭제
                                            </button>
                                        </div>

                                        {day.memos.map((memo, memoIndex) => (
                                            <div
                                                key={memoIndex}
                                                className="entry-box"
                                                draggable
                                                onDragStart={() =>
                                                    handleMemoDragStart(
                                                        dayIndex,
                                                        memoIndex
                                                    )
                                                }
                                                onDragOver={(e) =>
                                                    e.preventDefault()
                                                }
                                                onDrop={() =>
                                                    handleMemoDrop(
                                                        dayIndex,
                                                        memoIndex
                                                    )
                                                }
                                            >
                                                <div className="entry-header">
                                                    <span className="entry-label">
                                                        메모 {memoIndex + 1}
                                                    </span>

                                                    {day.memos.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="delete-btn"
                                                            onClick={() =>
                                                                removeMemo(
                                                                    dayIndex,
                                                                    memoIndex
                                                                )
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
                                            onClick={() =>
                                                addMemo(dayIndex)
                                            }
                                            className="btn plus-btn"
                                        >
                                            + 메모 추가
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
