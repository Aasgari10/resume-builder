// Opens a draft editor with the template and color chosen in the gallery. Nothing is stored
// here: the resume is created only when the user presses Save in the editor (see useResumeDoc).
// Sign-in is required (the route is guarded) and the user returns here after login.

import { Navigate, useSearchParams } from "react-router-dom";
import { DRAFT_ID } from "../components/editor/useResumeDoc";

export function NewResume() {
  const [params] = useSearchParams();
  const query = params.toString();
  const path = params.get("site") ? `/resumes/${DRAFT_ID}?view=site&${query}` : `/resumes/${DRAFT_ID}/pdf?${query}`;
  return <Navigate to={path} replace />;
}
