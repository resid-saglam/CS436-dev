import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

interface Props {
  roles: string[];
  children: ReactNode;
}

const RequireRole = ({ roles, children }: Props) => {
  const { role, isLoggedIn } = useAuth();
  const loc = useLocation();

  /* ⏳  AuthContext henüz role bilgisini almadıysa bekle */
  if (isLoggedIn && role === null) return null;

  if (!isLoggedIn) return <Navigate to="/" state={{ from: loc }} replace />;

  if (!roles.includes((role || "").trim())) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default RequireRole;
