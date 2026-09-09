# Kiểm tra thời gian deploy ngày 09/09/2026

Phạm vi: đối chiếu lịch sử lệnh của task, các log deploy title đã lưu và mã pipeline hiện tại. Lượt audit này không chạy build/test/deploy và không thay đổi production. Mọi mốc dưới đây dùng giờ Việt Nam, UTC+7.

## Kết luận

Từ yêu cầu tiếp tục deploy title lúc 18:34:00 đến xác nhận restore admin lúc 20:29:21 là **115 phút 21 giây**. Riêng từ lúc người dùng báo mất logic admin lúc 19:31:02 đến xác nhận khôi phục là **58 phút 19 giây**. Đây là tổng thời gian xử lý, có cả trao đổi và các khoảng task không chạy; không phải thời gian VPS build.

Nguyên nhân chính: chọn source baseline chưa đối chiếu với image đang chạy, chuẩn bị thư mục restore thiếu đầu vào, đưa helper deploy mới chưa kiểm tra đủ vào đường triển khai, và chạy lại toàn bộ gate/build sau mỗi lỗi. Báo cáo trước quy các lỗi phát sinh thành “ba lỗi pipeline cũ” là không chính xác: helper copy dependency, validator symlink và parser canonical đều được thêm trong phiên này.

## Dòng thời gian

| Khoảng thời gian | Thời lượng | Việc xảy ra |
| --- | --- | --- |
| 18:34:00–19:00:40 | 26 phút 40 giây | Deploy title: chạy E2E riêng, rồi 3 lần deploy; lần đầu lỗi symlink worktree, lần hai lỗi canonical cố định, lần ba thành công. |
| 19:00:40–19:03:59 | 3 phút 19 giây | Trao đổi nguyên nhân và hướng sửa pipeline. |
| 19:03:59–19:14:30 | 10 phút 31 giây | Viết helper pipeline, test và build kiểm tra. |
| 19:14:30–19:31:02 | 16 phút 32 giây | Task trước đã kết thúc; chưa có yêu cầu tiếp theo. |
| 19:31:02–20:00:30 | 29 phút 28 giây | Truy image bị regression, dựng source restore, sửa snapshot/copy helper và chuẩn bị môi trường build. |
| 20:00:30–20:01:20 | 50 giây | Chờ xác nhận deploy restore. |
| 20:01:20–20:02:10 | 50 giây | Deploy bị chặn bởi test i18n cũ; cập nhật test và khởi động lại. |
| 20:02:10–20:13:32 | 11 phút 22 giây | Phiên kết thúc với lỗi `usage_limit_exceeded`; người dùng yêu cầu tiếp tục lúc 20:13:32. Không quy toàn bộ khoảng này thành thời gian deploy. |
| 20:13:32–20:29:21 | 15 phút 49 giây | Bổ sung test E2E thiếu; chạy gate riêng, rồi 3 lần deploy, sửa validator và parser Python trước lần thành công. |

Trong giai đoạn chuẩn bị restore còn có khoảng 19:49:00–19:54:10 không ghi nhận tool call mới, sau khi build đã trả lỗi. Log không đủ để phân bổ khoảng này giữa xử lý của model và chờ hệ thống; không được gộp thành thời gian build.

## Thời gian máy thực sự cần

Release cuối `20260909132535` ghi tổng **191 giây** trong deploy-fast:

| Bước | Thời gian |
| --- | --- |
| Gate i18n/E2E cộng xác minh host | 129 giây |
| Production build trên Mac, đồng bộ source và backup chạy song song | 34 giây |
| Chuyển artifact | 8 giây |
| Migration preflight | 1 giây |
| Lắp Docker image từ artifact trên VPS | 8 giây |
| Restart và healthcheck | 9 giây |
| Kiểm tra URL public | 2 giây |

Nhãn log “xác minh production host” gồm cả thời gian gate, vì bộ đếm bắt đầu trước gate nhưng tới sau xác minh host mới log lần đầu. Không được đọc 129 giây thành thời gian SSH.

Có **8 lượt E2E hoàn chỉnh, mỗi lượt 131 bài** trong chuỗi title + restore: 4 lượt title (3,2 + 3,1 + 3,0 + 2,9 phút) và 4 lượt restore (2,0 + 1,9 + 1,9 + 2,1 phút), tổng khoảng **20,1 phút** theo các số được làm tròn trong log. Con số này bao gồm khởi động/build server test; không cộng lại vào tổng thời gian từng lần deploy.

Riêng chuẩn bị restore đã gọi production build **5 lần**, lúc 19:47:35, 19:48:32, 19:54:19, 19:56:12 và 19:59:11. Ba lần đầu thất bại; hai lần cuối thành công. Sau đó gate E2E còn build test riêng và mỗi lần deploy lại build production.

## Sai sót có thể tránh được

