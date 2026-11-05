import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { RequireAuth, useAuth } from "./auth";
import { ComingSoon } from "./landing/ComingSoon";
import { Landing } from "./landing/Landing";
import { Gallery } from "./hub/Gallery";
import { NewResume } from "./hub/NewResume";
import { ResumeHub } from "./hub/ResumeHub";
import { SiteGallery } from "./hub/SiteGallery";
import { Admin } from "./pages/Admin";
import { Dashboard } from "./pages/Dashboard";
import { Editor } from "./pages/Editor";
import { Login } from "./pages/Login";
import { PaymentResult } from "./pages/PaymentResult";
import { PdfEditor } from "./pages/PdfEditor";
import { PrintResume } from "./pages/PrintResume";

export function App() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const wide = pathname.startsWith("/resumes/") || pathname.startsWith("/admin");

  // The print page renders without the app shell so only the resume reaches the PDF.
  if (/^\/resumes\/[^/]+\/print$/.test(pathname)) {
    return (
      <Routes>
        <Route
          path="/resumes/:id/print"
          element={
            <RequireAuth>
              <PrintResume />
            </RequireAuth>
          }
        />
      </Routes>
    );
  }

  // The resume (PDF) editor has its own full-screen layout.
  if (/^\/resumes\/[^/]+\/pdf$/.test(pathname)) {
    return (
      <Routes>
        <Route
          path="/resumes/:id/pdf"
          element={
            <RequireAuth>
              <PdfEditor />
            </RequireAuth>
          }
        />
      </Routes>
    );
  }

  // Public marketing pages have their own header and full-width layout.
  if (pathname === "/" || pathname.startsWith("/soon/")) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/soon/:product" element={<ComingSoon />} />
      </Routes>
    );
  }

  // Resume section: side menu layout. "/resumes/:id" (the editor) is a different route and keeps the app shell.
  if (pathname === "/resume" || pathname.startsWith("/resume/")) {
    return (
      <ResumeHub>
        <Routes>
          <Route path="/resume" element={<Gallery />} />
          <Route path="/resume/sites" element={<SiteGallery />} />
          <Route
            path="/resume/mine"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/resume/new"
            element={
              <RequireAuth>
                <NewResume />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/resume" replace />} />
        </Routes>
      </ResumeHub>
    );
  }

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          رزومه‌ساز
        </Link>
        {user && (
          <div className="row gap">
            {user.role === "ADMIN" && (
              <Link to="/admin" className="btn ghost">
                مدیریت
              </Link>
            )}
            <span className="muted ltr">{user.phone}</span>
            <button className="btn ghost" onClick={logout}>
              خروج
            </button>
          </div>
        )}
      </header>

      <main className={wide ? "container wide" : "container"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Navigate to="/resume/mine" replace />} />
          <Route
            path="/resumes/:id"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Admin />
              </RequireAuth>
            }
          />
          <Route
            path="/payment/result"
            element={
              <RequireAuth>
                <PaymentResult />
              </RequireAuth>
            }
          />
          <Route path="*" element={<p className="center muted">صفحه پیدا نشد</p>} />
        </Routes>
      </main>
    </>
  );
}
