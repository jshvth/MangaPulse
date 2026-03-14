import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AuthGate({ children }: { children: React.ReactElement }) {
  const { isAuthed, loading } = useAuth();

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center text-sm text-ink/60">
        Checking session...
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
