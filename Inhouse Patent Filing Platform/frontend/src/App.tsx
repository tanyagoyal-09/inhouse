import { Route, Routes } from "react-router-dom";

import { AdminDocuments } from "./admin/AdminDocuments";
import { AdminOverview } from "./admin/AdminOverview";
import { AdminPatentReview } from "./admin/AdminPatentReview";
import { AdminPatents } from "./admin/AdminPatents";
import { AdminProvider } from "./admin/AdminContext";
import { AdminSearch } from "./admin/AdminSearch";
import { PublicOnly, RequireRole } from "./auth/RouteGuards";
import { AppShell } from "./components/layout/AppShell";
import { PatentSearch } from "./components/layout/HeaderSearch";
import { PublicLayout } from "./components/layout/PublicLayout";
import { NavigationTracker } from "./navigation/NavigationTracker";
import { ScrollManager } from "./navigation/ScrollManager";
import { AdminLogin } from "./pages/AdminLogin";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Documents } from "./pages/Documents";
import { Landing } from "./pages/Landing";
import { NotFound } from "./pages/NotFound";
import { Patents } from "./pages/Patents";
import { Profile } from "./pages/Profile";
import { Tracking } from "./pages/Tracking";
import {
  PatentDetailsRoute,
  PatentEditRoute,
  PatentNewRoute,
} from "./routes/PatentRoutes";

/**
 * Route table – every major feature has its own URL.
 *
 *   /                          Landing (public)
 *   /login  /register          Applicant / Faculty sign in (public only)
 *   /admin/login               Administrator sign in (public only)
 *
 *   /dashboard                 Applicant / Faculty workspace
 *   /patents                   My patents (supports ?q=search)
 *   /patents/new               New patent draft
 *   /patents/:patentId         Patent details
 *   /patents/:patentId/edit    Edit / resubmit
 *   /documents                 Document generation & management
 *   /tracking                  Status tracking
 *   /profile                   Profile
 *
 *   /admin                     Administration overview
 *   /admin/patents             Applications list
 *   /admin/patents/:patentId   Application review
 *   /admin/documents           Document review
 *
 *   *                          404
 */
export default function App() {
  return (
    <NavigationTracker>
      <ScrollManager />

      <Routes>
        {/* Public pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />

          <Route element={<PublicOnly />}>
            <Route path="/login" element={<Auth key="login" mode="login" />} />
            <Route path="/register" element={<Auth key="register" mode="register" />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Applicant / Faculty */}
        <Route element={<RequireRole roles={["APPLICANT", "FACULTY"]} loginPath="/login" />}>
          <Route element={<AppShell variant="applicant" search={<PatentSearch />} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patents" element={<Patents />} />
            <Route path="/patents/new" element={<PatentNewRoute />} />
            <Route path="/patents/:patentId" element={<PatentDetailsRoute />} />
            <Route path="/patents/:patentId/edit" element={<PatentEditRoute />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Administrator */}
        <Route path="/admin" element={<RequireRole roles={["ADMIN"]} loginPath="/admin/login" />}>
          <Route element={<AdminProvider />}>
            <Route element={<AppShell variant="admin" search={<AdminSearch />} />}>
              <Route index element={<AdminOverview />} />
              <Route path="patents" element={<AdminPatents />} />
              <Route path="patents/:patentId" element={<AdminPatentReview />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </NavigationTracker>
  );
}
