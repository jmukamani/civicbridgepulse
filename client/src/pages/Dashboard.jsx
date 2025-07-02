import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import Representatives from "./Representatives.jsx";
import PolicyAnalysis from "./PolicyAnalysis.jsx";
import Settings from "./Settings.jsx";
import Citizens from "./Citizens.jsx";
import Messaging from "./Messaging.jsx";
import Conversations from "./Conversations.jsx";
import CitizenHome from "./CitizenHome.jsx";
import RepresentativeHome from "./RepresentativeHome.jsx";
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
import PolicyComments from "./PolicyComments.jsx";
import EventManagement from "./EventManagement.jsx";

const Overview = () => {
  const user = getUser();
  if (user?.role === "representative") {
    return <RepresentativeHome />;
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
        {/* more nested routes */}
      </Route>
    </Routes>
  );
};

export default Dashboard; 