import React from "react";
import Posts from "./Posts";
import { usePosts } from "./hooks/usePosts";

const PostsContainer = () => {
    const {
        groupedPosts,
        onSearch,
        onClickGroup,
    } = usePosts();

    return (
        <Posts
            groupedPosts={groupedPosts}
            onSearch={onSearch}
            onClickGroup={onClickGroup}
        />
    );
};

export default PostsContainer;
