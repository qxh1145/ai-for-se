tính score :node scripts/compute_popularity_score.js

mã hoá dữ liệu thành file xwalk_exercise.normalized rồi đó, giờ có thêm dữ liệu thì thêm vào đây.
sau khi thêm dữ liệu xong thì chạy npm run xwalk:prepare
sau đó chạy npm run xwalk:import -> dữ liệu các bài tập 

cách bắn các instruction json ở xwalk_exercise_steps.import.json san g database

node scripts/import_exercise_steps_json.js

Lưu ý: importer exercises cũng đẩy ảnh cơ bản vào bảng image_exercise:
- thumbnail_url -> image_type = 'cover' (is_primary = true)
- gif_demo_url -> image_type = 'gif'
