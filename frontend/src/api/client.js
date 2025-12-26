import axios from "axios";

/* ============================================================
   ⚙️ Axios 기본 설정
============================================================ */
const BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, 
    headers: { "Content-Type": "application/json" },
});

/* ============================================================
   🪪 JWT 자동 첨부
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
   🚨 인증 만료 처리
============================================================ */
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const code = err?.response?.status;
        if (code === 401 || code === 403) {
            console.warn("🚫 인증 만료 — 자동 로그아웃 처리됨");
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
   ☁️ S3 Presigned URL
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

export async function getPresignedUrl(filename, contentType) {
    const payload = { filename, contentType: contentType || mimeByExt(filename) };
    const { data } = await api.post("/api/upload/presign", payload);
    return data; 
}

export async function uploadToS3(file, url) {
    await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || mimeByExt(file.name) },
        body: file,
    });
    return url.split("?")[0];
}

/* ============================================================
   🧾 인증(Auth)
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
   📸 포토메모
============================================================ */
export async function uploadMemo(payload) {
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
   🧩 그룹
============================================================ */
export async function fetchGroupMemos(groupId) {
    const { data } = await api.get(`/api/memo/group/${groupId}`);
    return data;
}

export async function updateGroupMemos(groupId, { groupTitle, items }) {
    const payload = { groupTitle, items };
    const { data } = await api.put(`/api/memo/group/${groupId}`, payload);
    return data;
}

/* ============================================================
   📰 게시글(Post)
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
