# Fitness App - Chức năng & Nghiệp vụ theo Role

## 1. Giới thiệu

Ứng dụng Fitness App nhằm cung cấp trải nghiệm tập luyện hiện đại, kết
hợp mô hình 3D trực quan, thư viện bài tập phong phú, theo dõi tiến độ
và huấn luyện viên AI cho phiên bản cao cấp (Premium).

Người dùng được phân chia thành các role: - **User Free**: Người dùng cơ
bản, tập trung vào khám phá và tự xây dựng buổi tập. - **User Premium**:
Người dùng nâng cấp, được AI dẫn dắt với lộ trình tập luyện cá nhân hóa
và phân tích chuyên sâu. - **Trainer**: Người dùng có huy hiệu huấn
luyện viên, có thể chat và hỗ trợ online. - **Admin**: Quản trị viên,
quản lý toàn bộ dữ liệu và người dùng.

------------------------------------------------------------------------

## 2. Chức năng theo Role

### 2.1 User Free

-   **Quản lý tài khoản & hồ sơ cá nhân**: Đăng ký, đăng nhập (truyền
    thống/mạng xã hội), cập nhật avatar, ngày sinh, chiều cao, cân nặng.
-   **Onboarding (bắt buộc lần đầu)**: Nhập thông tin cơ bản (chiều cao,
    cân nặng, ngày sinh, giới tính). Hệ thống tạo mốc tiến độ đầu tiên
    (UserProgress).
-   **Mô hình Giải phẫu 3D Tương tác**: Xoay, phóng to/thu nhỏ cơ thể
    3D. Chọn nhóm cơ → hệ thống highlight và hiển thị tên.
-   **Tìm bài tập qua nhóm cơ**: Chọn 1 hoặc nhiều nhóm cơ → hiển thị
    danh sách bài tập liên quan. Ưu tiên bài tập primary cho nhóm chính,
    secondary cho nhóm phụ.
-   **Xem chi tiết bài tập**: Video, mô tả, hướng dẫn từng bước, dụng
    cụ, độ khó, nhóm cơ tác động.
-   **Xây dựng buổi tập tạm thời**: Thêm bài tập vào "Buổi tập hôm nay"
    → ghi log số hiệp, reps, mức tạ.
-   **Theo dõi tiến độ**: Cập nhật cân nặng, số đo các vòng, tải ảnh
    tiến độ. Xem biểu đồ cơ bản.

### 2.2 User Premium

-   **Huấn luyện viên AI & Lộ trình Cá nhân hóa**: Ngay sau Onboarding,
    hệ thống tạo kế hoạch tập luyện dài hạn (4--8 tuần) dựa trên mục
    tiêu, trình độ, số buổi/tuần.
    -   Trang chủ hiển thị "Buổi tập hôm nay" với các bài tập gợi ý.\
    -   Lịch tập tuần được lên sẵn.\
-   **Tự động điều chỉnh lộ trình (Dynamic Plan Adjustment)**: Phân tích
    dữ liệu từ UserWorkoutLogs & UserProgress → điều chỉnh số hiệp,
    reps, độ khó sau mỗi 2--4 tuần.\
-   **Phân tích chuyên sâu**:
    -   Biểu đồ tổng khối lượng tập luyện (Total Volume).\
    -   Ước tính One-Rep Max (1RM).\
    -   So sánh tương quan (ví dụ: tập chân nhiều → vòng đùi tăng).\
-   **Dinh dưỡng (tính năng tương lai)**: AI đề xuất lượng calo, macro
    (protein/carb/fat) và gợi ý bữa ăn.

### 2.3 Trainer (HLV Online)

-   Có tất cả quyền của User (Free/Premium tùy loại tài khoản).\
-   Gắn huy hiệu Trainer.\
-   Chức năng mở rộng:
    -   Chat trực tuyến với học viên.\
    -   Quản lý nhóm học viên riêng.\
    -   Có thể tạo/suggest kế hoạch tập luyện hoặc bài tập.

### 2.4 Admin

-   **Quản lý người dùng**: Duyệt, khóa, phân quyền
    (User/Admin/Trainer).\
-   **Quản lý bài tập**: CRUD ExercisesDemo, MuscleGroups, liên kết
    impact_level.\
-   **Quản lý nội dung**: Thư viện bài tập, media (video, ảnh minh
    họa).\
-   **Moderation**: Kiểm duyệt ảnh tiến độ, báo cáo từ cộng đồng.\
-   **Theo dõi thống kê hệ thống**: Người dùng hoạt động, số lượng bài
    tập phổ biến, log sử dụng.

------------------------------------------------------------------------

## 3. Workflow Người dùng

### 3.1 Free User -- Khám phá

1.  Đăng ký / Đăng nhập.\
2.  Onboarding: nhập thông tin cơ bản → tạo UserProgress mốc 0.\
3.  Trang chủ: mô hình giải phẫu 3D.\
4.  Chọn nhóm cơ → tìm bài tập → xem chi tiết → thêm vào "Buổi tập hôm
    nay".\
5.  Bắt đầu tập → ghi log số hiệp/reps/mức tạ.\
6.  Cập nhật tiến độ và ảnh theo thời gian.

### 3.2 Premium User -- Được dẫn dắt

1.  Đăng ký / Đăng nhập.\
2.  Onboarding nâng cao: thêm mục tiêu, trình độ, số buổi/tuần.\
3.  Trang chủ: Dashboard hiển thị kế hoạch tập luyện (AI tạo).\
4.  Vào "Buổi tập hôm nay" → theo lộ trình.\
5.  Hệ thống điều chỉnh lộ trình sau mỗi 2--4 tuần.\
6.  Tab Phân tích: xem biểu đồ chuyên sâu, ước tính 1RM, tương quan.\
7.  (Tương lai) Tab Dinh dưỡng: gợi ý macro & thực phẩm.

------------------------------------------------------------------------

## 4. So sánh Free vs Premium

  -----------------------------------------------------------------------
  Tính năng             User Free             User Premium
  --------------------- --------------------- ---------------------------
  Trang chủ             Mô hình 3D là trung   Dashboard với Lộ trình cá
                        tâm                   nhân

  Lập kế hoạch          Tự xây dựng buổi tập  Được cung cấp lộ trình dài
                                              hạn

  Sự dẫn dắt            Reactive: Người dùng  Proactive: App đề xuất,
                        chọn, app hiển thị    người dùng theo

  Điều chỉnh            Người dùng tự thay    AI phân tích & điều chỉnh
                        đổi                   

  Phân tích             Biểu đồ cơ bản        Phân tích chuyên sâu, ước
                                              tính 1RM

  Dinh dưỡng            Không có              Gợi ý calo & macro (future)
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 5. Tương lai

-   **Sàn thương mại điện tử (E-commerce)**: Bán whey, creatine, phụ
    kiện tập luyện.\
-   **Nền tảng cộng đồng (Blog & Forum)**: Người dùng chia sẻ kinh
    nghiệm, hỏi đáp.\
-   **Bản đồ phòng gym**: Tìm kiếm, đánh giá, bình luận về phòng gym gần
    bạn.

------------------------------------------------------------------------

## 6. Kết luận

README này tóm tắt toàn bộ chức năng và nghiệp vụ theo từng role. Các
thành viên trong nhóm có thể dựa vào đây để nắm rõ phạm vi chức năng,
định hướng phát triển, và workflow người dùng trong cả Free và Premium.
