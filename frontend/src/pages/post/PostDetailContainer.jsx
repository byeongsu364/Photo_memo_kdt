import React from "react";
import { useNavigate } from "react-router-dom";
import PostDetail from "./PostDetail";
import { usePostDetail } from "./hooks/usePostDetail";

const PostDetailContainer = () => {
    const navigate = useNavigate();

    const {
        loading,
        group,
        single,
        goBack,
    } = usePostDetail();

    return (
        <PostDetail
            loading={loading}
            group={group}
            single={single}
            onBack={goBack}
        />
    );
};

export default PostDetailContainer;
