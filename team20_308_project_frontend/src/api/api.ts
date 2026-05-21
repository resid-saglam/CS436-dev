const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export async function apiFetch<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const res = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
