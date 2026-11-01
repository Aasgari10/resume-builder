import { Link, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, useAuth } from "./auth";
import { Dashboard } from "./pages/Dashboard";
import { Editor } from "./pages/Editor";
import { Login } from "./pages/Login";

export function App() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          رزومه‌ساز
        </Link>
        {user && (
          <div className="row gap">
            <span className="muted ltr">{user.phone}</span>
            <button className="btn ghost" onClick={logout}>
              خروج
            </button>
          </div>
        )}
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/resumes/:id"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route path="*" element={<p className="center muted">صفحه پیدا نشد</p>} />
        </Routes>
      </main>
    </>
  );
}
