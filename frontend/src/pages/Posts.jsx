import React, { useEffect, useState } from "react";
import { fetchAllPosts } from "../api/client";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import "./Posts.scss";

const Posts = () => {
    const [groupedPosts, setGroupedPosts] = useState({});
    const [filteredGroups, setFilteredGroups] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const data = await fetchAllPosts();
                console.log("📸 게시글 데이터:", data);

                // ✅ 그룹화 로직
                const grouped = data.reduce((acc, post) => {
                    const key = post.groupId || post._id;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(post);
                    return acc;
                }, {});

                setGroupedPosts(grouped);
                setFilteredGroups(grouped);
            } catch (err) {
                console.error("❌ 게시글 로드 실패:", err);
            }
        };
        loadPosts();
    }, []);

    // ✅ 검색 핸들러
    const handleSearch = (query) => {
        if (!query.trim()) {
            setFilteredGroups(groupedPosts);
            return;
        }

        const lower = query.toLowerCase();

        const filtered = Object.entries(groupedPosts).reduce((acc, [groupId, items]) => {
            const first = items[0];
            const title = first.groupTitle || first.title || "";
            const userName = first.isAnonymous ? "익명" : first.user?.displayName || "user";
            const dateStr = new Date(first.createdAt)
                .toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                })
                .replace(/\.\s/g, "-") // 2025. 11. 11. → 2025-11-11 형태
                .toLowerCase();

            // ✅ LIKE 기반 유사 검색 (제목, 작성자, 날짜 중 하나라도 포함)
            const match =
                title.toLowerCase().includes(lower) ||
                userName.toLowerCase().includes(lower) ||
                dateStr.includes(lower);

            if (match) acc[groupId] = items;
            return acc;
        }, {});

        setFilteredGroups(filtered);
    };

    // ✅ 그룹 클릭 시 상세 페이지 이동
    const handleClickGroup = (groupId) => {
        navigate(`/posts/${groupId}`);
    };

    const groupEntries = Object.entries(filteredGroups);

    return (
        <div className="posts-page">
            <h2>📁 전체 게시글</h2>

            {/* ✅ 검색 바 */}
            <SearchBar onSearch={handleSearch} />

            {groupEntries.length === 0 ? (
                <p className="no-posts">검색 결과가 없습니다.</p>
            ) : (
                <div className="posts-grid">
                    {groupEntries.map(([groupId, items]) => {
                        const first = items[0];
                        const title = first.groupTitle || first.title;
                        const representativeImage = first.imageUrl;
                        const userName = first.isAnonymous
                            ? "익명"
                            : first.user?.displayName || "user";
                        const dateStr = new Date(first.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        });

                        return (
                            <div
                                key={groupId}
                                className="post-card"
                                onClick={() => handleClickGroup(groupId)}
                            >
                                <div className="image-wrap">
                                    <img src={representativeImage} alt={title} />
                                </div>

                                <div className="post-info">
                                    <h3>{title}</h3>
                                    <p className="post-date">{dateStr}</p>
                                    <span className="post-user">✍️ {userName}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Posts;
