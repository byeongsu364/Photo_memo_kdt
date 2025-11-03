import React, { useEffect, useState } from "react";
import { fetchAllPosts } from "../api/client";
import "./Posts.scss";

const Posts = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const data = await fetchAllPosts();
                console.log("📸 게시글 데이터:", data);
                setPosts(data);
            } catch (err) {
                console.error("❌ 게시글 로드 실패:", err);
            }
        };
        loadPosts();
    }, []);

    return (
        <div className="posts-page">
            <h2>📸 전체 게시글</h2>

            {posts.length === 0 ? (
                <p className="no-posts">아직 게시글이 없습니다.</p>
            ) : (
                <div className="posts-grid">
                    {posts.map((post) => (
                        <div key={post._id} className="post-card">
                            <div className="image-wrap">
                                <img src={post.imageUrl} alt={post.title} />
                            </div>
                            <div className="post-info">
                                <h3>{post.title}</h3>
                                <p className="post-content">{post.content}</p>
                                <span className="post-user">
                                    ✍️ {post.isAnonymous ? "익명" : post.user?.displayName || "유저"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Posts;
