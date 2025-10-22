import React, { useState } from "react";
import {
    getPresignedUrl,
    uploadToS3,
    uploadMemo,
    getErrorMessage,
} from "../../api/client";
import "./style/UploadForm.scss";

const UploadForm = () => {
    const [type, setType] = useState("일상");
    const [date, setDate] = useState("");
    const [tripStart, setTripStart] = useState("");
    const [tripEnd, setTripEnd] = useState("");
    const [tripTitle, setTripTitle] = useState("");
    const [tripThumbnail, setTripThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [days, setDays] = useState([
        { label: "일상", memos: [{ title: "", content: "", image: null }] },
    ]);
    const [status, setStatus] = useState("");

    // ✅ 카테고리 변경 시 초기화
    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setType(newType);
        setDate("");
        setTripStart("");
        setTripEnd("");
        setTripTitle("");
        setTripThumbnail(null);
        setThumbnailPreview(null);

        if (newType === "일상") {
            setDays([{ label: "일상", memos: [{ title: "", content: "", image: null }] }]);
        } else {
            setDays([]);
        }

        setStatus("");
    };

    // ✅ 여행 썸네일 변경
    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        setTripThumbnail(file);
        setThumbnailPreview(file ? URL.createObjectURL(file) : null);
    };

    // ✅ 여행기간 선택 시 Day 자동 생성
    const handleTripRange = (start, end) => {
        setTripStart(start);
        setTripEnd(end);

        if (!start || !end) return;

        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffDays =
            Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))) + 1;

        const newDays = Array.from({ length: diffDays }, (_, i) => ({
            label: `Day ${i + 1}`,
            date: new Date(startDate.getTime() + i * 86400000)
                .toISOString()
                .split("T")[0],
            memos: [{ title: "", content: "", image: null }],
        }));

        setDays(newDays);
    };

    // ✅ 메모 추가
    const addMemo = (dayIndex) => {
        const updated = [...days];
        updated[dayIndex].memos.push({ title: "", content: "", image: null });
        setDays(updated);
    };

    // ✅ 메모 삭제
    const removeMemo = (dayIndex, memoIndex) => {
        const updated = [...days];
        updated[dayIndex].memos.splice(memoIndex, 1);
        setDays(updated);
    };

    // ✅ 메모 값 변경
    const handleChange = (dayIndex, memoIndex, field, value) => {
        const updated = [...days];
        updated[dayIndex].memos[memoIndex][field] = value;
        setDays(updated);
    };

    // ✅ 업로드 처리
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setStatus("📤 업로드 중...");

            // 🔹 일상 모드
            if (type === "일상") {
                for (const memo of days[0].memos) {
                    if (!memo.title || !memo.image) continue;

                    // presign → S3 업로드
                    const { url } = await getPresignedUrl(memo.image.name, memo.image.type);
                    const imageUrl = await uploadToS3(memo.image, url);

                    // DB 저장
                    await uploadMemo({
                        title: memo.title,
                        content: memo.content,
                        category: type,
                        image: { imageUrl },
                    });
                }
            }

            // 🔹 여행 모드
            else {
                // ✅ 썸네일 S3 업로드 (선택 시)
                let thumbnailUrl = null;
                if (tripThumbnail) {
                    const { url } = await getPresignedUrl(
                        tripThumbnail.name,
                        tripThumbnail.type
                    );
                    thumbnailUrl = await uploadToS3(tripThumbnail, url);
                }

                for (const day of days) {
                    for (const memo of day.memos) {
                        if (!memo.title || !memo.image) continue;

                        // presign → S3 업로드
                        const { url } = await getPresignedUrl(memo.image.name, memo.image.type);
                        const imageUrl = await uploadToS3(memo.image, url);

                        // DB 저장
                        await uploadMemo({
                            title: memo.title,
                            content: memo.content,
                            category: type,
                            tripName: tripTitle,
                            tripStartDate: tripStart,
                            tripEndDate: tripEnd,
                            day: day.label,
                            image: { imageUrl, thumbnailUrl },
                        });
                    }
                }
            }

            setStatus("✅ 업로드 완료!");
        } catch (err) {
            console.error(err);
            setStatus(`❌ 실패: ${getErrorMessage(err)}`);
        }
    };

    return (
        <div className="upload-form">
            <h2>포토메모 업로드</h2>

            <form onSubmit={handleSubmit}>
                {/* ✅ 카테고리 선택 */}
                <select value={type} onChange={handleTypeChange}>
                    <option value="일상">일상</option>
                    <option value="여행">여행</option>
                </select>

                {/* ✅ 일상 모드 */}
                {type === "일상" && (
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                )}

                {/* ✅ 여행 모드 */}
                {type === "여행" && (
                    <>
                        {/* 여행 제목 */}
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

                        {/* 썸네일 업로드 */}
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

                        {/* 여행 기간 */}
                        <div className="trip-range">
                            <label>여행 기간</label>
                            <div className="range-inputs">
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
                        </div>
                    </>
                )}

                {/* ✅ 렌더링 (일상 + 여행 공통 구조) */}
                {days.map((day, dayIndex) => (
                    <div key={dayIndex} className="day-section">
                        {type === "여행" && <h3 className="day-title">{day.label}</h3>}

                        {day.memos.map((memo, memoIndex) => (
                            <div key={memoIndex} className="entry-box">
                                <div className="entry-header">
                                    <span className="entry-label">메모 {memoIndex + 1}</span>
                                    {day.memos.length > 1 && (
                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() => removeMemo(dayIndex, memoIndex)}
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

                        {/* 메모 추가 버튼 */}
                        <button
                            type="button"
                            className="add-btn"
                            onClick={() => addMemo(dayIndex)}
                        >
                            + 메모 추가
                        </button>
                    </div>
                ))}

                {/* ✅ 저장 버튼 */}
                <button type="submit" className="submit-btn">
                    저장하기
                </button>
            </form>

            {status && <p className="status">{status}</p>}
        </div>
    );
};

export default UploadForm;
