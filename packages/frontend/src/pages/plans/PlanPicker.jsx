import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import { getMyPlansApi, addExerciseToPlanApi } from "../../lib/api.js";

export default function PlanPicker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const exerciseId = useMemo(() => {
    const v = parseInt(searchParams.get("exerciseId"), 10);
    return Number.isFinite(v) && v > 0 ? v : null;
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Quick create form
  // Removed quick-create state per request

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyPlansApi({ limit: 100, offset: 0 });
      const list = res?.data?.items ?? res?.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      // Nếu BE chưa có endpoint list, im lặng và để người dùng tạo mới
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddToSelected = async () => {
    if (!exerciseId || !selectedPlanId) return;
    setSaving(true);
    setError(null);
    try {
      await addExerciseToPlanApi({
        planId: selectedPlanId,
        exercise_id: exerciseId,
        sets_recommended: 3,
        reps_recommended: "8-12",
        rest_period_seconds: 60,
      });
      navigate("/exercises", { replace: true });
    } catch (e) {
      setError({ message: e?.response?.data?.message || e?.message || "Không thể thêm vào plan" });
    } finally {
      setSaving(false);
    }
  };

  // Removed quick-create handler per request

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl px-4 py-10 mx-auto">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Chọn kế hoạch để thêm bài tập</h1>
        {exerciseId ? (
          <div className="mb-4 text-sm text-gray-600">Bài tập chọn: ID <b>{exerciseId}</b></div>
        ) : (
          <div className="mb-4 text-sm text-gray-600">Không có bài tập được chọn. Hãy quay lại Thư viện để chọn.</div>
        )}

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded bg-red-50">{error.message}</div>
        )}

        {/* My plans */}
        <div className="p-5 mb-6 bg-white border rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Kế hoạch của tôi</h2>
            <button
              type="button"
              onClick={load}
              className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Tải lại
            </button>
          </div>
          {loading ? (
            <div className="text-sm text-gray-600">Đang tải danh sách plan...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-500">Chưa có plan nào. Hãy tạo nhanh bên dưới.</div>
          ) : (
            <div className="space-y-2">
              {items.map((p) => (
                <label key={p.plan_id} className="flex items-center justify-between gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="picked_plan"
                    value={p.plan_id}
                    checked={selectedPlanId === p.plan_id}
                    onChange={() => setSelectedPlanId(p.plan_id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{p.name || '(Không có tên)'}</div>
                    {p.description && (
                      <div className="text-xs text-gray-600 truncate">{p.description}</div>
                    )}
                    {p.difficulty_level && (
                      <div className="text-xs text-gray-500">Độ khó: {p.difficulty_level}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 shrink-0"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/plans/${p.plan_id}`); }}
                  >
                    Xem kế hoạch
                  </button>
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              disabled={!selectedPlanId || !exerciseId || saving}
              onClick={handleAddToSelected}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              Thêm vào plan đã chọn
            </button>
            <button
              type="button"
              onClick={() => navigate('/exercises')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Trở lại Thư viện
            </button>
          </div>
        </div>

        {/* Quick create removed as requested */}
      </div>
    </div>
  );
}
