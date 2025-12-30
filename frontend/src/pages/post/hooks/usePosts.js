import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllPosts } from "../../../api/client";

export const usePosts = () => {
    const [groupedPosts, setGroupedPosts] = useState({});
    const [filteredGroups, setFilteredGroups] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    /* ======================================================
       🔹 최초 로드
    ====================================================== */
    useEffect(() => {
        let mounted = true;

        const loadPosts = async () => {
            try {
                setLoading(true);
                const data = await fetchAllPosts();

                // ✅ groupId 기준 그룹화 (없으면 단일 post)
                const grouped = (data || []).reduce((acc, post) => {
                    const key = post.groupId || post._id;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(post);
                    return acc;
                }, {});

                if (!mounted) return;

                setGroupedPosts(grouped);
                setFilteredGroups(grouped);
            } catch (err) {
                console.error("❌ 게시글 로드 실패:", err);
                if (mounted) {
                    setGroupedPosts({});
                    setFilteredGroups({});
                }
            } finally {
                mounted && setLoading(false);
            }
        };

        loadPosts();

        return () => {
            mounted = false;
        };
    }, []);

    /* ======================================================
       🔹 검색 (DAY 제목 포함)
    ====================================================== */
    const onSearch = (query) => {
        const q = (query || "").trim();
        if (!q) {
            setFilteredGroups(groupedPosts);
            return;
        }

        const lower = q.toLowerCase();

        const filtered = Object.entries(groupedPosts).reduce(
            (acc, [groupKey, items]) => {
                if (!items?.length) return acc;

                // 🔥 DAY1 기준 post
                const sorted = [...items].sort(
                    (a, b) =>
                        new Date(a.createdAt) - new Date(b.createdAt)
                );
                const first = sorted[0];

                const title = first.groupTitle || first.title || "";
                const userName = first.isAnonymous
                    ? "익명"
                    : first.user?.displayName || "user";

                const dateStr = new Date(first.createdAt)
                    .toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                    })
                    .replace(/\.\s/g, "-")
                    .toLowerCase();

                // 🔹 DAY 제목 검색 포함 (여행 내 모든 day)
                const dayMatched = items.some((post) =>
                    (post.day || "")
                        .toLowerCase()
                        .includes(lower)
                );

                const match =
                    title.toLowerCase().includes(lower) ||
                    userName.toLowerCase().includes(lower) ||
                    dateStr.includes(lower) ||
                    dayMatched;

                if (match) acc[groupKey] = items;
                return acc;
            },
            {}
        );

        setFilteredGroups(filtered);
    };

    /* ======================================================
       🔹 카드 클릭 (비회원도 보기 가능)
    ====================================================== */
    const onClickGroup = (groupKey) => {
        // ✅ 비회원도 상세 보기 가능
        navigate(`/posts/${groupKey}`);
    };

    /* ======================================================
       ✅ UI에서 그대로 사용
    ====================================================== */
    return {
        loading,
        groupedPosts: filteredGroups,
        onSearch,
        onClickGroup,
    };
};
