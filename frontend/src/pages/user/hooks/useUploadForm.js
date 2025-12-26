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

    // 카테고리 변경
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

    // 썸네일 변경
    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        setTripThumbnail(file);
        setThumbnailPreview(file ? URL.createObjectURL(file) : null);
    };

    // 여행 기간
    const handleTripRange = (start, end) => {
        setTripStart(start);
        setTripEnd(end);
    };

    // 메모 추가
    const addMemo = (dayIndex) => {
        const updated = [...days];
        updated[dayIndex].memos.push({ title: "", content: "", image: null });
        setDays(updated);
    };

    // 메모 삭제
    const removeMemo = (dayIndex, memoIndex) => {
        const updated = [...days];
        updated[dayIndex].memos.splice(memoIndex, 1);
        setDays(updated);
    };

    // 메모 변경
    const handleChange = (dayIndex, memoIndex, field, value) => {
        const updated = [...days];
        updated[dayIndex].memos[memoIndex][field] = value;
        setDays(updated);
    };

    // 업로드
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setStatus("📤 업로드 중...");
            const groupId = uuidv4();
            const groupTitle =
                days[0].memos.length > 1
                    ? prompt("여러 메모를 묶을 전체 제목을 입력하세요.")
                    : days[0].memos[0].title;

            const uploadImage = async (file) => {
                const { url } = await getPresignedUrl(file.name, file.type);
                return uploadToS3(file, url);
            };

            if (type === "일상") {
                for (const memo of days[0].memos) {
                    if (!memo.title || !memo.image) continue;
                    const imageUrl = await uploadImage(memo.image);
                    await uploadMemo({
                        title: memo.title,
                        content: memo.content,
                        category: type,
                        imageUrl,
                        isAnonymous,
                        groupId,
                        groupTitle,
                    });
                }
            } else {
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
        handleChange,
        handleSubmit,
    };
};
