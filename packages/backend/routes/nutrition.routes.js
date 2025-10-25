import express from 'express';

const router = express.Router();

const GDEBUG = (process.env.GEMINI_DEBUG === '1') || (process.env.NODE_ENV !== 'production');
const dbg = (...args) => { if (GDEBUG) console.log('[GEMINI]', ...args); };

function isNutritionRelated(text = '') {
  const s = String(text || '').toLowerCase();
  if (!s.trim()) return true;
const allow = [
  // --- GỐC BẠN CÓ ---
  'ăn','dinh dưỡng','calo','kcal','protein','carb','fat','lipid','bữa','khẩu phần',
  'giảm cân','tăng cân','giữ cân','giảm mỡ','tăng cơ','macro','meal','diet','nutrition','plan',
  'thực đơn','ăn kiêng','keto','low carb','high protein','bữa sáng','bữa trưa','bữa tối','snack',
  'thức ăn','thực phẩm','healthy','eat clean','organic','vitamin','khoáng chất',
  'fitness','gym','body fat','bmi','bmr','tdee',
  'detox','plant-based','vegan','vegetarian','gluten-free','dairy-free',
  'dị ứng','di ung','intolerance','đường huyết','tiểu đường','tim mạch','cholesterol cao',
  'tính calo','phân tích dinh dưỡng','ai dinh dưỡng','tư vấn dinh dưỡng','meal recommendation',

  // --- MỞ RỘNG MACRO/MICRO/CHỈ SỐ ---
  'đạm','tinh bột','chất béo','chất xơ','đường','đường added','đường tự nhiên',
  'omega-3','omega 3','omega-6','omega 6','cholesterol','hdl','ldl','triglyceride',
  'glycemic index','gi','glycemic load','gl','satiety index','mật độ năng lượng','caloric density',
  'micronutrient','micros','macros','macro split','p:c:f','tỉ lệ p c f','tỷ lệ p c f',

  // --- VITAMIN/KHOÁNG ---
  'vitamin a','vitamin b','vitamin c','vitamin d','vitamin e','vitamin k',
  'canxi','calcium','sắt','iron','kẽm','zinc','magie','magnesium','iod','iodine','folate','axit folic',

  // --- ĐO LƯỜNG/ĐƠN VỊ ---
  'calories','calorie','maintenance calories','calorie deficit','calorie surplus',
  'ước tính calo','đếm calo','tính macro','macro calculator','calorie calculator',
  'serving','servings','serving size','portion','portion size','khẩu phần ăn','suất',
  'per 100g','trên 100g','100g',
  'g/kg','gram per kg','grams per kg','protein per kg',

  // --- CHẾ ĐỘ ĂN/Diets ---
  'low fat','ít béo','low sugar','ít đường','ít muối','không đường',
  'paleo','mediterranean','địa trung hải','dash','whole30','carnivore',
  'lactose-free','không lactose','casein-free','soy-free','không đậu nành',
  'intermittent fasting','if','nhịn ăn gián đoạn','omad','5:2','16:8','18:6','20:4','eat stop eat','alternate day fasting',
  'clean eating','meal plan','meal planner','mealplan','meal-prep','meal prep','meal prepping',

  // --- BỐI CẢNH BỮA ĂN/TẬP LUYỆN ---
  'ăn nhẹ','ăn vặt','pre-workout','post-workout','trước khi tập','sau khi tập',
  'nạp carb','carb cycling','chu kỳ carb','refeed','cheat day','cheat meal',
  'bulk','bulking','cut','cutting','recomp','lean bulk','dirty bulk','reverse diet',

  // --- THỨC UỐNG/HYDRATION ---
  'hydration','uống nước','nước lọc','nước tăng lực','energy drink','isotonic','electrolyte','bù điện giải',
  'nước ngọt','đồ uống có đường','soda',

  // --- TÌNH TRẠNG SỨC KHỎE ---
  'tiểu đường tuýp 2','tiểu đường tuýp 1','hạ đường huyết','mỡ máu','gan nhiễm mỡ',
  'gout','dạ dày','viêm dạ dày','trào ngược','pcos','hội chứng buồng trứng đa nang',
  'cường giáp','suy giáp','tuyến giáp','huyết áp cao','béo phì',

  // --- DỊ ỨNG/LOẠI TRỪ ---
  'dị ứng sữa','dị ứng đậu phộng','dị ứng lạc','peanut allergy','tree nut','hạt cây',
  'hải sản','shellfish','tôm','cua','nhuyễn thể','gluten','lactose','casein','đậu nành','trứng','wheat','mè','sesame',

  // --- NHÃN DINH DƯỠNG/FACTS ---
  'nutrition facts','nhãn dinh dưỡng','bảng dinh dưỡng','thành phần dinh dưỡng','nutrition label',

  // --- THỰC PHẨM “CƠ BẢN” HAY HỎI CALO ---
  'trứng','lòng trắng trứng','yogurt','sữa chua','sữa tách béo','sữa ít béo',
  'ức gà','chicken breast','thịt bò nạc','lean beef','cá hồi','salmon','cá ngừ','tuna','tôm','shrimp',
  'yến mạch','oat','oats','oatmeal','gạo lứt','brown rice','khoai lang','sweet potato','bánh mì','bread',
  'đậu hũ','tofu','tempeh','đậu xanh','đậu đỏ','đậu đen','hạt chia','chia seed','yến mạch qua đêm','overnight oats',

  // --- CÁCH CHẾ BIẾN (ảnh hưởng chỉ số) ---
  'hấp','luộc','nướng','chiên','rán','áp chảo','airfryer','nồi chiên không dầu','xào',

  // --- THỰC PHẨM BỔ SUNG/SUPPS ---
  'whey','casein','protein powder','mass gainer','bcaa','eaa','creatine','fish oil','omega 3','multivitamin','collagen',
  'preworkout','caffeine','beta alanine','l-carnitine','green tea extract','electrolyte powder',

  // --- PHƯƠNG PHÁP TÍNH/CT ---
  'harris-benedict','mifflin st jeor','mifflin-st jeor','mifflin-st-jeor','lean body mass','lbm',

  // --- CÂU HỎI MẪU HAY GÕ ---
  'bao nhiêu calo','bao nhieu calo','calo của','calo cua','nhiệt lượng','nang luong',
  'ăn bao nhiêu','an bao nhieu','ăn mấy bữa','an may bua','gợi ý khẩu phần','goi y khau phan',
  'thực đơn 7 ngày','thực đơn 1 tuần','thuc don 7 ngay','thuc don 1 tuan'
];
  return allow.some(k => s.includes(k));
}

