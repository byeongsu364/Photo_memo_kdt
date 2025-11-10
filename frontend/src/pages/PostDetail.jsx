import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchGroupMemos, fetchPostDetail } from "../api/client";
import "./PostDetail.scss";

const PostDetail = () => {
    const { id } = useParams(); // groupId 또는 postId
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [single, setSingle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // ✅ 그룹 게시글 시도
                const groupData = await fetchGroupMemos(id);
                if (groupData && groupData.items?.length > 0) {
                    setGroup(groupData);
                } else {
                    // ✅ 그룹 데이터 없으면 단일 게시글 조회
                    const postData = await fetchPostDetail(id);
                    setSingle(postData);
                }
            } catch (err) {
                console.error("❌ 상세 로드 실패:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return <div className="post-detail-page">⏳ 로딩 중...</div>;
    if (!group && !single)
        return <div className="post-detail-page">❌ 게시글을 불러올 수 없습니다.</div>;

    // ✅ 그룹 게시글 렌더링
    if (group) {
        const { groupTitle, items = [] } = group;
        const userName = items[0]?.isAnonymous
            ? "익명"
            : items[0]?.user?.displayName || "user";

        return (
            <div className="post-detail-page">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← 돌아가기
                </button>

                <h2>📁 {groupTitle || "그룹 게시글"}</h2>
                <p className="post-user">✍️ 작성자: {userName}</p>

                <div className="post-gallery">
                    {items.map((m) => (
                        <div key={m._id} className="memo-card">
                            <img src={m.imageUrl} alt={m.title} />
                            <div className="memo-info">
                                <h3>{m.title}</h3>
                                <p>{m.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ✅ 단일 게시글 렌더링
    const post = single;
    const userName = post.isAnonymous
        ? "익명"
        : post.user?.displayName || "user";

    return (
        <div className="post-detail-page">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← 돌아가기
            </button>

            <h2>📷 {post.title}</h2>
            <p className="post-user">✍️ 작성자: {userName}</p>

            <div className="single-post">
                <img src={post.imageUrl} alt={post.title} />
                <div className="memo-info">
                    <p>{post.content}</p>
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
