const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5002/api";

/**
 * LOGIN
 */
export async function loginUser(email: string, password: string) {
  try {
    const sessionId = localStorage.getItem("sessionId"); // 👉 Sepet devri için gerekli

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, sessionId }), // 👉 Ekledik
    });

    // Parse the response as JSON
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Login API error:", error);
    return {
      success: false,
      message: "Network error",
    };
  }
}

/**
 * REGISTER
 */
export async function registerUser(
    name: string,
    email: string,
    password: string
) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Register API error:", error);
    return {
      success: false,
      message: "Network error",
    };
  }
}
