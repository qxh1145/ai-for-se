import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import { getPlanByIdApi } from "../../lib/api.js";

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

export default function PlanDetail() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getPlanByIdApi(planId);
        if (!alive) return;
        if (res?.success) {
          setPlan(res.data?.plan || null);
          setItems(res.data?.items || []);
        } else {
          setError({ message: res?.message || "Không thể tải kế hoạch" });
        }
      } catch (e) {
        if (alive) setError({ message: e?.message || "Lỗi kết nối" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [planId]);

  const startWorkout = () => {
    alert("Bắt đầu buổi theo kế hoạch (sẽ kết nối BE ở bước tiếp theo)");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <HeaderLogin />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Quay lại
        </button>

        {loading && <div className="p-4 text-sm text-gray-600">Đang tải kế hoạch...</div>}
        {error && !loading && <div className="p-4 text-sm text-red-600">{error.message}</div>}

        {plan && !loading && !error && (
          <div className="space-y-6">
            <div className="p-5 bg-white border rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{plan.name || "(Không có tên)"}</h1>
                  {plan.description && (
                    <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
                  )}
                  <div className="mt-2">
                    {plan.difficulty_level && (
                      <Badge tone="amber">Độ khó: {plan.difficulty_level}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    onClick={() => navigate('/exercises')}
                  >
                    Thêm bài tập từ Thư viện
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    onClick={startWorkout}
                  >
                    Bắt đầu buổi
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border rounded-xl">
              <h2 className="mb-3 text-lg font-semibold">Bài tập trong kế hoạch</h2>
              {!items.length ? (
                <div className="text-sm text-gray-600">Chưa có bài tập nào. Hãy thêm từ Thư viện.</div>
              ) : (
                <div className="space-y-3">
                  {items.map((it) => (
                    <div key={it.plan_exercise_id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {it.exercise?.name || `#${it.exercise_id}`}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {it.exercise?.difficulty && (
                            <Badge tone="amber">{it.exercise.difficulty}</Badge>
                          )}
                          {it.exercise?.equipment && (
                            <Badge tone="blue">{it.exercise.equipment}</Badge>
                          )}
                          {it.sets_recommended && (
                            <Badge tone="green">{it.sets_recommended} sets</Badge>
                          )}
                          {it.reps_recommended && (
                            <Badge tone="purple">{it.reps_recommended} reps</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                          onClick={() => navigate(`/exercises/${it.exercise?.id || it.exercise_id}`)}
                        >
                          Xem chi tiết
                        </button>
                        {/* Future: Xoá/Sắp xếp */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

