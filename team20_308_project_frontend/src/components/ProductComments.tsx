import React, { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";
import { jwtDecode } from "jwt-decode";
import "../styles/ProductComments.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

interface Comment {
  id: number;
  text: string;
  approved: boolean;
  createdAt: string;
  User: { id: number; name: string };
}

interface ProductCommentsProps {
  productId: number;
}

const ProductComments: React.FC<ProductCommentsProps> = ({ productId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const { addToast } = useToast();
  const token = localStorage.getItem("token");

  let currentUserId: number | null = null;
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      currentUserId = decoded.id;
    } catch {}
  }

  const maxWords = 100;
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/comments/${productId}`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data);

        const mine = data.find((c: Comment) => c.User?.id === currentUserId);
        if (mine) {
          setText(mine.text);
          setEditing(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [productId]);

  const handleSubmit = async () => {
    if (!token) {
      addToast("You need to login to comment.", "error");
      return;
    }
    if (!text.trim()) {
      addToast("Comment text cannot be empty.", "warning");
      return;
    }

    const payload = { productId, text: text.trim() };
    const existing = comments.find((c) => c.User?.id === currentUserId);

    const url = existing
      ? `${API_BASE}/comments/${existing.id}`
      : `${API_BASE}/comments`;
    const method = existing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        addToast(
          existing
            ? "Comment updated – waiting for re-approval."
            : "Comment sent – will be visible after approval.",
          "success"
        );
        setEditing(true);
        fetchComments();
      } else {
        const err = await res.json();
        addToast(err.message || "Something went wrong.", "error");
      }
    } catch (e) {
      console.error(e);
      addToast("Network error.", "error");
    }
  };

  return (
    <div className="pc-wrapper">
      <h3>Reviews</h3>

      {comments.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li
              key={c.id}
              className={`pc-card ${
                c.User?.id === currentUserId ? "my-comment" : ""
              }`}
            >
              <strong>{c.User?.name ?? "User"}:</strong> {c.text}
            </li>
          ))}
        </ul>
      )}

      {token ? (
        <>
          <div className="pc-new">
            <h4>{editing ? "Edit your review" : "Add a review"}</h4>
            <textarea
              className="comment-textarea"
              value={text}
              onChange={(e) => {
                const words = e.target.value.trim().split(/\s+/);
                if (words.length <= maxWords) {
                  setText(e.target.value);
                }
              }}
              rows={4}
              placeholder="Write your review..."
            />
            <div className="pc-btn-row">
              <span className="word-counter">
                {wordCount}/{maxWords}
              </span>
              <button
                className="primary"
                onClick={handleSubmit}
                disabled={!text.trim()}
              >
                {editing ? "Edit" : "Submit"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <p>You must be logged in to leave a review.</p>
      )}
    </div>
  );
};

export default ProductComments;
