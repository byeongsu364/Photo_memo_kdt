import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    getPresignedUrl,
    uploadToS3,
    uploadMemo,
} from "../../../api/client";

export const useUploadForm = () => {
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
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [dragIndex, setDragIndex] = useState(null);

    /* 🔹 카테고리 변경 */
    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setType(newType);

        setDate("");
        setTripStart("");
        setTripEnd("");
        setTripTitle("");
        setTripThumbnail(null);
        setThumbnailPreview(null);

        setDays(
            newType === "일상"
                ? [{ label: "일상", memos: [{ title: "", content: "", image: null }] }]
                : []
        );

        setStatus("");
    };

    /* 🔹 썸네일 */
    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        setTripThumbnail(file);
        setThumbnailPreview(file ? URL.createObjectURL(file) : null);
    };

    /* 🔹 여행 기간 선택 → DAY 자동 생성 */
    const handleTripRange = (start, end) => {
        setTripStart(start);
        setTripEnd(end);

        if (!start || !end) return;

        const startDate = new Date(start);
        const endDate = new Date(end);

        const diff =
            Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const generatedDays = Array.from({ length: diff }, (_, i) => ({
            label: `DAY ${i + 1}`,
            memos: [{ title: "", content: "", image: null }],
        }));

        setDays(generatedDays);
    };

    /* 🔹 DAY 날짜 계산 */
    const getDayDate = (dayIndex) => {
        if (!tripStart) return "";
        const base = new Date(tripStart);
        base.setDate(base.getDate() + dayIndex);
        return `${base.getMonth() + 1}/${base.getDate()}`;
    };

    /* 🔹 메모 추가 */
    const addMemo = (dayIndex) => {
        const updated = [...days];
        updated[dayIndex].memos.push({ title: "", content: "", image: null });
        setDays(updated);
    };

    /* 🔹 메모 삭제 */
    const removeMemo = (dayIndex, memoIndex) => {
        const updated = [...days];
        updated[dayIndex].memos.splice(memoIndex, 1);
        setDays(updated);
    };

    /* 🔹 DAY 삭제 + 재정렬 */
    const removeDay = (dayIndex) => {
        const updated = days.filter((_, i) => i !== dayIndex);
        setDays(
            updated.map((day, i) => ({
                ...day,
                label: `DAY ${i + 1}`,
            }))
        );
    };

    /* 🔹 DAY 드래그 시작 */
    const handleDragStart = (index) => {
        setDragIndex(index);
    };

    /* 🔹 DAY 드롭 */
    const handleDrop = (index) => {
        if (dragIndex === null || dragIndex === index) return;

        const updated = [...days];
        const [moved] = updated.splice(dragIndex, 1);
        updated.splice(index, 0, moved);

        setDays(
            updated.map((day, i) => ({
                ...day,
                label: `DAY ${i + 1}`,
            }))
        );

        setDragIndex(null);
    };

    /* 🔹 메모 변경 */
    const handleChange = (dayIndex, memoIndex, field, value) => {
        const updated = [...days];
        updated[dayIndex].memos[memoIndex][field] = value;
        setDays(updated);
    };

    /* 🔹 업로드 */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setStatus("📤 업로드 중...");
            const groupId = uuidv4();

            let groupTitle;

            if (type === "여행") {
                // ✅ 여행은 STEP 1에서 입력한 제목 사용
                groupTitle = tripTitle;
            } else {
                // ✅ 일상만 prompt 사용
                groupTitle =
                    days[0].memos.length > 1
                        ? prompt("여러 메모를 묶을 전체 제목을 입력하세요.")
                        : days[0].memos[0].title;
            }


            const uploadImage = async (file) => {
                const { url } = await getPresignedUrl(file.name, file.type);
                return uploadToS3(file, url);
            };

            let thumbnailUrl = null;
            if (tripThumbnail) {
                thumbnailUrl = await uploadImage(tripThumbnail);
            }

            for (const day of days) {
                for (const memo of day.memos) {
                    if (!memo.title || !memo.image) continue;

                    const imageUrl = await uploadImage(memo.image);

                    await uploadMemo({
                        title: memo.title,
                        content: memo.content,
                        category: type,
                        imageUrl,
                        tripName: tripTitle,
                        tripStartDate: tripStart,
                        tripEndDate: tripEnd,
                        day: day.label,
                        thumbnailUrl,
                        isAnonymous,
                        groupId,
                        groupTitle,
                    });
                }
            }

            setStatus("✅ 업로드 완료!");
        } catch (err) {
            console.error(err);
            setStatus("❌ 업로드 실패");
        }
    };

    return {
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

        handleDragStart, // ⭐ 드래그 시작
        handleDrop,      // ⭐ 드롭
        getDayDate,      // ⭐ DAY 날짜 표시

        handleChange,
        handleSubmit,
    };
};
