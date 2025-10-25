import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import logo from "../../assets/logo.png";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login", { replace: true });
    }
  };

  const displayName = (user?.username || "").replaceAll("_", " ");

  return (
    <div className="flex flex-col min-h-screen text-black bg-white">
      <HeaderLogin/>
    </div>
  );
}
