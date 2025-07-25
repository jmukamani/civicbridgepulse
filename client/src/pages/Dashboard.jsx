import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import Representatives from "./Representatives.jsx";
import PolicyAnalysis from "./PolicyAnalysis.jsx";
import Settings from "./Settings.jsx";
import Citizens from "./Citizens.jsx";
import UserManagement from "./UserManagement.jsx";
import Messaging from "./Messaging.jsx";
import Conversations from "./Conversations.jsx";
import CitizenHome from "./CitizenHome.jsx";
import RepresentativeHome from "./RepresentativeHome.jsx";
import AdminHome from "./AdminHome.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import VerificationQueue from "./VerificationQueue.jsx";
import { getUser } from "../utils/auth.js";
import Policies from "./Policies.jsx";
import PolicyManagement from "./PolicyManagement.jsx";
import Analytics from "./Analytics.jsx";
import Issues from "./Issues.jsx";
import Polls from "./Polls.jsx";
import Forums from "./Forums.jsx";
import Resources from "./Resources.jsx";
import CitizenAnalytics from "./CitizenAnalytics.jsx";
import RepPerformance from "./RepPerformance.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import PolicyComments from "./PolicyComments.jsx";
import EventManagement from "./EventManagement.jsx";
import RepLeaderboard from "./RepLeaderboard.jsx";

const Overview = () => {
  const user = getUser();
  if (user?.role === "representative") {
    return <RepresentativeHome />;
  } else if (user?.role === "admin") {
    return <AdminHome />;
  }
  return <CitizenHome />;
};

const Dashboard = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="representatives" element={<Representatives />} />
        <Route path="policy-analysis" element={<PolicyAnalysis />} />
        <Route path="settings" element={<Settings />} />
        <Route path="citizens" element={<Citizens />} />
        <Route path="messages" element={<Conversations />} />
        <Route path="messages/:userId" element={<Messaging />} />
        <Route path="policies/*" element={<Policies />} />
        <Route path="policy-management/*" element={<PolicyManagement />} />
        <Route path="policy-management/:id" element={<PolicyComments />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="issues" element={<Issues />} />
        <Route path="polls" element={<Polls />} />
        <Route path="forums" element={<Forums />} />
        <Route path="resources" element={<Resources />} />
        <Route path="my-analytics" element={<CitizenAnalytics />} />
        <Route path="performance" element={<RepPerformance />} />
        <Route path="events" element={<EventManagement />} />
        <Route path="admin-leaderboard" element={<ProtectedRoute role="admin"><RepLeaderboard /></ProtectedRoute>} />
        
        {/* Admin routes */}
        <Route path="admin-dashboard" element={<AdminDashboard />} />
        <Route path="verification-queue" element={<VerificationQueue />} />
        <Route path="user-management" element={<ProtectedRoute role="admin"><UserManagement/></ProtectedRoute>} />
        
        {/* more nested routes */}
      </Route>
    </Routes>
  );
};

export default Dashboard; 