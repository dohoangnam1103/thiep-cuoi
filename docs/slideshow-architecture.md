# Kiến trúc slideshow cưới MVP

## Phạm vi sản phẩm

Slideshow là sản phẩm độc lập chạy chung codebase và domain với thiepmungonline.com để tận dụng SEO và hạ tầng, nhưng **không dùng chung lifecycle hoặc dữ liệu nghiệp vụ của `Invitation`**.

MVP hiện tại cung cấp:

- Demo công khai tại `/trinh-chieu`, không có mật khẩu beta.
- Bắt buộc đăng nhập mới được tạo, chỉnh sửa, tải media và thanh toán.
- Dùng thử đúng 72 giờ tính từ lúc project được tạo.
- Giá cố định `199.000 VND` cho một project; thanh toán một lần mở khóa vĩnh viễn.
- Một nguồn nội dung tạo đồng thời preview TV 16:9 và điện thoại 9:16.
- Ảnh, video và nhạc nền; đổi template không làm mất nguồn nội dung/media đã tải.
- Link chia sẻ dùng token ngẫu nhiên tồn tại cùng project. Hết trial mà chưa thanh toán thì link hiển thị cổng thanh toán, không xóa dữ liệu.
- Preview trong trình duyệt là đầu ra của milestone này. Render/download MP4 chưa nằm trong MVP.

## Ranh giới với thiệp mời production

Các bảng slideshow chỉ quan hệ với `User` và với nhau:

```text
User
└── SlideshowProject
    ├── SlideshowAsset
    └── SlideshowPayment
```

Slideshow không đọc hoặc ghi `Invitation`, `InvitationContent`, `GalleryPhoto`, `Payment`, trial của thiệp hay media của thiệp. Chỉ tái sử dụng các primitive an toàn:

- Session/account authentication.
- Catalog `Track` ở trạng thái `ready` và UI chọn nhạc.
- Client payOS/Casso ở lớp tích hợp, nhưng settlement và record thanh toán tách riêng.
- Các helper xử lý ảnh/video đã có, không dùng thư mục upload của thiệp.

Mọi thay đổi webhook là dispatcher additive theo namespace mã đơn. Luồng `CD...` của thiệp vẫn đi qua service cũ; slideshow dùng `SS...` và service riêng.

## Ma trận route và quyền truy cập

| Route | Quyền | Hành vi |
| --- | --- | --- |
| `/trinh-chieu` | Công khai | Demo/read-only; nếu đã đăng nhập thì hiển thị danh sách project của chính user. |
| `/trinh-chieu/bat-dau` | Account | Trang xác nhận. GET không tạo dữ liệu; server action POST mới tạo project và bắt đầu trial. |
| `/trinh-chieu/[id]` | Owner | Editor; query luôn scope theo `id + userId`. Hết trial thì chỉ đọc và hiện CTA thanh toán. |
| `/trinh-chieu/xem/[token]` | Công khai | Viewer read-only bằng token. Trial hết và chưa mở khóa thì không render nội dung/media. |
| `/trinh-chieu/[id]/thanh-toan` | Owner | GET chỉ đọc eligibility. Người dùng bấm xác nhận để server action POST tạo/reuse đơn. |
| `/api/slideshows/[id]/assets` | Owner + entitlement | Upload ảnh/video vào storage riêng và reserve quota atomically. |
| `/api/slideshows/media/[assetId]?token=...` | Owner hoặc share token còn entitlement | Stream media; hỗ trợ byte range cho video. |
| `/api/slideshow-payments/[code]/*` | Owner | QR/status của đúng project; QR chỉ tồn tại cho đơn payOS pending, chưa hết hạn và project chưa mở khóa. |

Không dùng project ID làm public share URL. Request không có ownership hợp lệ trả 404 để không tiết lộ sự tồn tại của project/payment.

## Persistence và migration

Schema nằm trong `prisma/schema.prisma`; migration additive:

```text
prisma/migrations/20260904120000_add_slideshow_mvp/migration.sql
```

### `SlideshowProject`

Các field quan trọng:

- `userId`, `shareToken`, `creationKey` (idempotency khi tạo).
- `templateId`, `templateVersion`.
- `sourceJson`, `sceneOverridesJson`, `musicUrl`.
- `revision` cho optimistic concurrency/CAS.
- `assetCount`, `assetBytes` cho quota atomically.
- `trialStartedAt`, `paid`, `complimentary` cho entitlement độc lập.

