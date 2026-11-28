import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { RequireAuth, useAuth } from "./auth";
import { ComingSoon } from "./landing/ComingSoon";
import { Landing } from "./landing/Landing";
import { About } from "./site4site/About";
import { Account } from "./site4site/Account";
import { Contact } from "./site4site/Contact";
import { Home } from "./site4site/Home";
import { Pricing } from "./site4site/Pricing";
import { Soon } from "./site4site/Soon";
import { Support } from "./site4site/Support";
import { SnapPage, Templates } from "./site4site/Templates";
import { Gallery } from "./hub/Gallery";
import { MyOrders } from "./hub/MyOrders";
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
  const { pathname, search } = useLocation();
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

  // Development only: one template at full size, for the template pictures (scripts/snap-templates.mjs).
  if (import.meta.env.DEV && pathname === "/__snap") return <SnapPage />;

  // The site4site building: the home page and its units have their own frame.
  if (/^\/(templates|about|pricing|support|contact|blog|login|account(\/(orders|tickets|profile))?)?\/?$/.test(pathname)) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account section="home" />} />
        <Route path="/account/orders" element={<Account section="orders" />} />
        <Route path="/account/tickets" element={<Account section="tickets" />} />
        <Route path="/account/profile" element={<Account section="profile" />} />
        <Route path="/" element={<Home />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/support" element={<Support />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Soon unit="blog" />} />
      </Routes>
    );
  }

  // The earlier products page and its "coming soon" pages.
  if (pathname === "/products" || pathname.startsWith("/soon/")) {
    return (
      <Routes>
        <Route path="/products" element={<Landing />} />
        <Route path="/soon/:product" element={<ComingSoon />} />
      </Routes>
    );
  }

  // Resume section: side menu layout. "/resumes/:id" (the editor) is a different route and keeps the app shell.
  // The customer's own pages moved to the dashboard (/account).
  if (pathname === "/resume/mine" || pathname === "/dashboard") return <Navigate to="/account" replace />;
  if (pathname === "/resume/orders") return <Navigate to={`/account/orders${search}`} replace />;

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
            path="/resume/orders"
            element={
              <RequireAuth>
                <MyOrders />
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

  // The site editor uses the whole screen; its own bar has the way back.
  const bare = /^\/resumes\/[^/]+$/.test(pathname);
  return (
    <>
      {!bare && (
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
      )}

      <main className={bare ? "editor-main" : wide ? "container wide" : "container"}>
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
