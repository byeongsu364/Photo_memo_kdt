import React from 'react'
import './styles/Landing.scss'
import { Link } from 'react-router-dom'
import { useLanding } from './hooks/useLanding'

const Landing = () => {
    const { writePath } = useLanding()

    return (
        <section className="landing">
            <div className="container">
                <div className="landing-hero">
                    <h1>포토메모 게시판</h1>
                    <p className="landing-sub">
                        사진과 글을 함께 남기는 공간. <br />
                        당신의 이야기를 기록하세요 📸
                    </p>

                    <div className="landing-buttons">
                        <Link to="/posts" className="btn btn-outline">
                            시작하기
                        </Link>

                        <Link to={writePath} className="btn primary">
                            글쓰기
                        </Link>
                    </div>
                </div>

                <ul className="landing-features">
                    <li>
                        <h3>빠른 기록</h3>
                        <p>이미지와 함께 바로 게시글을 작성할 수 있습니다.</p>
                    </li>
                    <li>
                        <h3>전체 공유</h3>
                        <p>모든 사용자가 작성한 글을 한눈에 볼 수 있습니다.</p>
                    </li>
                    <li>
                        <h3>내 글 관리</h3>
                        <p>내가 쓴 글은 대시보드에서 수정/삭제 가능합니다.</p>
                    </li>
                </ul>
            </div>
        </section>
    )
}

export default Landing
