import React from "react";
import FileList from "../../pages/user/FileList";
import "./styles/MyPage.scss";

const MyPage = () => {
    return (
        <div className="mypage-container">
            <h1>마이페이지</h1>
            <p className="mypage-desc">
                내 포토메모 기록을 한눈에 확인해보세요.
            </p>
            <FileList />
        </div>
    );
};

export default MyPage;
