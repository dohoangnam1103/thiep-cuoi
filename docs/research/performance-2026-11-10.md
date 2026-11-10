# Kiểm chứng tối ưu tải trang ngày 10/11/2026

Phạm vi là bốn tối ưu đã thống nhất sau khi bỏ bìa phong bì 3D. So sánh với bản build local sau lần bỏ 3D, trước bốn thay đổi này. Các số liệu trước/sau bên dưới được đo ở local. Kết quả phát hành production được ghi ở cuối tài liệu.

`/mau-thiep` dùng `listingMessageNamespaces`, gồm `chrome`, `home`, `listing`, `templatePreviewModal` và `templateSeoFacets`. Kiểm tra dependency tree của các hook dịch bảo đảm các namespace cần thiết đều có mặt. HTML cùng dữ liệu test giảm từ 129.069 xuống 55.513 byte khi gzip, tương đương 57%.

Open Sans và Be Vietnam Pro tải theo CSS khi được sử dụng. Cả hai khai `preload: false` theo các font khác trong `src/lib/fonts.ts`. Font, weight, style, subset, biến CSS và `font-display` giữ cùng giá trị. Trong lượt đo mobile, hai demo thiệp tải ít hơn 119.872 byte dữ liệu font truyền qua mạng, khoảng 117 KiB. Trang chủ và danh sách giảm khoảng 40 KiB font. Các giá trị truyền qua mạng bao gồm header nên có thể dao động nhẹ.

Hai ảnh mobile được tạo từ artwork hiện có bằng Sharp, giữ alpha và tỷ lệ. Dùng resize không phóng lớn, WebP quality 85, alphaQuality 90, effort 6. Royal chọn rộng 576 px để đáp ứng bìa mobile rộng tối đa khoảng 272 px ở mật độ 2×. Nguồn gốc và quyền sử dụng kế thừa từ asset gốc trong repo.

| Artwork bìa | Nguồn trong `public/chungdoi/images/themes/_decor/` | Biến thể mobile cùng thư mục | Trước → sau |
| --- | --- | --- | --- |
| Hoàng Kim Đỏ | `royal-red/flower.webp`, 900 × 544 | `flower-mobile.webp`, 576 × 348 | 166.646 → 72.502 byte |
| Tối Giản Đỏ Đậm | `minimalism-dark-red/flower2-decoration.webp`, 811 × 1938 | `flower2-decoration-mobile.webp`, 480 × 1147 | 232.184 → 95.124 byte |

Artwork thuộc bìa, neo theo thẻ thiệp. CSS vị trí, kích thước và các lớp hoa bay lấy từ theme hiện có. `mobileCoverDecorSrc()` được dùng chung cho `<picture>` và preload theo media, dưới 768 px chọn biến thể mobile. Từ 768 px dùng artwork gốc. Test xác nhận ảnh gốc không bị tải cùng biến thể mobile, chuyển viewport chọn lại ảnh đúng và Enter mở được thiệp.

Video hướng dẫn dùng cùng file MP4 và poster hiện có. Observer chuẩn bị tài nguyên khi video cách viewport 400 px. Focus và pointer cũng kích hoạt tải. Nếu không có IntersectionObserver, requestAnimationFrame kích hoạt tải. Khung và controls dùng markup hiện có. Trước khi cuộn trên mobile, poster khoảng 97 KiB và video chưa được yêu cầu. Test cuộn tới video và xác nhận phát được, thời gian video tăng.

Lượt đo dùng Chrome, viewport 390 × 844, mật độ 2×, CPU 4×, mạng 5 Mbps, latency 100 ms. Demo Hoàng Kim Đỏ có LCP 1.560 → 936 ms trong một lượt trước/sau. Đây là số đo lab, chưa phải phân vị khách thật. LCP trang chủ có thể thay đổi phần tử khi carousel tự chuyển, nên không dùng lượt đo này để kết luận mức tăng LCP trang chủ.

Bìa được chụp trước/sau tại viewport 390, 800 và 1440 px, cao 900 px, mật độ 2×, reduced motion. Desktop và tablet trùng pixel. Ở mobile Royal có sai khác RGB tối đa 13/255, Minimalism có 0,043% pixel sai khác trên 16/255. Đã xem ảnh cạnh nhau, bố cục và artwork khớp. Mobile là WebP encode lại có mất dữ liệu. Chưa kiểm tra riêng ảnh mới trên thiết bị mật độ 3× hoặc 4×.

Bằng chứng ảnh và JSON nằm tại `/var/folders/3c/bz8h2zk56b35f9ktvnfzntq40000gn/T/chungdoi-performance-implementation.sKAmQvhdaV/`. `mobile-comparison.png` lần lượt là Royal trước/sau và Minimalism trước/sau. `before-screens.jsonl`, `after-screens.jsonl`, `metrics-after.jsonl` và `summary.json` ghi dữ liệu đo. Dữ liệu trước của phép đo tải trang nằm trong `/var/folders/3c/bz8h2zk56b35f9ktvnfzntq40000gn/T/chungdoi-perf-review.UAVZKEkyT2/local.jsonl`.

