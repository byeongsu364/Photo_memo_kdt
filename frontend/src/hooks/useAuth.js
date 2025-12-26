import { useEffect, useState } from "react";
import {
    fetchMe as apiFetchMe,
    logout as apiLogout,
    saveAuthToStorage,
    clearAuthStorage,
} from "../api/client";

export const useAuth = () => {
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [me, setMe] = useState(null);

    const isAuthed = !!token;

    /* ✅ 로그인 성공 처리 */
    const handleAuthed = async ({ user, token }) => {
        setUser(user);
        setToken(token ?? null);
        saveAuthToStorage({ user, token });
        await handleFetchMe();
    };

    /* ✅ 로그아웃 */
    const handleLogout = async () => {
        try {
            await apiLogout();
        } catch (e) {
            console.error(e);
        } finally {
            setUser(null);
            setToken(null);
            setMe(null);
            clearAuthStorage();
        }
    };

    /* ✅ /me 호출 */
    const handleFetchMe = async () => {
        try {
            const { user } = await apiFetchMe();
            setMe(user);
        } catch (e) {
            console.error(e);
            setMe({ error: "내정보 조회 실패" });
        }
    };

    /* ✅ 새로고침 시 인증 유지 */
    useEffect(() => {
        if (isAuthed) {
            handleFetchMe();
        }
    }, [isAuthed]);

    return {
        /* state */
        user,
        token,
        me,
        isAuthed,

        /* actions */
        handleAuthed,
        handleLogout,
        handleFetchMe,
    };
};
