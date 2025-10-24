import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    fetchPostDetail,
    deletePost,
    updatePost,
    getErrorMessage
} from "../api/client";

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ title: "", content: "" });

    const user = JSON.parse(localStorage.getItem("user"));
    const isMine = post?.user?._id === user?._id;

    // ✅ 게시글 데이터 가져오기
    useEffect(() => {
        const loadPost = async () => {
            try {
                const data = await fetchPostDetail(id);
                setPost(data);
                setForm({ title: data.title, content: data.content });
            } catch (error) {
                alert(getErrorMessage(error, "게시글 불러오기 실패"));
            } finally {
                setLoading(false);
            }
        };
        loadPost();
    }, [id]);

    // ✅ 게시글 삭제
    const handleDelete = async () => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deletePost(id);
            alert("삭제 완료");
            navigate("/posts");
        } catch (error) {
            alert(getErrorMessage(error, "삭제 실패"));
        }
    };

    // ✅ 게시글 수정
    const handleUpdate = async () => {
        try {
            await updatePost(id, {
                title: form.title,
                content: form.content,
            });
            alert("수정 완료");
            setEditing(false);
            setPost({ ...post, title: form.title, content: form.content });
        } catch (error) {
            alert(getErrorMessage(error, "수정 실패"));
        }
    };

    if (loading) return <div className="post-detail">로딩 중...</div>;
    if (!post) return <div className="post-detail">게시글을 찾을 수 없습니다.</div>;

    return (
        <section className="post-detail">
            <div className="post-container">
                {/* 이미지 */}
                {Array.isArray(post.fileUrl) && post.fileUrl.length > 0 && (
                    <img
                        src={post.fileUrl[0]}
                        alt={post.title}
                        className="post-image"
                    />
                )}

                {/* 수정 모드 */}
                {editing ? (
                    <div className="edit-form">
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="edit-title"
                        />
                        <textarea
                            rows="6"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            className="edit-content"
                        />
                        <div className="edit-actions">
                            <button onClick={handleUpdate} className="btn-save">저장</button>
                            <button onClick={() => setEditing(false)} className="btn-cancel">취소</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 제목 / 내용 */}
                        <h2 className="post-title">{post.title}</h2>
                        <p className="post-meta">
                            작성자: {post.user?.displayName || "익명"} ·{" "}
                            {new Date(post.createdAt).toLocaleString()}
                        </p>
                        <p className="post-content">{post.content}</p>

                        {/* 수정 / 삭제 버튼 */}
                        {isMine && (
                            <div className="post-actions">
                                <button onClick={() => setEditing(true)} className="btn-edit">
                                    수정
                                </button>
                                <button onClick={handleDelete} className="btn-delete">
                                    삭제
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* 뒤로가기 */}
                <div className="post-back">
                    <button onClick={() => navigate("/posts")} className="btn-back">
                        ← 목록으로
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PostDetail;