1. **Dùng source mirror chưa xác minh làm baseline.** `releases/current` đã bị lần deploy lỗi trước ghi đè, trong khi container được rollback về image chứa logic admin mới. Deploy title hôm nay build từ source đó và làm mất logic đang live. Cần gắn source snapshot/manifest với từng image/release; một thư mục tên `current` chưa đủ làm bằng chứng.
2. **Chuẩn bị thư mục restore thiếu thành phần.** Lần lượt gặp dependency CLI hỏng do `cp -cRL` dereference symlink, thiếu `SESSION_SECRET`, copy nhầm file env chưa chứa biến cần thiết, DB local thiếu schema, test unit cũ và thiếu `tests/e2e/prepare-db.ts`. Cần kiểm tra đầy đủ build input và gate input trước lần chạy dài đầu tiên. Mirror production vốn loại env và tests nên không thể mặc định coi là checkout sẵn sàng build/deploy.
3. **Đưa helper mới vào deploy trước khi kiểm tra đúng môi trường.** Validator dùng sự tồn tại của symlink trong staging để kết luận link lỗi, nhưng runtime dependency Linux chỉ xuất hiện khi lắp image. Parser canonical đánh giá annotation `str | None` trên Python 3.9 của VPS và lỗi; thêm postponed annotations mới khắc phục. Các lỗi này thuộc code helper mới, không thuộc logic admin.
4. **Chạy kiểm tra trùng.** Chạy E2E riêng rồi gọi deploy vốn tự chạy lại cùng gate, lặp lint/build sau khi đã pass dù source ứng dụng không đổi. Pipeline hiện không có cơ chế tiếp tục từ artifact đã kiểm chứng nên một lỗi cuối quy trình kéo theo chạy lại gate và build từ đầu.
5. **Kiểm chứng chưa đúng mức trước khi tuyên bố hoàn tất.** Unit test và build Next ở checkout chính chưa kiểm chứng helper copy trong build context, staging dependency thực hay Python trên VPS. Kiểm tra string trong bundle chứng minh code được đóng gói; không thay thế kiểm tra trang admin đã đăng nhập và đối chiếu số tiền thực tế.

## Những điểm pipeline vẫn chưa xử lý hết

Đọc mã hiện tại cho thấy tuyên bố trước “rollback đồng thời source và image, tránh lặp lại” rộng hơn bằng chứng:

- `scripts/deploy-fast.sh:106–115` restore source ở EXIT khi có lỗi. Trap rollback image nằm trong bước remote restart và bị tắt ở dòng 664. Nếu kiểm tra public URL ở dòng 678 hoặc timer ở dòng 685 thất bại sau đó, source bị restore nhưng image mới vẫn chạy. Đây là đường lỗi còn có thể tạo lệch source/image; audit này chưa kích hoạt lỗi trên production.
- `SMOKE_ONLY` vẫn đồng bộ source/public vào `releases/current`. Thành công thì cleanup xóa snapshot, trong khi container production vẫn dùng image cũ.
- Snapshot dùng `rsync --link-dest` (hardlink), nhưng fixture test ghi đè file tại chỗ. Trên filesystem thực sự tạo hardlink, thao tác đó cũng sửa snapshot. Test này cần xác minh semantics thực; kết quả pass trước đó trên Mac chưa chứng minh an toàn trên Linux.

## Cách giảm thời gian cho lần sau

- Chốt source ứng với image production và phạm vi patch trước khi build.
- Gom preflight môi trường/test/dependency/Python vào một bước nhanh, chạy helper trên runtime đích trước promote.
- Tách kiểm chứng/build, đóng gói và promote; giữ artifact cùng checksum source/config để retry bước lỗi mà không chạy lại kiểm chứng cho đầu vào không đổi. Đây là đề xuất thay đổi pipeline, chưa triển khai; gate bắt buộc hiện tại không được bỏ qua tùy tiện.
- Hoàn thiện rollback source/image/public thành một giao dịch tới hết public check, rồi test lỗi ở từng giai đoạn trong fixture hoặc môi trường cô lập.
- Với hotfix admin, kiểm tra công thức và trang admin đúng phạm vi. Không chạy E2E riêng rồi ngay sau đó chạy lại cùng E2E trong deploy.

## Bằng chứng đã đối chiếu

- Timestamp user/tool/task và trạng thái `usage_limit_exceeded` trong log phiên hiện tại; không sao chép nội dung bí mật từ log.
- `/Users/namdo/Documents/thiepmung-title-deploy-20260909/deploy.log`
- `/Users/namdo/Documents/thiepmung-title-deploy-20260909/deploy-independent.log`
- `/Users/namdo/Documents/thiepmung-title-deploy-20260909/deploy-current-demo.log`
- `/Users/namdo/Documents/thiepmung-title-deploy-20260909/i18n-e2e.log`
- `docs/deploy-vps.md`, `scripts/deploy-fast.sh`, các helper và `playwright*.config.ts` hiện tại. Root và restore-v2 có deploy-fast.sh giống nhau tại thời điểm audit.


## Follow-up: local data refresh and deployment fixes

A read-only snapshot of the active VPS database was downloaded on 2026-09-09
at 20:41 Vietnam time, with matching SHA-256 and SQLite integrity checks. Local
`dev.db` was backed up before replacement and the dev server restarted on 3001.
The historical dragon-phoenix-v3 demo now resolves to `/mau-thiep/en-do/demo`,
matching the production label “Én Đỏ”; the canonical route returns HTTP 200.

The pipeline now has a fast prerequisite check, content-verified gate/build
cache, unique source candidates/backup IDs, current-pointer plus image rollback
through public/timer checks, and bounded source retention. The pull command now
defaults to the active VPS and refuses replacement while the local DB is open.
Deployment tests cover cache invalidation/corruption, smoke isolation, public
503 and timer failure rollback, source retention and verified database copying.

Measured local preparation: **191 seconds cold, seven seconds repeat**. All 131
i18n browser checks and deployment regressions passed. Production was not
republished during this optimization; end-to-end VPS deployment timing remains
unmeasured. Details and commands are in `docs/deploy-vps.md`.
