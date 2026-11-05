import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../utils/auth";

// Bloqueia a página para quem não está logado e volta para ela depois do login
export default function RequireAuth({ children }) {
  const location = useLocation();
  if (!getSession()) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
