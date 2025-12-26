import React from "react";
import Posts from "./Posts";
import { usePosts } from "./hooks/usePosts";

const PostsContainer = () => {
    const {
        groupedPosts,
        handleSearch,
        handleClickGroup,
    } = usePosts();

    return (
        <Posts
            groupedPosts={groupedPosts}
            onSearch={handleSearch}
            onClickGroup={handleClickGroup}
        />
    );
};

export default PostsContainer;
