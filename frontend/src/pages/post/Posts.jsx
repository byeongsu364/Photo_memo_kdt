import React from "react";
import SearchBar from "./SearchBar";
import "./styles/Posts.scss";

const Posts = ({
    groupedPosts = {},
    onSearch = () => {},
    onClickGroup = () => {},
}) => {
    const groupEntries = Object.entries(groupedPosts);

    return (
        <div className="posts-page">
            <h2>전체 게시글</h2>

            <SearchBar onSearch={onSearch} />

            {groupEntries.length === 0 ? (
                <p className="no-posts">검색 결과가 없습니다.</p>
            ) : (
                <div className="posts-grid">
                    {groupEntries.map(([groupId, items]) => {
                        // createdAt 기준 DAY 1 보장
                        const sortedItems = [...items].sort(
                            (a, b) =>
                                new Date(a.createdAt) -
                                new Date(b.createdAt)
                        );

                        const first = sortedItems[0];

                        // 제목 (여행 제목 우선)
                        const title =
                            first.groupTitle || first.title;

                        /*
                          대표 썸네일 규칙 (프론트 최종)
                          - 여행: thumbnailUrl
                          - 일상: 첫 번째 memo.imageUrl
                          - 백엔드에서 resolvedThumbnail 내려오면 그걸 우선 사용
                        */
                        const representativeImage =
                            first.resolvedThumbnail ||
                            first.thumbnailUrl ||
                            first.imageUrl ||
                            "/images/no-image.png";

                        // 작성자
                        const userName = first.isAnonymous
                            ? "익명"
                            : first.user?.displayName || "user";

                        // 날짜
                        const dateStr = new Date(
                            first.createdAt
                        ).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        });

                        return (
                            <div
                                key={groupId}
                                className="post-card"
                                onClick={() =>
                                    onClickGroup(groupId)
                                }
                            >
                                <div className="image-wrap">
                                    <img
                                        src={representativeImage}
                                        alt={title}
                                        loading="lazy"
                                    />
                                </div>

                                <div className="post-info">
                                    <h3>{title}</h3>
                                    <p className="post-date">
                                        {dateStr}
                                    </p>
                                    <span className="post-user">
                                        {userName}
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