async function callGemini(prompt, apiKey) {
  if (!apiKey) {
    dbg('missing apiKey → demo response');
    return 'Bản nháp kế hoạch (demo, thiếu GEMINI_API_KEY)\n\n- Mục tiêu: theo yêu cầu\n- Bữa sáng/trưa/tối + snack: gợi ý mẫu\n- Macro ước tính theo mục tiêu\n\nHãy cấu hình GEMINI_API_KEY ở backend để nhận đề xuất chi tiết từ AI.';
  }

  const model = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
  dbg('model in use', model);
  const versions = ['v1', 'v1beta'];
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    safetySettings: [],
  };

  const postJson = async (fullUrl, payloadObj) => {
    const payload = JSON.stringify(payloadObj);
    if (typeof fetch === 'function') {
      const r = await fetch(fullUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
      const txt = await r.text();
      let json = {};
      try { json = JSON.parse(txt); } catch {}
      if (!r.ok) {
        const msg = json?.error?.message || `Gemini API error ${r.status}`;
        const err = new Error(msg);
        err.status = r.status; err.body = json; err.url = fullUrl;
        throw err;
      }
      return json;
    }
    // Node < 18 fallback
    const https = await import('https');
    const { URL } = await import('url');
    const u = new URL(fullUrl);
    const options = { method: 'POST', hostname: u.hostname, path: u.pathname + u.search, headers: { 'Content-Type': 'application/json' } };
    const data = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let chunks = '';
        res.on('data', (d) => (chunks += d));
        res.on('end', () => { try { resolve(JSON.parse(chunks)); } catch (e) { reject(e); } });
      });
      req.on('error', reject); req.write(JSON.stringify(payloadObj)); req.end();
    });
    if (data?.error) { const err = new Error(data.error.message || 'Gemini API error'); err.status = data.error.code; err.body = data; throw err; }
    return data;
  };

  let lastErr = null;
  for (const v of versions) {
    const url = `https://generativelanguage.googleapis.com/${v}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      dbg('request', { version: v, model, promptLen: String(prompt).length });
      const data = await postJson(url, body);
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
      dbg('success', { version: v, model, textLen: text.length });
      return text;
    } catch (e) {
      dbg('error', { version: v, model, status: e?.status, message: e?.message });
      lastErr = e;
      if (e?.status !== 404) break; // only fallback to next version on 404
    }
  }
  throw lastErr || new Error('Gemini API call failed');
}

router.post('/plan', async (req, res) => {
  try {
    const goalRaw = String(req.body?.goal || '').toUpperCase();
    const extra = String(req.body?.extra || '').trim();
    const allowed = ['LOSE_WEIGHT','GAIN_WEIGHT','MAINTAIN'];
    const goal = allowed.includes(goalRaw) ? goalRaw : 'MAINTAIN';
    if (!isNutritionRelated(extra)) {
      dbg('off-topic blocked', { goal: goalRaw, extraLen: extra.length });
      return res.status(400).json({ success: false, offTopic: true, message: 'Tôi chỉ được thiết kế để lên kế hoạch dinh dưỡng' });
    }
    // Prompt theo format yêu cầu: "Mục tiêu: <tăng cân|giảm cân|giữ cân đối> + thông tin bổ sung (nếu có)"
    const goalText = goal === 'LOSE_WEIGHT' ? 'giảm cân' : goal === 'GAIN_WEIGHT' ? 'tăng cân' : 'giữ cân đối';
    const prompt = `Mục tiêu: ${goalText}${extra ? ` + ${extra}` : ''}`;
    dbg('prompt', { text: prompt });
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    dbg('incoming', { goal: goalRaw, extraLen: extra.length, model: process.env.GEMINI_MODEL || 'gemini-2.0-flash', apiKeySet: !!apiKey });
    const resp = await callGemini(prompt, apiKey);
    return res.json({ success: true, data: { text: resp } });
  } catch (err) {
    console.error('nutrition plan error:', err);
    // Graceful fallback so FE still gets a plan
    const fallback = `Kế hoạch (fallback do lỗi gọi AI)\n\n- Mục tiêu: ${String(req.body?.goal || '')}\n- Gợi ý: ăn cân bằng, ưu tiên thực phẩm tươi, tránh đồ siêu chế biến.\n- Bữa sáng/trưa/tối kèm snack tuỳ ngân sách.\n\n(Thiết lập GEMINI_API_KEY và đảm bảo model hợp lệ để nhận gợi ý chi tiết từ AI.)`;
    dbg('fallback-used', { message: err?.message });
    return res.json({ success: true, data: { text: fallback }, meta: { fallback: true, error: err?.message || 'unknown' } });
  }
});

export default router;
