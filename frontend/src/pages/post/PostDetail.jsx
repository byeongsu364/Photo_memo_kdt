import React from "react";
import "./styles/PostDetail.scss";

const PostDetail = ({
    loading = false,
    group,
    single,
    onBack,
}) => {
    if (loading) {
        return <div className="post-detail-page">⏳ 로딩 중...</div>;
    }

    if (!group && !single) {
        return (
            <div className="post-detail-page">
                ❌ 게시글을 불러올 수 없습니다.
            </div>
        );
    }

    /* 그룹 게시글 */
    if (group) {
        const { groupTitle, userName, items = [] } = group;

        return (
            <div className="post-detail-page">
                <button className="back-btn" onClick={onBack}>
                    ← 돌아가기
                </button>

                <h2>📁 {groupTitle}</h2>
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

    /* 단일 게시글 */
    return (
        <div className="post-detail-page">
            <button className="back-btn" onClick={onBack}>
                ← 돌아가기
            </button>

        <h2>📷 {single.title}</h2>
        <p className="post-user">✍️ 작성자: {single.userName}</p>

        <div className="single-post">
            <img src={single.imageUrl} alt={single.title} />
            <div className="memo-info">
                <p>{single.content}</p>
            </div>
        </div>
    </div>
    );
};

export default PostDetail;