`trialStartedAt` không được reset khi đổi template hoặc sửa nội dung. Trial kết thúc tại `trialStartedAt + 72 giờ`.

### `SlideshowAsset`

Lưu metadata của file: project, UUID storage key, tên gốc, MIME, kind, byte size. File thật nằm ngoài `public/` tại `data/slideshow-media` (hoặc `SLIDESHOW_MEDIA_ROOT`).

### `SlideshowPayment`

Lưu đơn riêng của slideshow: amount/status/provider, mã nội bộ, namespace order code payOS, checkout/QR/bank metadata, review metadata và `activeKey` unique. `activeKey = project + provider` bảo đảm tối đa một đơn pending cho cùng cặp đó ngay cả khi request cạnh tranh.

## Nguồn nội dung và template

`WeddingSlideshowSource` là canonical source duy nhất gồm:

- Tên cô dâu/chú rể.
- Ngày, địa điểm.
- Các đoạn câu chuyện.
- Danh sách ảnh/video.

Người dùng không sửa riêng TV và mobile. Mỗi composition tự chuyển thể source sang 16:9 và 9:16. Scene override được namespace theo `templateId@version`; do đó đổi template giữ source/media và giữ override cũ để dùng lại khi quay về template trước.

Version được hỗ trợ là danh sách explicit, không phụ thuộc “version mới nhất” trong catalog. Hiện có:

| Template | Version | Thời lượng cố định | Media tối đa |
| --- | ---: | ---: | ---: |
| `cinematic` | 1 | 20 giây | 60 |
| `editorial` | 1 | 15 giây | 80 |

Mỗi template sở hữu storyboard, DOM, art direction, timing và cách crop riêng. Không ép các template dùng một universal scene tree.

## Autosave và concurrency

Editor debounce autosave khoảng 450 ms và serialize request qua một queue phía client:

1. Mỗi thay đổi tăng local revision.
2. Queue coalesce về snapshot mới nhất, chỉ có một save in-flight.
3. Server nhận `expectedRevision` và update bằng CAS `id + userId + revision`.
4. Save validate template/version, min/max media, ownership của từng asset và track nhạc trong cùng transaction.
5. Network error được thử tối đa ba lần; nếu request đã commit nhưng client mất response, canonical snapshot trùng khớp được nhận là replay thành công ở revision hiện tại.
6. Save trùng/no-op không tăng server revision.
7. Nếu tab khác đã ghi payload khác trước, UI chuyển sang trạng thái conflict và yêu cầu tải lại; client không tự nâng revision để ghi đè dữ liệu mới hơn.
8. `beforeunload` cảnh báo khi local revision chưa được persist.

## Media, quota và xóa file

Upload áp dụng các rào sau:

- Ảnh nguồn tối đa 50 MiB, được xác thực/chuẩn hóa thành WebP tối đa 2400 x 2400.
- Video tối đa 80 MiB; request tối đa 82 MiB; hỗ trợ container MP4, MOV và WebM.
- Tối đa 80 asset và 1 GiB/project, đồng thời không vượt `maxPhotos` của template.
- File được ghi bằng UUID với `wx`; transaction chỉ tạo row sau khi reserve `assetCount/assetBytes` thành công. DB/quota fail thì file vừa ghi được unlink.
- URL media chứa cả asset ID và share token. Server save không tin `media.id`: ID phải khớp URL, share token và row thuộc đúng project/kind.
- Response media dùng `private, no-store`, `nosniff`, `X-Robots-Tag`; video hỗ trợ `206 Range`.

Khi một asset từng được lưu bị bỏ khỏi draft, save transaction đồng thời:

1. CAS project sang draft mới.
2. Xóa đúng row asset không còn được tham chiếu.
3. Giảm count/bytes bằng size authoritative từ DB.
4. Sau commit mới unlink file; `ENOENT` là idempotent success, lỗi khác được log.

Upload chưa từng kịp vào draft (ví dụ đóng tab ngay sau upload) được job cron thu gom sau 24 giờ không hoạt động. Cleanup tăng `revision` cùng transaction xóa row/quota, vì vậy autosave cạnh tranh sẽ conflict thay vì tạo URL trỏ tới file đã xóa.

