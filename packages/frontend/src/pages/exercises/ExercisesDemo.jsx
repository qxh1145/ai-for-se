import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import logo from "../../assets/logo.png";
import absIcon from "../../assets/body/coreIcon.svg";
import backIcon from "../../assets/body/backIcon.svg";
import bicepsIcon from "../../assets/body/bicepsIcon.svg";
import cardioIcon from "../../assets/body/cardioIcon.svg";
import chestIcon from "../../assets/body/chestIcon.svg";
import forearmsIcon from "../../assets/body/forearmsIcon.svg";
import glutesIcon from "../../assets/body/glutesIcon.svg";
import shouldersIcon from "../../assets/body/shouldersIcon.svg";
import tricepsIcon from "../../assets/body/tricepsIcon.svg";
import upperLegsIcon from "../../assets/body/upperLegsIcon.svg";
import lowerLegsIcon from "../../assets/body/lowerLegsIcon.svg";

import ExerciseList from "../../components/exercise/ExerciseList.jsx";
import { useAuth } from "../../context/auth.context.jsx";
import HeaderDemo from "../../components/header/HeaderDemo.jsx";

export default function ExercisesDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [showWorkoutDropdown, setShowWorkoutDropdown] = useState(false);
  const dropdownRef = useRef(null);


  const muscleGroups = [
    { id: "abs", label: "Abs", icon: absIcon },
    { id: "back", label: "Back", icon: backIcon },
    { id: "biceps", label: "Biceps", icon: bicepsIcon },
    { id: "cardio", label: "Cardio", icon: cardioIcon },
    { id: "chest", label: "Chest", icon: chestIcon },
    { id: "forearms", label: "Forearms", icon: forearmsIcon },
    { id: "glutes", label: "Glutes", icon: glutesIcon },
    { id: "shoulders", label: "Shoulders", icon: shouldersIcon },
    { id: "triceps", label: "Triceps", icon: tricepsIcon },
    { id: "upper-legs", label: "Upper Legs", icon: upperLegsIcon },
    { id: "lower-legs", label: "Lower Legs", icon: lowerLegsIcon },
  ];

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [level, setLevel] = useState("");
  const [impact, setImpact] = useState("");
  const [population, setPopulation] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [total, setTotal] = useState(0);
  
  const [rawExercises, setRawExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if(dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowWorkoutDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchExercises = async () => {
      setLoading(true);
      setError(null);
      try {
        let res;
        if (!selectedGroup) {

          res = await axios.get('/api/exercises', { params: { page, pageSize } });
        } else if (selectedGroup === 'cardio') {

          res = await axios.get('/api/exercises/type/cardio', { params: { page, pageSize } });
        } else {

          res = await axios.get(`/api/exercises/muscle/${selectedGroup}`, { params: { page, pageSize } });
        }
        if (isMounted) {
          if (res.data?.success) {
            const list = res.data.data || [];
            setRawExercises(list);
            setTotal(res.data.total ?? list.length ?? 0);
          } else {
            setError('Không thể tải danh sách bài tập');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Lỗi kết nối đến server');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchExercises();
    return () => { isMounted = false; };
  }, [selectedGroup, page]);

  const groupSynonyms = {
    "abs": ["abs", "abdominals", "core", "stomach", "rectus-abdominis", "obliques"],
    "back": ["back", "lats", "latissimus", "lower back", "upper back", "trapezius", "rhomboids"],
    "biceps": ["biceps", "biceps-brachii", "brachialis"],
    "cardio": ["cardio", "aerobic"],
    "chest": ["chest", "pectorals", "pecs", "upper-chest", "mid-chest", "lower-chest"],
    "forearms": ["forearms", "forearm", "wrist-flexors", "wrist-extensors"],
    "glutes": ["glutes", "glute", "butt", "gluteus", "gluteus-maximus", "gluteus-medius"],
    "shoulders": ["shoulders", "delts", "deltoids", "anterior-deltoid", "lateral-deltoid", "posterior-deltoid"],
    "triceps": ["triceps", "triceps-brachii"],
    "upper-legs": [
      "upper legs",
      "quadriceps",
      "quads",
      "hamstrings",
      "thighs",
      "adductors",
      "abductors",
      "hip-flexors",
    ],
    "lower-legs": ["lower legs", "calves", "calf", "gastrocnemius", "soleus"],
  };

  const normalizeStr = (v) =>
    String(v || "")
      .toLowerCase()
      .trim();

  const toArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return [v];
  };

  // Normalize exercises từ backend format
  const normalized = useMemo(() => {
    return rawExercises.map((ex) => {
      // Backend trả về: id, name, description, difficulty, equipment, imageUrl, impact_level
      return {
        id: ex.id,
        name: ex.name || "",
        imageUrl: ex.imageUrl || "",
        description: ex.description || "",
        difficulty: ex.difficulty || "",
        impact: ex.impact_level || "",
        population: ex.population || "",
        equipment: ex.equipment || "",
        // Lấy muscle groups từ target/secondary nếu có
        parts: [], // Backend chưa trả về parts detail, sẽ cần expand sau
        __raw: ex,
      };
    });
  }, [rawExercises]);

  const optionSets = useMemo(() => {
    const levels = new Set();
    const impacts = new Set();
    const populations = new Set();
    for (const ex of normalized) {
      if (ex.difficulty) levels.add(String(ex.difficulty));
      if (ex.impact) impacts.add(String(ex.impact));
      if (ex.population) populations.add(String(ex.population));
    }
    return {
      levels: Array.from(levels),
      impacts: Array.from(impacts),
      populations: Array.from(populations),
    };
  }, [normalized]);

  const matchesGroup = (ex, groupId) => {
    if (!groupId) return true;
    
    // Tạm thời dùng logic cơ bản, sau này có thể fetch theo /api/exercises/muscle/:muscleGroup
    const synonyms = groupSynonyms[groupId] || [groupId];
    const tokens = ex.parts || [];
    
    const nameNorm = normalizeStr(ex.name);
    for (const s of synonyms) {
      const ss = normalizeStr(s).replace(/-/g, " ");
      if (nameNorm.includes(ss)) return true;
      for (const t of tokens) {
        if (t.includes(ss)) return true;
      }
    }
    return false;
  };

  const filtered = useMemo(() => {
    const q = normalizeStr(search);
    return normalized.filter((ex) => {
      if (level && normalizeStr(ex.difficulty) !== normalizeStr(level)) return false;
      if (impact && normalizeStr(ex.impact) !== normalizeStr(impact)) return false;
      if (population && normalizeStr(ex.population) !== normalizeStr(population)) return false;
      if (q && !normalizeStr(ex.name).includes(q)) return false;
      return true;
    });
  }, [normalized, selectedGroup, level, impact, population, search]);

  const clearFilters = () => {
    setSelectedGroup(null);
    setLevel("");
    setImpact("");
    setPopulation("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="min-h-screen text-black bg-white">
      <HeaderDemo/>
      <main className="px-4 py-6 mx-auto max-w-7xl">
        <h1 className="mb-4 text-2xl font-semibold">Thư viện bài tập</h1>

        <section aria-label="Chọn nhóm cơ">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {muscleGroups.map((g) => {
              const active = selectedGroup === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => { setSelectedGroup(active ? null : g.id); setPage(1); }}
                  className={[
                    "flex flex-col items-center justify-center gap-2 border rounded-lg p-3",
                    active ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300",
                  ].join(" ")}
                >
                  <img src={g.icon} alt={g.label} className="w-8 h-8" />
                  <span className="text-sm">{g.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6" aria-label="Bộ lọc">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex gap-3">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="">Level: Tất cả</option>
                {optionSets.levels.map((lv) => (
                  <option key={lv} value={lv}>{lv}</option>
                ))}
              </select>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="">Impact: Tất cả</option>
                {optionSets.impacts.map((im) => (
                  <option key={im} value={im}>{im}</option>
                ))}
              </select>
              <select
                value={population}
                onChange={(e) => setPopulation(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="">Population: Tất cả</option>
                {optionSets.populations.map((po) => (
                  <option key={po} value={po}>{po}</option>
                ))}
              </select>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm bài tập"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg md:w-64"
              />
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Xoá lọc
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6" aria-label="Kết quả">
          {selectedGroup ? (
            <div className="mb-2 text-sm text-gray-600">
              Nhóm cơ đã chọn: <span className="font-medium">{muscleGroups.find((m) => m.id === selectedGroup)?.label}</span>
            </div>
          ) : null}

          <ExerciseList exercises={filtered} loading={loading} error={error} total={total} />

          {/* Pagination controls: apply for all modes (default or group/type) */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Trang {page} / {Math.max(1, Math.ceil((total || 0) / pageSize))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={[
                  "px-3 py-2 text-sm border rounded-lg",
                  page <= 1 || loading ? "text-gray-400 border-gray-200" : "border-gray-300 hover:bg-gray-50"
                ].join(" ")}
              >
                Trang trước
              </button>
              <button
                type="button"
                disabled={loading || page >= Math.max(1, Math.ceil((total || 0) / pageSize))}
                onClick={() => setPage((p) => p + 1)}
                className={[
                  "px-3 py-2 text-sm border rounded-lg",
                  loading || page >= Math.max(1, Math.ceil((total || 0) / pageSize)) ? "text-gray-400 border-gray-200" : "border-gray-300 hover:bg-gray-50"
                ].join(" ")}
              >
                Trang sau
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
