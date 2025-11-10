import React from "react";
import FileList from "../../pages/user/FileList"; // ✅ 기존 컴포넌트 재활용
import "./style/MyPage.scss"; // ✅ 스타일링을 위한 CSS 파일

const MyPage = () => {
    return (
        <div className="mypage-container">
            <h1>👤 마이페이지</h1>
            <p className="mypage-desc">내 포토메모 기록을 한눈에 확인해보세요.</p>
            <FileList /> {/* ✅ 기존 목록 그대로 출력 */}
        </div>
    );
};

export default MyPage;