Giới hạn hiện tại: video mới kiểm tra MIME/container signature; chưa probe codec, transcode hoặc tạo rendition đa thiết bị. Đây là việc phải làm trước khi cam kết playback cho mọi TV/iPhone/Android.

## Entitlement

Thứ tự quyết định entitlement:

1. `paid`.
2. `complimentary`.
3. Trial còn thời gian.
4. `expired`.

Owner vẫn có thể mở editor và xem draft/media khi expired, nhưng không thể sửa/upload. Viewer public và public-token media bị chặn đến khi project được mở khóa. Nội dung, asset row, file và token không bị xóa khi trial kết thúc.

Giới hạn chống lạm dụng hiện tại: tối đa 20 project/account và tối đa 3 project chưa paid/complimentary.

## Thanh toán và đối soát

Giá được định nghĩa tập trung bằng `SLIDESHOW_PRICE_VND = 199_000`.

- Casso dùng mã `SS` + 6 ký tự base32, tách khỏi mã `CD` của thiệp.
- payOS dùng numeric namespace riêng và vẫn lưu mã `SS...` làm description.
- Đơn pending có hiệu lực 24 giờ. Status endpoint persist `expired` và giải phóng `activeKey`, không chỉ trả trạng thái ảo.
- QR endpoint chỉ trả QR cho owner, provider payOS, status pending, chưa hết hạn và project chưa paid/complimentary.
- Settlement CAS một payment chưa `paid` (kể cả local đã `expired`, `cancelled`, `superseded`, `failed` hoặc `review`) sang `paid` khi webhook/payOS xác nhận đã nhận đủ tiền, sau đó mở khóa project và supersede các sibling pending trong cùng transaction. Link payOS dư được hủy best-effort sau commit.
- Cron tiếp tục hỏi payOS cho các đơn `pending`, `expired` và `superseded` trong cửa sổ đối soát, để local expiry hoặc hủy link best-effort không làm mất giao dịch đã nhận tiền.
- Underpaid, Casso tới sau expiry hoặc project đã được mở khóa theo đường khác được lưu durable ở trạng thái `review` với amount/provider ref/reason thay vì âm thầm bỏ qua.
- Casso payload chứa đồng thời mã `CD...` và `SS...` bị reject `422`; không ưu tiên một sản phẩm rồi làm mất settlement của sản phẩm kia.
- Polling trên checkout, webhook và cron đều dùng cùng settlement service idempotent.

Đối soát background production tại `/api/cron/payos-reconcile` chạy tuần tự:

1. Payment thiệp mời hiện hữu.
2. `SlideshowPayment` payOS pending.
3. Cleanup media slideshow mồ côi.

Response giữ các field summary thiệp ở top-level để tương thích consumer cũ. Script phát triển `scripts/reconcile-payos.ts` cũng chạy lần lượt cả hai payment domain.

## Storage, backup và vận hành

Production mount toàn bộ `data/`, nên `data/slideshow-media` tồn tại ngoài writable layer của container. Các đường backup/integrity đã bao phủ thư mục này:

- `scripts/vps/backup-production.py`: recurring snapshot deduplicated; xử lý an toàn khi thư mục chưa được tạo.
- `scripts/deploy-fast.sh`: hardlink pre-deploy snapshot và retention riêng.
- `scripts/pull-prod-db.sh`: kéo DB + slideshow media về local, bỏ qua an toàn nếu production chưa có thư mục.
- `scripts/vps/media-manifest.py`: checksum inventory khi migration/cutover.

Khi rollout schema, dùng Prisma migration đã review; không dùng `db push` lên production. Sau khi generate client và migrate, bảo đảm volume `data/` có quyền ghi phù hợp với UID container.

## Những việc cố ý để sau MVP

- Render/export MP4, render worker, FFmpeg/Remotion và hàng đợi job.
- Probe codec, transcode và poster/rendition video.
- Gallery 50 template với search/facet/admin publishing; hiện template được publish qua code.
- Admin discount/bundle giữa thiệp mời và slideshow; hiện không có liên kết giá hoặc entitlement giữa hai sản phẩm.
- Visual regression diện rộng và playback soak test trên ma trận TV/mobile.
- Feature kill switch riêng. Demo hiện công khai theo quyết định sản phẩm; auth/ownership vẫn bắt buộc cho mọi mutation.

Các phần deferred không được giải quyết bằng cách tái sử dụng bảng hoặc lifecycle của `Invitation`.
