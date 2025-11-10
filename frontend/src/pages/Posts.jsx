import React, { useEffect, useState } from "react";
import { fetchAllPosts } from "../api/client";
import { useNavigate } from "react-router-dom";
import "./Posts.scss";

const Posts = () => {
    const [groupedPosts, setGroupedPosts] = useState({});
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
            } catch (err) {
                console.error("❌ 게시글 로드 실패:", err);
            }
        };
        loadPosts();
    }, []);

    // ✅ 그룹 클릭 시 상세 페이지 이동
    const handleClickGroup = (groupId) => {
        navigate(`/posts/${groupId}`);
    };

    const groupEntries = Object.entries(groupedPosts);

    return (
        <div className="posts-page">
            <h2>📁 전체 게시글</h2>

            {groupEntries.length === 0 ? (
                <p className="no-posts">아직 게시글이 없습니다.</p>
            ) : (
                <div className="posts-grid">
                    {groupEntries.map(([groupId, items]) => {
                        const first = items[0];
                        const title = first.groupTitle || first.title;
                        const content = first.content || "";
                        const representativeImage = first.imageUrl;
                        const userName = first.isAnonymous
                            ? "익명"
                            : first.user?.displayName || "user";

                        return (
                            <div
                                key={groupId}
                                className="post-card"
                                onClick={() => handleClickGroup(groupId)}
                            >
                                <div className="image-wrap">
                                    <img
                                        src={representativeImage}
                                        alt={title}
                                    />
                                </div>
                                <div className="post-info">
                                    <h3>
                                        {title}{" "}
                                        {items.length > 1 && (
                                            <span className="group-count">
                                                ({items.length}개)
                                            </span>
                                        )}
                                    </h3>
                                    <p className="post-content">
                                        {content || "내용 없음"}
                                    </p>
                                    <span className="post-user">
                                        ✍️ {userName}
                                    </span>
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