Kiểm chứng mã và luồng chính đã thực hiện

- Lint đạt với 0 error, 399 warning hiện có.
- Typecheck app và tests đạt. Production build local đạt.
- 8 unit test về namespace và translation coverage đạt.
- Bốn test mới trong `web-performance.spec.ts` thất bại đúng kỳ vọng trên bản build trước và đạt trên bản mới.
- Nhóm cover, preload, decor bay và performance đạt 15 E2E, 4 trường hợp physical fixture được skip theo cấu hình sẵn có.
- Kiểm tra bổ sung gallery và gift modal đạt 6/8. Hai test cũ `Vietnamese locale localizes template metadata and filters` và `clicking a card preview opens the template modal` thất bại giống nhau trên cả build trước và build mới. Chúng còn yêu cầu nhãn màu riêng trong card và nút `Xem trước`, trong khi UI hiện tại dùng danh mục trong card và nút `CHỌN THIỆP`. Test mới đã kiểm tra mở/đóng preview và phát hiện lỗi dịch trên UI hiện tại.

Log tại `/tmp/chungdoi-performance-{build,lint,types,translations,e2e,listing,baseline-failures}.log`. Không chạy toàn bộ E2E hay đo tải đồng thời VPS trong phạm vi này.

PHASE: regression
STATUS: complete
CHANGED: message scopes, font preload, cover image selection and two derivative assets, guide video, relevant tests
VERIFIED: local production build, relevant tests, mobile/tablet/desktop cover comparison, network payload measurements
UNVERIFIED: production deployment, field Web Vitals, 3×/4× asset fidelity
RISKS: two pre-existing gallery tests retain old UI expectations
NEXT: production verification recorded below

## Phát hành production

Ngày 10/11/2026, nhánh làm việc được fast-forward vào nhánh mặc định `master` và push lên origin. Các commit ứng dụng là `74f7575` và `9c84aa6`. Commit `9dbb337` loại bản copy tham chiếu `master-public` khỏi context deploy và bổ sung kiểm tra bằng fixture vào bài test an toàn của pipeline.

Đã phát hành deployment `20261110153141` bằng `npm run deploy` tới VPS `163.61.110.34`. Quy trình hoàn tất với exit code 0 sau 423 giây. Cả 131 E2E của cổng i18n đạt, image Linux được dựng và SQLite native được kiểm tra, các bước origin/public/cron đạt. Container web healthy, khóa deploy được giải phóng. Không có migration pending.

Chrome trên tên miền thật xác nhận các luồng sau

- Trang chủ giữ poster và video chưa tải ở đầu trang, sau đó tải khi cuộn tới gần video.
- `/mau-thiep` trả 200, HTML gzip khoảng 55 KiB, preview mở và đóng được.
- Demo Hoàng Kim Đỏ dùng bìa 2D và `flower-mobile.webp`. Không có canvas, chunk chứa `WebGLRenderer` hoặc preload font toàn cục trong lượt kiểm tra. Mở thiệp thành công.
- Hai asset mobile trả 200 với dung lượng 72.502 và 95.124 byte. CSP production có `upgrade-insecure-requests`.
- Không có page error trong các luồng Chrome đã kiểm tra.

Lúc bắt đầu phát hành, VPS chỉ còn khoảng 4,4 GiB, thấp hơn ngưỡng 6 GiB của pipeline. Đã chuyển bốn backup hằng ngày cũ nhất sang máy local, giữ tám backup hằng ngày mới nhất trên VPS. Backup dùng XFS reflink nên thao tác này giải phóng ít dung lượng thực. Các bản copy asset tham chiếu, prebuilt artifact cũ và journal/log đã rotate cũng được lưu riêng, đối chiếu SHA-256 và kiểm tra archive trước khi thu hồi bản sao trên VPS. Các cache ảnh/OG cũ và một image cũ hơn bản rollback hiện hành đã được thu hồi. Sau đó VPS đạt 6,1 GiB và vượt qua cổng dung lượng trước deploy.

Archive riêng tư nằm tại `backups/vps-archive-20261110/`, gồm `old-daily-backups.tar.gz`, `reference-assets-and-journals.tar.gz`, `prebuilt-artifacts-and-rotated-logs.tar.gz` và `SHA256SUMS`. Thư mục có mode 700, các archive có mode 600 và được gitignore. Dữ liệu live cùng bản rollback ngay trước phát hành được giữ. Sau khi dựng image mới, VPS còn khoảng 3,5 GiB, dưới ngưỡng 6 GiB để bắt đầu một lần deploy tiếp theo.

Log kiểm tra nằm tại `/tmp/chungdoi-release-deploy.log`, `/tmp/chungdoi-release-live-browser.log` và `/tmp/chungdoi-release-unit.log`. Các bản ghi local không được đưa vào source hoặc public assets của release.
