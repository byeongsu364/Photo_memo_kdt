import React from "react";
import "./styles/PostDetail.scss";

const PostDetail = ({
    loading = false,
    group,
    single,
    onBack,
}) => {
    const isLoggedIn = !!localStorage.getItem("token");

    /* ======================================================
       로딩 / 에러
    ====================================================== */
    if (loading) {
        return (
            <div className="post-detail-page">
                로딩 중...
            </div>
        );
    }

    if (!group && !single) {
        return (
            <div className="post-detail-page">
                게시글을 불러올 수 없습니다.
            </div>
        );
    }

    /* ======================================================
       📦 그룹 게시글
    ====================================================== */
    if (group) {
        const { groupTitle, userName, items = [] } = group;

        return (
            <div className="post-detail-page">
                <button className="back-btn" onClick={onBack}>
                    돌아가기
                </button>

                <h2>{groupTitle}</h2>
                <p className="post-user">작성자: {userName}</p>

                <div className="post-gallery">
                    {items.map((m) => {
                        const imageSrc =
                            m.thumbnailUrl || m.imageUrl;

                        return (
                            <div
                                key={m._id}
                                className="memo-card"
                            >
                                {imageSrc && (
                                    <img
                                        src={imageSrc}
                                        alt={m.title}
                                        loading="lazy"
                                    />
                                )}

                                <div className="memo-info">
                                    {m.day && (
                                        <span className="memo-day">
                                            {m.day}
                                        </span>
                                    )}
                                    <h3>{m.title}</h3>
                                    <p>{m.content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ==========================
                    댓글 영역
                ========================== */}
                <section className="comments-section">
                    <h3>댓글</h3>

                    <div className="comment-list empty">
                        아직 댓글이 없습니다.
                    </div>

                    {isLoggedIn ? (
                        <div className="comment-input">
                            <textarea
                                placeholder="댓글을 입력하세요"
                                disabled
                            />
                            <button disabled>
                                등록
                            </button>
                            <p className="comment-hint">
                                댓글 기능은 추후 제공 예정입니다.
                            </p>
                        </div>
                    ) : (
                        <div className="comment-login-box">
                            <p>
                                댓글을 작성하려면
                                로그인이 필요합니다.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        );
    }

    /* ======================================================
       📄 단일 게시글
    ====================================================== */
    return (
        <div className="post-detail-page">
            <button className="back-btn" onClick={onBack}>
                돌아가기
            </button>

            <h2>{single.title}</h2>
            <p className="post-user">
                작성자: {single.userName}
            </p>

            <div className="single-post">
                {single.imageUrl && (
                    <img
                        src={single.imageUrl}
                        alt={single.title}
                        loading="lazy"
                    />
                )}

                <div className="memo-info">
                    <p>{single.content}</p>
                </div>
            </div>

            {/* ==========================
                댓글 영역
            ========================== */}
            <section className="comments-section">
                <h3>댓글</h3>

                <div className="comment-list empty">
                    아직 댓글이 없습니다.
                </div>

                {isLoggedIn ? (
                    <div className="comment-input">
                        <textarea
                            placeholder="댓글을 입력하세요"
                            disabled
                        />
                        <button disabled>
                            등록
                        </button>
                        <p className="comment-hint">
                            댓글 기능은 추후 제공 예정입니다.
                        </p>
                    </div>
                ) : (
                    <div className="comment-login-box">
                        <p>
                            댓글을 작성하려면
                            로그인이 필요합니다.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default PostDetail;
