import React from 'react'
import "./styles/Landing.scss"
import { Link } from 'react-router-dom'

const Landing = () => {
    // ✅ 로그인 상태 확인 (token 존재 여부로 판단)
    const isAuthed = !!localStorage.getItem("token");

    return (
        <section className="landing">
            <div className="container">
                <div className="landing-hero">
                    <h1>포토메모</h1>
                    <p className="landing-sub">
                        사진 한 장, 한 줄 메모. 태그 · 검색 · 공유까지.
                    </p>

                    {/* ✅ 로그인 여부에 따라 이동 경로 변경 */}
                    <Link
                        to={isAuthed ? "/user/dashboard" : "/admin/login"}
                        className="btn btn-primary"
                    >
                        시작하기
                    </Link>
                </div>

                <ul className="landing-features">
                    <li>
                        <h3>빠른 기록</h3>
                        <p>이미지 업로드 후 한 줄 메모로 즉시 저장.</p>
                    </li>
                    <li>
                        <h3>태그 & 검색</h3>
                        <p>태그로 묶고 검색으로 바로 찾기.</p>
                    </li>
                    <li>
                        <h3>간단 공유</h3>
                        <p>공유 링크로 가볍게 전달.</p>
                    </li>
                </ul>
            </div>
        </section>
    );
};

export default Landing;
