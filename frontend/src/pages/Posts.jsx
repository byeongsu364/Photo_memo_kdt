import React, { useEffect, useState } from "react";
import { fetchAllPosts } from "../api/client";
import "./Posts.scss";

const Posts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await fetchAllPosts();
            setPosts(data);
        } catch (err) {
            console.error("게시글 불러오기 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="loading">불러오는 중...</p>;

    return (
        <section className="posts-section">
            <h2>전체 게시글</h2>
            <div className="post-grid">
                {posts.map((post) => (
                    <div
                        key={post._id}
                        onClick={() => navigate(`/posts/${post._id}`)}
                        className="post-card"
                    >
                        <img src={post.fileUrl[0]} alt={post.title} />
                        <div className="post-info">
                            <h3>{post.title}</h3>
                            <p>{post.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

    );
};

export default Posts;
