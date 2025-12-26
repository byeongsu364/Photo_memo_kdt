import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllPosts } from "../../../api/client";

export const usePosts = () => {
    const [groupedPosts, setGroupedPosts] = useState({});
    const [filteredGroups, setFilteredGroups] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    /* 🔹 최초 로드 */
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

    /* 🔹 검색 */
    const onSearch = (query) => {
        const q = (query || "").trim();

        if (!q) {
            setFilteredGroups(groupedPosts);
            return;
        }

        const lower = q.toLowerCase();

        const filtered = Object.entries(groupedPosts).reduce(
            (acc, [groupKey, items]) => {
                const first = items?.[0];
                if (!first) return acc;

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

                const match =
                    title.toLowerCase().includes(lower) ||
                    userName.toLowerCase().includes(lower) ||
                    dateStr.includes(lower);

                if (match) acc[groupKey] = items;
                return acc;
            },
            {}
        );

        setFilteredGroups(filtered);
    };

    /* 🔹 카드 클릭 (🔥 그룹 전체 보기) */
    const onClickGroup = (groupKey) => {
        const isLoggedIn = !!localStorage.getItem("token");

        if (!isLoggedIn) {
            alert("회원만 이용 가능합니다.");
            navigate("/admin/login");
            return;
        }

        // ✅ 그룹 상세는 반드시 groupId로 이동
        navigate(`/posts/${groupKey}`);
    };

    /* ✅ UI에서 그대로 쓰는 형태 */
    return {
        loading,
        groupedPosts: filteredGroups,
        onSearch,
        onClickGroup,
    };
};
