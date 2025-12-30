import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getPresignedUrl, uploadToS3, uploadMemo } from "../../../api/client";

export const useUploadForm = () => {
    const [category, setCategory] = useState("일상");

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

    /* category 변경 */
    const handleCategoryChange = (e) => {
        const next = e.target.value;
        setCategory(next);

        setDate("");
        setTripStart("");
        setTripEnd("");
        setTripTitle("");
        setTripThumbnail(null);
        setThumbnailPreview(null);

        setDays(
            next === "일상"
                ? [{ label: "일상", memos: [{ title: "", content: "", image: null }] }]
                : []
        );

        setStatus("");
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        setTripThumbnail(file);
        setThumbnailPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleTripRange = (start, end) => {
        setTripStart(start);
        setTripEnd(end);
        if (!start || !end) return;

        const diff =
            Math.floor(
                (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)
            ) + 1;

        setDays(
            Array.from({ length: diff }, (_, i) => ({
                label: `DAY ${i + 1}`,
                memos: [{ title: "", content: "", image: null }],
            }))
        );
    };

    const getDayDate = (dayIndex) => {
        if (!tripStart) return "";
        const base = new Date(tripStart);
        base.setDate(base.getDate() + dayIndex);
        return `${base.getMonth() + 1}/${base.getDate()}`;
    };

    const addMemo = (dayIndex) => {
        const next = [...days];
        next[dayIndex].memos.push({ title: "", content: "", image: null });
        setDays(next);
    };

    const removeMemo = (dayIndex, memoIndex) => {
        const next = [...days];
        next[dayIndex].memos.splice(memoIndex, 1);
        setDays(next);
    };

    const removeDay = (dayIndex) => {
        const next = days.filter((_, i) => i !== dayIndex);
        setDays(
            next.map((d, i) => ({
                ...d,
                label: `DAY ${i + 1}`,
            }))
        );
    };

    const handleDragStart = (index) => setDragIndex(index);

    const handleDrop = (index) => {
        if (dragIndex === null || dragIndex === index) return;

        const next = [...days];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(index, 0, moved);

        setDays(
            next.map((d, i) => ({
                ...d,
                label: `DAY ${i + 1}`,
            }))
        );

        setDragIndex(null);
    };

    const handleChange = (dayIndex, memoIndex, field, value) => {
        const next = [...days];
        next[dayIndex].memos[memoIndex][field] = value;
        setDays(next);
    };

    /* 업로드 */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setStatus("업로드 중...");
            const groupId = uuidv4();

            const groupTitle =
                category === "여행"
                    ? tripTitle
                    : days[0].memos.length > 1
                    ? prompt("여러 메모를 묶을 전체 제목을 입력하세요.")
                    : days[0].memos[0].title;

            const uploadFile = async (file) => {
                const { url } = await getPresignedUrl(file.name, file.type);
                return await uploadToS3(file, url);
            };

            let thumbnailUrl = null;

            if (category === "여행" && tripThumbnail) {
                thumbnailUrl = await uploadFile(tripThumbnail);
            }

            if (category === "일상") {
                const first = days[0]?.memos[0]?.image;
                if (first) thumbnailUrl = await uploadFile(first);
            }

            for (const day of days) {
                for (const memo of day.memos) {
                    if (!memo.title || !memo.image) continue;

                    const imageUrl =
                        category === "일상" && memo === days[0].memos[0]
                            ? thumbnailUrl
                            : await uploadFile(memo.image);

                    await uploadMemo({
                        category,              // ✅ 반드시 전달
                        title: memo.title,
                        content: memo.content,
                        imageUrl,
                        thumbnailUrl: category === "여행" ? thumbnailUrl : null,
                        isAnonymous,
                        groupId,
                        groupTitle,
                        day: day.label,
                        tripName: category === "여행" ? tripTitle : null,
                        tripStartDate: category === "여행" ? tripStart : null,
                        tripEndDate: category === "여행" ? tripEnd : null,
                        date: category === "일상" ? date : null,
                    });
                }
            }

            setStatus("업로드 완료");
        } catch (err) {
            console.error(err);
            setStatus("업로드 실패");
        }
    };

    return {
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

        handleDragStart,
        handleDrop,
        getDayDate,

        handleChange,
        handleSubmit,
    };
};
