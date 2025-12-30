import axios from "axios";

/* ============================================================
   ⚙️ Axios 기본 설정
============================================================ */
const BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

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
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
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
            console.warn("인증 만료 — 자동 로그아웃");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
        }
        return Promise.reject(err);
    }
);

/* ============================================================
   🔐 AUTH
============================================================ */

// ✅ 내 정보 조회
export async function fetchMe() {
    const { data } = await api.get("/api/auth/me");
    return data;
}

// ✅ 로그아웃
export async function logout() {
    const { data } = await api.post("/api/auth/logout");
    return data;
}

/* ============================================================
   💾 AUTH STORAGE
============================================================ */

export function saveAuthToStorage({ user, token }) {
    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    }
    if (token) {
        localStorage.setItem("token", token);
    }
}

export function clearAuthStorage() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
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
    const payload = {
        filename,
        contentType: contentType || mimeByExt(filename),
    };
    const { data } = await api.post("/api/upload/presign", payload);
    return data;
}

export async function uploadToS3(file, url) {
    await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || mimeByExt(file.name) },
        body: file,
    });
    return url.split("?")[0]; // 최종 imageUrl
}

/* ============================================================
   📸 포토메모 (Memo)
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

export async function updateMemo(
    id,
    { title, content, category, image }
) {
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
   📰 게시글 (Post)
============================================================ */
export async function fetchAllPosts() {
    const { data } = await api.get("/api/posts");
    return data;
}

export async function fetchPostDetail(id) {
    const { data } = await api.get(`/api/posts/${id}`);
    return data;
}

export async function deletePost(id) {
    const { data } = await api.delete(`/api/posts/${id}`);
    return data;
}

/* ============================================================
   🔚 default export
============================================================ */
export default api;
