// App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/auth.context.jsx";


import Register from "./pages/authentication/Register.jsx";
import Login from "./pages/authentication/Login.jsx";
import ForgotPassword from "./pages/authentication/ForgotPassword.jsx";
import VerifyCode from "./pages/authentication/VerifyCode.jsx";
import ResetPassword from "./pages/authentication/ResetPassword.jsx";
import Landing from "./pages/landing/Landing.jsx";
import NutritionAI from "./pages/nutrition/NutritionAI.jsx";
import NutritionPersonalize from "./pages/nutrition/NutritionPersonalize.jsx";
import Dashboard from "./pages/user/Dashboard.jsx";
import Modeling from "./pages/model3D/Modeling.jsx";
import ModelingDemo from "./pages/model3D/ModelingDemo.jsx";
import ExerciseDetail from "./pages/exercises/ExerciseDetail.jsx";
import ExercisesDemo from "./pages/exercises/ExercisesDemo.jsx";
import Exercise from "./pages/exercises/Exercise.jsx";
import PlanNew from "./pages/plans/PlanNew.jsx";
import PlanPicker from "./pages/plans/PlanPicker.jsx";
import PlanDetail from "./pages/plans/PlanDetail.jsx";
import Logout from "./pages/authentication/Logout.jsx";
import NotFoundRedirect from "./pages/system/NotFoundRedirect.jsx";

// Onboarding
import OnboardingAge from "./pages/boardings/OnboardingAge.jsx";
import OnboardingBody from "./pages/boardings/OnboardingBody.jsx";
import OnboardingGoal from "./pages/boardings/OnboardingGoal.jsx";
import OnboardingWeight from "./pages/boardings/OnboardingWeight.jsx";
import OnboardingHeight from "./pages/boardings/OnboardingHeight.jsx";
import OnboardingBodyFat from "./pages/boardings/OnboardingBodyFat.jsx";
import OnboardingExperience from "./pages/boardings/OnboardingExperience.jsx";
import OnboardingFrequency from "./pages/boardings/OnboardingFrequency.jsx";
import OnboardingEntry from "./pages/boardings/OnboardingEntry.jsx";


// Admin
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminOverview from "./pages/admin/Overview.jsx";
import AdminUserDetail from "./pages/admin/UserDetail.jsx";
import AdminContentManage from "./pages/admin/ContentManage.jsx";
import AdminFinancialManage from "./pages/admin/FinancialManage.jsx";
import Role from "./pages/admin/Role.jsx";
import Plan from "./pages/admin/Plan.jsx";
import AdminLockUnlock from "./pages/admin/LockUnlock.jsx";
import AdminResetPassword from "./pages/admin/ResetPassword.jsx";


import AdminUsers from "./pages/admin/AdminUsers.jsx";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();


  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return user.role === "ADMIN" ? children : <Navigate to="/" replace />;
}


function App() {
  useEffect(() => {

    const handler = (e) => {
      console.log("oauth msg:", e.origin, e.data);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);


  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<OnboardingEntry />} />
          <Route path="/onboarding" element={<Navigate to="/onboarding/age" replace />} />
          <Route path="/onboarding/age" element={<OnboardingAge />} />
          <Route path="/onboarding/body_type" element={<OnboardingBody />} />
          <Route path="/onboarding/goal" element={<OnboardingGoal />} />
          <Route path="/onboarding/weight" element={<OnboardingWeight />} />
          <Route path="/onboarding/height" element={<OnboardingHeight />} />
          <Route path="/onboarding/level_body_fat" element={<OnboardingBodyFat />} />
          <Route path="/onboarding/experience_level" element={<OnboardingExperience />} />
          <Route path="/onboarding/workout_frequency" element={<OnboardingFrequency />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />


          <Route path="/" element={<Landing />} />
          <Route path="/nutrition-ai" element={<NutritionAI />} />
          <Route path="/nutrition-ai/personalize" element={<NutritionPersonalize />} />

          <Route path="/modeling-demo" element={<ModelingDemo />} />
          {/* Backward compat: redirect old preview path to new demo path */}
          <Route path="/modeling-preview" element={<Navigate to="/modeling-demo" replace />} />
          <Route path="/exercises-demo" element={<ExercisesDemo/>}/>
          <Route
            path="/exercises"
            element={
              <PrivateRoute>
                <Exercise />
              </PrivateRoute>
            }
          />
          <Route path="/logout" element={<Logout />} />
          <Route
            path="/plans/select"
            element={
              <PrivateRoute>
                <PlanPicker />
              </PrivateRoute>
            }
          />
          <Route
            path="/plans/:planId"
            element={
              <PrivateRoute>
                <PlanDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/plans/select"
            element={
              <PrivateRoute>
                <PlanPicker />
              </PrivateRoute>
            }
          />
          <Route
            path="/plans/new"
            element={
              <PrivateRoute>
                <PlanNew />
              </PrivateRoute>
            }
          />

          <Route
            path="/exercises/:id"
            element={
                <ExerciseDetail />             
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Protected route without MainLayout (full control) */}
          <Route
            path="/modeling"
            element={
              <PrivateRoute>
                <Modeling />
              </PrivateRoute>
            }
          />



          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="user-detail" element={<AdminUserDetail />} />
            <Route path="role" element={<Role />} />
            <Route path="plan" element={<Plan />} />
            <Route path="lock-unlock" element={<AdminLockUnlock />} />
            <Route path="reset-password" element={<AdminResetPassword />} />
            <Route path="content" element={<AdminContentManage />} />
            <Route path="finance" element={<AdminFinancialManage />} />
            {/* Thêm route này nếu bạn dùng trang AdminUsers */}
            <Route path="users" element={<AdminUsers />} />
          </Route>


          {/* Catch all: redirect based on auth status */}
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


export default App;
