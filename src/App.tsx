import React, { CSSProperties, Suspense, useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import withAuth from "./main/com/RequiredAuth";

const HomeComponent = React.lazy(() => import("./main/Home/Home"));
// Admin
const AdminComponent = React.lazy(
  () => import("./main/Home/AdminComponent/AdminComponent")
);
const GroupPermission = React.lazy(
  () => import("./main/Home/AdminComponent/GroupPermission/GroupPermission")
);
const GetListPermissions = React.lazy(
  () =>
    import("./main/Home/AdminComponent/GetListPermissions/GetListPermissions")
);

// Login
const Login = React.lazy(() => import("./main/Login/Login"));
// Dashboard
const Dashboard = React.lazy(() => import("./main/Home/Dashboard/Dashboard"));
// Project Management
const ProjectManagement = React.lazy(
  () => import("./main/Home/ProjectManagement/ProjectManagement")
);
// Work Process Tracking
const WorkProcessTracking = React.lazy(
  () => import("./main/Home/WorkProcessTracking/WorkProcessTracking")
);
// Project Delivery Order
const ProjectDeliveryOrder = React.lazy(
  () => import("./main/Home/ProjectDeliveryOrder/ProjectDeliveryOrder")
);
// Files
const Files = React.lazy(() => import("./main/Home/Files/Files"));

const override: CSSProperties = {
  display: "flex",
  margin: "500px auto",
  borderColor: "red",
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token_installation");
    const expiration = localStorage.getItem("expiration_installation");

    if (
      token &&
      expiration &&
      new Date(expiration) > new Date() &&
      location.pathname === "/"
    ) {
      navigate("/Home");
    }
  }, [navigate, location.pathname]);

  // bọc với auth
  const ProtectedHome = withAuth(HomeComponent);
  const ProtectedAdmin = withAuth(AdminComponent);
  const ProtectedGroupPermission = withAuth(GroupPermission);
  const ProtectedGetListPermissions = withAuth(GetListPermissions);
  const ProtectedDashboard = withAuth(Dashboard);
  const ProtectedProjectManagement = withAuth(ProjectManagement);
  const ProtectedWorkProcessTracking = withAuth(WorkProcessTracking);
  const ProtectedProjectDeliveryOrder = withAuth(ProjectDeliveryOrder);
  const ProtectedFiles = withAuth(Files);

  return (
    <>
      <Suspense
        fallback={
          <div>
            <FadeLoader
              cssOverride={override}
              color="red"
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Home layout */}
          <Route path="/home" element={<ProtectedHome />}>
            {/* Các route con nằm trong <Outlet /> */}
            <Route path="main" element={<ProtectedDashboard />} />
            <Route
              path="projectmanagement"
              element={<ProtectedProjectManagement />}
            />
            <Route path="tracking" element={<ProtectedWorkProcessTracking />} />
            <Route
              path="deliveryorder"
              element={<ProtectedProjectDeliveryOrder />}
            />
            <Route path="files" element={<ProtectedFiles />} />

            {/* Admin và các route con */}
            <Route path="admin" element={<ProtectedAdmin />} />
            <Route
              path="admin/groupPermission"
              element={<ProtectedGroupPermission />}
            />
            <Route
              path="admin/getListPermissions"
              element={<ProtectedGetListPermissions />}
            />
          </Route>
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
