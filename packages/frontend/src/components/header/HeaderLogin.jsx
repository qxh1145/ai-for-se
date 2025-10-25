// src/components/layout/HeaderApp.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import logo from "../../assets/logo.png";

export default function HeaderLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  const [openMobile, setOpenMobile] = useState(false);
  const [openWorkout, setOpenWorkout] = useState(false);
  const workoutRef = useRef(null);

  const [openCommunity, setOpenCommunity] = useState(false);
  const communityRef = useRef(null);

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/", { replace: true });
    }
  };
  const displayName = (user?.username || "").replaceAll("_", " ");


  useEffect(() => {
    setOpenMobile(false);
    setOpenWorkout(false);
    setOpenCommunity(false);
  }, [location.pathname]);

  useEffect(() => {
    const onDown = (e) => {
      if(communityRef.current && !communityRef.current.contains(e.target)) {
        setOpenCommunity(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenMobile(false);
        setOpenWorkout(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (workoutRef.current && !workoutRef.current.contains(e.target)) {
        setOpenWorkout(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenMobile(false);
        setOpenWorkout(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-2 mx-auto max-w-7xl">
       
        <button
          onClick={() => navigate("/dashboard")}
          className="-m-2.5 p-2.5 shrink-0"
          aria-label="Trang chủ"
        >
          <img src={logo} alt="Fitnexus" className="w-auto h-16 " />
        </button>

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center justify-center p-2 rounded-lg md:hidden hover:bg-gray-100"
          aria-label="Mở menu"
          aria-expanded={openMobile}
          onClick={() => setOpenMobile((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>

        <nav className="items-center hidden gap-5 md:flex">
          

          <div className="relative" ref={workoutRef}>
            <button
              onClick={() => setOpenWorkout((v) => !v)}
              aria-haspopup="true"
              aria-expanded={openWorkout}
              className="inline-flex items-center text-sm text-gray-800 hover:text-blue-600"
            >
              Luyện tập
              <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/>
              </svg>
            </button>

            {openWorkout && (
              <div
                role="menu"
                aria-label="Menu luyện tập"
                className="absolute left-0 p-2 mt-2 bg-white border border-gray-200 shadow-xl top-full w-72 rounded-xl"
              >
                <button
                  role="menuitem"
                  onClick={() => navigate("/exercises")}
                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-gray-50"
                >
                  <div className="text-sm font-semibold text-gray-900">Xem tất cả bài tập</div>
                  <div className="text-xs text-gray-500">1000+ bài tập theo nhóm cơ</div>
                </button>

                <div className="h-px my-2 bg-gray-200" />

                <button
                  role="menuitem"
                  onClick={() =>
                    !isAuthenticated
                      ? navigate("/login", { state: { from: "/plans/select" } })
                      : navigate("/plans/select")
                  }
                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-gray-50"
                >
                  Kế hoạch của tôi
                </button>
                <button
                  role="menuitem"
                  onClick={() =>
                    !isAuthenticated
                      ? navigate("/login", { state: { from: "/plans/new" } })
                      : navigate("/plans/new")
                  }
                  className="w-full px-3 py-2 mt-1 text-left rounded-lg hover:bg-gray-50"
                >
                  Tạo plan mới
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/modeling")}
            className="text-sm text-gray-800 hover:text-blue-600"
          >
            Mô hình hoá
          </button>
          <button
            onClick={() => navigate("/nutrition-ai")}
            className="text-sm text-gray-800 hover:text-blue-600"
          >
            Dinh dưỡng
          </button>
          


          <div className="relative" ref={communityRef}>
            <button
              onClick={() => setOpenCommunity((v) => !v)}
              aria-haspopup="true"
              aria-expanded={openCommunity}
              className="inline-flex items-center text-sm text-gray-800 hover:text-blue-600"
            >
              Cộng đồng
              <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/>
              </svg>
            </button>

            {openCommunity && (
              <div
                role="menu"
                aria-label="Menu luyện tập"
                className="absolute left-0 p-2 mt-2 bg-white border border-gray-200 shadow-xl top-full w-72 rounded-xl"
              >
                <button
                  role="menuitem"
                  onClick={() => navigate("/community-demo")}
                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-gray-50"
                >
                  <div className="text-sm font-semibold text-gray-900">Gym Group</div>
                  <div className="text-xs text-gray-500">Cộng đồng GYM với hàng nghìn thành viên tay to</div>
                </button>

                <div className="h-px my-2 bg-gray-200" />

                <button
                  role="menuitem"
                  onClick={() =>
                    !isAuthenticated
                      ? navigate("/login", { state: { from: "/trainer-demo" } })
                      : navigate("/trainer-demo")
                  }
                  className="inline-flex items-center text-sm text-gray-800 hover:text-blue-600"
                  >
                  Fitness Trainer
                </button>
              </div>
            )}
          </div>

        </nav>

        {/* CTA phải: “Tải ứng dụng” + Đăng nhập (theo form eDoctor) */}
        <div className="items-center hidden gap-3 md:flex">

        <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <div className="flex items-center justify-center w-10 h-10 font-medium text-white rounded-full bg-gradient-to-r from-blue-400 to-blue-600">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                </button>
                {showAvatarMenu && (
                  <div className="absolute right-0 z-50 w-48 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    <button
                      onClick={() => {
                        setShowAvatarMenu(false);
                        navigate("/profile");
                      }}
                      className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    >
                      Hồ sơ
                    </button>
                    <button
                      onClick={() => {
                        setShowAvatarMenu(false);
                        navigate("/settings");
                      }}
                      className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    >
                      Cài đặt
                    </button>
                    <button
                      onClick={() => {
                        setShowAvatarMenu(false);
                        handleLogout();
                      }}
                      className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  className="transition hover:text-blue-400"
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </button>
                <button
                  className="px-6 py-3 font-semibold text-black transition bg-white rounded-full hover:bg-gray-200"
                  onClick={() => navigate("/register")}
                >
                  Bắt đầu ngay
                </button>
              </>
            )}
          </div>
          <a
            href="https://example.com/download-app" // TODO: thay link store/app thực tế
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full hover:shadow-lg"
          >
            Tải ứng dụng
          </a>

          
        </div>
      </div>

      {/* Mobile sheet theo form eDoctor (danh mục phẳng + nhóm Luyện tập) */}
      {openMobile && (
        <div className="bg-white border-t border-gray-200 md:hidden">
          <div className="px-4 py-3 space-y-2">
            <button className="block w-full py-2 text-left" onClick={() => navigate("/")}>
              Trang chủ
            </button>

            <details className="border rounded-lg">
              <summary className="flex items-center justify-between w-full px-3 py-2 list-none cursor-pointer">
                <span>Luyện tập</span>
                <span className="select-none">▼</span>
              </summary>
              <div className="px-2 pb-2">
                <button
                  className="block w-full px-3 py-2 text-left rounded-md hover:bg-gray-50"
                  onClick={() => navigate(isAuthenticated ? "/exercises" : "/exercises-demo")}
                >
                  Xem tất cả bài tập
                </button>
                <button
                  className="block w-full px-3 py-2 text-left rounded-md hover:bg-gray-50"
                  onClick={() =>
                    !isAuthenticated ? navigate("/login", { state: { from: "/plans/select" } }) : navigate("/plans/select")
                  }
                >
                  Kế hoạch của tôi
                </button>
                <button
                  className="block w-full px-3 py-2 text-left rounded-md hover:bg-gray-50"
                  onClick={() =>
                    !isAuthenticated ? navigate("/login", { state: { from: "/plans/new" } }) : navigate("/plans/new")
                  }
                >
                  Tạo plan mới
                </button>
              </div>
            </details>

            <button className="block w-full py-2 text-left" onClick={() => navigate("/modeling-demo")}>
              Mô hình hoá
            </button>
            <button className="block w-full py-2 text-left" onClick={() => navigate("/nutrition-ai")}>
              Dinh dưỡng
            </button>
            <button className="block w-full py-2 text-left" onClick={() => navigate("/community")}>
              Cộng đồng
            </button>

            <a
              href="https://example.com/download-app" // TODO: thay link store/app thực tế
              target="_blank"
              rel="noreferrer"
              className="block w-full py-2 font-semibold text-left text-blue-600"
            >
              Tải ứng dụng
            </a>

            <div className="pt-2 border-t">
              <button className="w-full px-4 py-2 border rounded-full" onClick={() => navigate("/login")}>
                {isAuthenticated ? (user?.name ?? "Tài khoản") : "Đăng nhập"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
