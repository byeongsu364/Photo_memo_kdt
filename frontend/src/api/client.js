import axios from "axios";

// ✅ 환경 변수에서 API URL 가져오기
const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // ✅ 쿠키 인증 유지
});

// ✅ 요청 인터셉터 (JWT 자동 추가)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터 (401, 403 → 자동 로그아웃)
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const code = err?.response?.status;
        if (code === 401 || code === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
        return Promise.reject(err);
    }
);

// ✅ 에러 메시지 추출 유틸
export function getErrorMessage(error, fallback = "요청 실패") {
    return error.response?.data?.message || error.message || fallback;
}

/* ============================================================
   🧾 인증 관련 API
============================================================ */

// ✅ 회원가입
export async function register({ email, password, displayName }) {
    const { data } = await api.post("/api/auth/register", {
        email,
        password,
        displayName,
    });
    return data;
}

// ✅ 로그인
export async function login({ email, password }) {
    const { data } = await api.post("/api/auth/login", { email, password });
    return data;
}

// ✅ 내 정보 조회
export async function fetchMe() {
    const { data } = await api.get("/api/auth/me");
    return data;
}

// ✅ 로그아웃
export async function logout() {
    return await api.post("/api/auth/logout");
}

// ✅ 로컬스토리지 저장/삭제
export function saveAuthToStorage({ user, token }) {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    if (token) localStorage.setItem("token", token);
}

export function clearAuthStorage() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
}

/* ============================================================
   ☁️ S3 Presigned URL 관련 API
============================================================ */

// ✅ presign 요청 → S3 업로드 URL 발급
export async function getPresignedUrl(filename, contentType) {
    const { data } = await api.post("/api/upload/presign", {
        filename,
        contentType,
    });
    return data; // { url, key }
}

// ✅ S3로 직접 업로드
export async function uploadToS3(file, url) {
    await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });

    // S3에 실제로 올라간 URL 반환
    return url.split("?")[0];
}

/* ============================================================
   📸 포토메모 관련 API
============================================================ */

// ✅ 포토메모 업로드 (S3 → DB)
export async function uploadMemo({ title, content, category, image }) {
    // 1️⃣ presign URL 요청
    const { url, key } = await getPresignedUrl(image.name, image.type);

    // 2️⃣ S3 직접 업로드
    const imageUrl = await uploadToS3(image, url);

    // 3️⃣ DB에 포토메모 정보 저장
    const { data } = await api.post("/api/memo", {
        title,
        content,
        category,
        imageUrl, // ⚡ 이제 S3 URL만 저장
    });

    return data;
}

// ✅ 내 포토메모 조회
export async function fetchMyMemos() {
    const { data } = await api.get("/api/memo/me");
    return data;
}

// ✅ 포토메모 삭제
export async function deleteMemo(id) {
    const { data } = await api.delete(`/api/memo/${id}`);
    return data;
}

// ✅ 포토메모 수정 (이미지 교체 포함)
export async function updateMemo(id, { title, content, category, image }) {
    let imageUrl;

    // 새 이미지가 있으면 presign 받아서 교체
    if (image) {
        const { url } = await getPresignedUrl(image.name, image.type);
        imageUrl = await uploadToS3(image, url);
    }

    const payload = { title, content, category };
    if (imageUrl) payload.imageUrl = imageUrl;

    const { data } = await api.put(`/api/memo/${id}`, payload);
    return data;
}

export default api;
