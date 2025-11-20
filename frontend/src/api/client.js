// src/api/client.js
import axios from "axios";

/* ============================================================
   ⚙️ 백엔드 URL 자동 선택 (로컬 + 배포 모두 지원)
============================================================ */
let BASE_URL = "";

// 로컬 환경 (localhost에서 열렸을 때)
if (window.location.hostname === "localhost") {
    BASE_URL = import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
} 
// 배포 환경 (Vercel 등)
else {
    BASE_URL = import.meta.env.VITE_API_URL;
}

console.log("📡 선택된 API URL =", BASE_URL);

/* ============================================================
   ⚙️ Axios 기본 설정
============================================================ */
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

/* ============================================================
   🪪 JWT 자동 첨부 인터셉터
============================================================ */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

/* ============================================================
   🚨 응답 인터셉터 — 인증 만료 처리
============================================================ */
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const code = err?.response?.status;
        if (code === 401 || code === 403) {
            console.warn("🚫 인증 만료 — 자동 로그아웃");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
        }
        return Promise.reject(err);
    }
);

/* ============================================================
   📦 에러 메시지 유틸
============================================================ */
export function getErrorMessage(error, fallback = "요청 실패") {
    return error.response?.data?.message || error.message || fallback;
}

/* ============================================================
   ☁️ S3 Presigned URL 관련 API
============================================================ */
function mimeByExt(name) {
    const ext = name.split(".").pop()?.toLowerCase();
    const map = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        heic: "image/heic",
        heif: "image/heif",
    };
    return map[ext] || "application/octet-stream";
}

// presign 요청 → S3 업로드 URL 발급
export async function getPresignedUrl(filename, contentType) {
    const payload = {
        filename,
        contentType: contentType || mimeByExt(filename),
    };

    console.log("📤 presign 요청:", payload);

    const { data } = await api.post("/api/upload/presign", payload, {
        headers: { "Content-Type": "application/json" },
    });

    console.log("📥 presign 응답:", data);
    return data;
}

// S3로 실제 업로드
export async function uploadToS3(file, url) {
    await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": file.type || mimeByExt(file.name),
        },
        body: file,
    });

    return url.split("?")[0];
}

/* ============================================================
   🧾 인증(Auth) 관련 API
============================================================ */
export async function register({ email, password, displayName }) {
    const { data } = await api.post("/api/auth/register", {
        email,
        password,
        displayName,
    });
    return data;
}

export async function login({ email, password }) {
    const { data } = await api.post("/api/auth/login", { email, password });
    return data;
}

export async function fetchMe() {
    const { data } = await api.get("/api/auth/me");
    return data;
}

export async function logout() {
    return await api.post("/api/auth/logout");
}

export function saveAuthToStorage({ user, token }) {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    if (token) localStorage.setItem("token", token);
}

export function clearAuthStorage() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
}

/* ============================================================
   📸 포토메모 관련 API
============================================================ */
export async function uploadMemo({
    title,
    content,
    category,
    imageUrl,
    isAnonymous,
    groupId,
    groupTitle,
    totalMemos,
}) {
    const payload = {
        title,
        content,
        category,
        imageUrl,
        isAnonymous,
        groupId,
        groupTitle,
        totalMemos,
    };

    console.log("📤 업로드 payload:", payload);

    const { data } = await api.post("/api/memo", payload);
    return data;
}

export async function fetchMyMemos() {
    const { data } = await api.get("/api/memo/me");
    return data;
}

export async function deleteMemo(id) {
    const { data } = await api.delete(`/api/memo/${id}`);
    return data;
}

export async function updateMemo(id, { title, content, category, image }) {
    let imageUrl;

    if (image) {
        const { url } = await getPresignedUrl(image.name, image.type);
        imageUrl = await uploadToS3(image, url);
    }

    const payload = { title, content, category };
    if (imageUrl) payload.imageUrl = imageUrl;

    const { data } = await api.put(`/api/memo/${id}`, payload);
    return data;
}

/* ============================================================
   🧩 그룹 메모 API
============================================================ */
export async function fetchGroupMemos(groupId) {
    const { data } = await api.get(`/api/memo/group/${groupId}`);
    return data;
}

export async function updateGroupMemos(groupId, { groupTitle, items }) {
    const { data } = await api.put(`/api/memo/group/${groupId}`, {
        groupTitle,
        items,
    });
    return data;
}

/* ============================================================
   📰 게시글(Post) 관련 API
============================================================ */
export async function fetchAllPosts() {
    const { data } = await api.get("/api/posts");
    return data;
}

export async function fetchPostDetail(id) {
    const { data } = await api.get(`/api/posts/${id}`);
    return data;
}

export async function createPost({ title, content, imageUrl }) {
    const payload = { title, content, imageUrl };
    const { data } = await api.post("/api/posts", payload);
    return data;
}

export async function updatePost(id, { title, content, imageUrl }) {
    const payload = { title, content, imageUrl };
    const { data } = await api.put(`/api/posts/${id}`, payload);
    return data;
}

export async function deletePost(id) {
    const { data } = await api.delete(`/api/posts/${id}`);
    return data;
}

export default api;
