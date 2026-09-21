# Đặc tả tái xây dựng Site 1 từ website Chungdoi

Ngày khảo sát: **18/09/2026**. Nguồn tham chiếu: **https://chungdoi.com**, ưu tiên phiên bản tiếng Việt.

## 1. Mục tiêu và cách sử dụng tài liệu

Giả định toàn bộ source của dự án clone đã mất. Đội phát triển chỉ còn website Chungdoi đang hoạt động, tài liệu này và những bằng chứng công khai thu thập lại được. Mục tiêu là xây dựng một Site 1 độc lập, có đủ hành trình tạo, chỉnh sửa, xuất bản, chia sẻ và quản lý thiệp cưới.

**Yêu cầu đã chốt từ người dùng: UI và assets của các thiệp mẫu detail/demo phải giống hệt Chungdoi.com.** Ví dụ chuẩn đầu tiên: [Minimalism Đỏ Đậm — demo](https://chungdoi.com/vi/mau-thiep/minimalism-do-dam/demo). Không hiểu yêu cầu này thành chỉ dùng cùng màu hoặc bố cục gần giống. Phải tái tạo cả phong bì, artwork, font, các section bên trong, modal, chuyển động và trạng thái tương tác.

Đây là **đặc tả sản phẩm và kiến trúc để dựng mới**, không phải bản khôi phục source, database hay hạ tầng nội bộ của Chungdoi. Không đọc source ứng dụng hiện hữu để suy diễn website tham chiếu đang dùng công nghệ nào. Cấu trúc thư mục, schema và API bên dưới là thiết kế đề xuất.

### Nhãn bằng chứng

| Nhãn | Ý nghĩa |
|---|---|
| **O** | Quan sát trực tiếp trên giao diện website trong lần khảo sát này |
| **D** | Được mô tả trong trang sản phẩm hoặc hướng dẫn công khai; chưa chạy trọn luồng |
| **R** | Yêu cầu kỹ thuật/thiết kế đề xuất cho Site 1 dựng mới |
| **U** | Chưa xác minh hoặc có thông tin mâu thuẫn; cần khảo sát trước khi khóa implementation |

Không đổi nhãn D/U thành O chỉ vì đã xây được giao diện tương tự. Tất cả tiêu chí nghiệm thu trong tài liệu là việc phải làm khi triển khai, **chưa phải kết quả test đã đạt**.

### Phạm vi Site 1

- Toàn bộ sản phẩm thiệp cưới: public website, thư viện mẫu, detail, demo, tài khoản, editor, thiệp công khai, khách mời, RSVP, lời chúc, thanh toán và vận hành.
- Các công cụ, nội dung SEO, đối tác và đại lý được ghi vào danh mục đầy đủ; có thể triển khai sau lõi sản phẩm nhưng không tự ý bỏ khỏi backlog.
- Site 2 không nằm trong phạm vi; không cần dựng monorepo hay một deployment thứ hai để hoàn thành Site 1.
- Theo ràng buộc dự án được cung cấp: giao diện Site 1 ưu tiên **tiếng Việt, URL không có tiền tố locale**. Chungdoi tham chiếu có `/vi` và nhiều ngôn ngữ: ghi nhận để ánh xạ, không tự động khôi phục toàn bộ locale vào Site 1. Nội dung vẫn phải đi qua message catalog.
- Đa ngôn ngữ **trong một tấm thiệp** là một tính năng riêng của tham chiếu, phải được lưu trong backlog; không đánh đồng với locale của website quản lý.

## 2. Kết quả khảo sát và giới hạn

Đã đọc trang chủ, thư viện mẫu, detail Minimalism Đỏ Đậm, bảng giá, hướng dẫn tạo thiệp, các hướng dẫn về đổi mẫu/media/ngôn ngữ/RSVP/khách mời/nâng cấp, trang công cụ, đại lý, đối tác và danh bạ nhà hàng.

Đã mở trực tiếp trên trình duyệt: phong bì demo, nội dung sau mở thiệp, form RSVP, hộp mừng cưới và modal đăng nhập. Đã lấy danh sách đường dẫn mẫu từ DOM trang thư viện: **61 biến thể mẫu**, không tính trang bộ sưu tập.

Chưa đăng nhập, tạo tài khoản, tạo thiệp thật, gửi lời chúc/RSVP lên hệ thống tham chiếu, thanh toán hay truy cập quản trị. Chưa khảo sát editor và dashboard bằng tài khoản thật. Chưa chụp/so sánh đủ viewport, đo CSS, lập manifest assets hoặc tải toàn bộ assets của 61 mẫu. Không có bằng chứng cho phép tuyên bố đã thu hồi đủ tài nguyên hoặc đã xác minh fidelity 1:1.

### Những điểm cần giữ nguyên sự khác biệt giữa nguồn

| Vấn đề | Bằng chứng và quyết định cho bản đặc tả |
|---|---|
| Đăng nhập | **O:** modal hiện Google, Apple và email nhận OTP, không yêu cầu mật khẩu ở bước đầu. Không lấy cơ chế password của clone cũ làm sự thật của tham chiếu. [Trang đã kiểm tra](https://chungdoi.com/vi/mau-thiep/minimalism-do-dam) |
| Giá bán | **U:** FAQ thư viện ghi 199.000đ, trang giá trong môi trường khảo sát hiển thị US$24.99, có quy đổi KRW. Lưu giá theo thị trường/tiền tệ và quote server; chưa chốt một giá duy nhất. [Thư viện](https://chungdoi.com/vi/mau-thiep), [bảng giá](https://chungdoi.com/vi/bang-gia) |
| Giới hạn trial | **D/U:** có mốc 3 ngày; bảng giá ghi 20 người, help nói giới hạn lượt xem. Phải xác minh đơn vị đếm, thời điểm bắt đầu, bot/refresh có bị tính không. [Nâng cấp](https://chungdoi.com/vi/help/cach-nang-cap-goi) |
| Nhà cung cấp thanh toán | **D/U:** hướng dẫn Việt mô tả QR/chuyển khoản; bảng giá mô tả checkout quốc tế. Thiết kế adapter riêng, xác minh routing thị trường trước khi tích hợp. [Hướng dẫn](https://chungdoi.com/vi/tao-thiep-cuoi-online) |
| Gỡ xuất bản | **D:** help hiện nói chưa có nút gỡ xuất bản. Không tự nhận đây là tính năng đã có. Nếu Site 1 cần bổ sung thì coi là yêu cầu R riêng. [Tạo thiệp](https://chungdoi.com/vi/help/cach-tao-thiep-cuoi-online) |
| Màu sắc mẫu | **D:** màu cố định theo biến thể, đổi màu là đổi mẫu. Không mặc định xây color picker tự do. [Đổi mẫu](https://chungdoi.com/vi/help/cach-doi-mau-thiep) |
| Nhiều lễ và địa điểm | **D/U:** help chi tiết phân biệt nhiều mục lễ với một địa điểm tiệc/bản đồ; các trang giới thiệu diễn đạt rộng hơn. Bản đầu dùng nhiều mục lễ và một tiệc chính; khảo sát editor để khóa trường. [Tạo thiệp](https://chungdoi.com/vi/help/cach-tao-thiep-cuoi-online) |
| Demo và dữ liệu động | **O:** sổ lưu bút tải sau nội dung ban đầu; dữ liệu mẫu ở các phần không hoàn toàn đồng nhất. Dùng fixture ổn định để kiểm tra hình ảnh; không sao chép nhầm tài khoản ngân hàng mẫu vào thiệp thật. [Demo](https://chungdoi.com/vi/mau-thiep/minimalism-do-dam/demo) |

## 3. Bản đồ người dùng và quyền

Các vai trò dưới đây là mô hình R để đáp ứng hành vi D/O, không phải khẳng định tên role nội bộ của Chungdoi.

| Vai trò | Quyền cần có | Giới hạn |
|---|---|---|
| Khách truy cập | Xem nội dung, mẫu, demo, dùng công cụ công khai | Không đọc draft, dashboard, danh sách khách |
| Người thử editor | Nhập nội dung thử, xem trước nếu luồng anonymous được xác minh | Không được chiếm thiệp của người khác; cần cơ chế nhận lại draft |
| Chủ thiệp | Quản lý thiệp của mình, media, khách, RSVP, thanh toán | Kiểm tra ownership trên mọi thao tác server |
| Khách nhận link chung | Xem thiệp đã public, RSVP, lời chúc, bản đồ, quà | Không thấy danh sách hoặc phản hồi riêng của khách khác |
| Khách nhận link cá nhân | Nhận lời mời riêng, phản hồi gắn đúng hồ sơ | Link cá nhân không cấp quyền editor |
| Người nhà hỗ trợ | Thêm khách qua link riêng | Không chỉnh thiệp, ngân hàng hoặc billing |
| Đại lý | Quản lý gói/credit, thương hiệu, khách hàng được ủy quyền | Không truy cập tài khoản ngoài phạm vi của mình |
| Nhân viên vận hành | Hỗ trợ, xử lý thanh toán, nội dung, template | Quyền nhỏ theo nhiệm vụ, audit bắt buộc |

## 4. Bản đồ trang và route

Đường dẫn tham chiếu là nguồn khảo sát. Đường dẫn Site 1 là **đề xuất R**; các route private chưa quan sát không được xem là bản sao URL nội bộ của Chungdoi.

| Khu vực | Tham chiếu công khai | Route Site 1 đề xuất | Nội dung/trạng thái |
|---|---|---|---|
| Trang chủ | `/vi` | `/` | Giới thiệu, mẫu nổi bật, cách dùng, lợi ích, FAQ, CTA |
| Thư viện mẫu | `/vi/mau-thiep` | `/mau-thiep` | Card preview, tên, tag, biến thể, nhãn mới |
| Bộ sưu tập | `/vi/mau-thiep/bo-suu-tap/...` | `/mau-thiep/bo-suu-tap/[slug]` | Nhóm theo màu/phong cách, nội dung SEO |
| Detail mẫu | `/vi/mau-thiep/[slug]` | `/mau-thiep/[slug]` | Ảnh preview, giới thiệu, demo, tạo, liên quan |
| Demo mẫu | `/vi/mau-thiep/[slug]/demo` | `/mau-thiep/[slug]/demo` | Phong bì, mở thiệp, tương tác demo |
| Hướng dẫn tạo | `/vi/tao-thiep-cuoi-online` | `/tao-thiep-cuoi-online` | Hướng dẫn từng bước, ảnh/video |
| Giá | `/vi/bang-gia` | `/bang-gia` | Trial, giá, điều kiện, nâng cấp |
| Trợ giúp | `/vi/help` | `/help`, `/help/[slug]` | Tìm kiếm, chủ đề, bài, liên hệ |
| Blog | `/vi/blog/...` | `/blog`, `/blog/[slug]` | Danh sách, bài, chủ đề, liên quan |
| Công cụ | `/vi/cong-cu` | `/cong-cu`, `/cong-cu/[slug]` | 14 nhóm công cụ ở mục 9 |
| Đối tác | `/vi/doi-tac` | `/doi-tac` | Danh bạ, giới thiệu/chi tiết theo dữ liệu |
| Địa điểm cưới | `/vi/nha-hang-tiec-cuoi` | `/nha-hang-tiec-cuoi`, `/nha-hang-tiec-cuoi/[slug]` | Vùng, tỉnh, danh sách địa điểm |
| Đại lý | `/vi/dai-ly-ban-si` | `/dai-ly-ban-si` | Gói, thương hiệu, onboarding |
| Đăng nhập | Modal trên trang public | `/dang-nhap` + modal | Google/Apple/OTP; lỗi và callback |
| Thiệp của tôi | URL private chưa xác minh | `/dashboard` | Rỗng, draft, trial, paid, khóa |
| Editor | URL private chưa xác minh | `/editor/[id]` | Form, preview, lưu, đổi mẫu, publish |
| Khách mời | URL private chưa xác minh | `/dashboard/invitations/[id]/guests` | Danh sách, tổng quan, lời chúc |
| Thanh toán | URL private chưa xác minh | `/dashboard/invitations/[id]/billing` | Quote, mã giảm, chờ, thành công/lỗi |
| Thiệp thật | Pattern chưa xác minh | `/thiep/[slug]` | Trang public tách khỏi marketing |
| Link cá nhân | Pattern chưa xác minh | `/thiep/[slug]/[guestToken]` | Lời mời và RSVP riêng |
| Người nhà hỗ trợ | Pattern chưa xác minh | `/cong-tac/[token]` | Thêm khách, token hết hiệu lực |
| Quản lý đại lý | URL private chưa xác minh | `/agency` | Credit, khách hàng, brand, tài nguyên |
| Vận hành | Không quan sát | `/admin/...` | Các chức năng R ở mục 10 |
| Pháp lý/hỗ trợ | Các link footer | Route riêng theo nội dung | Bảo mật, điều khoản, hoàn tiền, thanh toán, doanh nghiệp, tranh chấp, hỗ trợ |

Quy tắc R: chỉ một canonical cho mỗi trang; không tạo thêm bản `/vi` index trùng nội dung nếu Site 1 không dùng prefix. Các prefix ngoài phạm vi phải trả 404 theo chính sách dự án. Giữ URL thiệp ổn định khi thay template hoặc chỉnh nội dung. Không lấy tên khách làm định danh duy nhất vì trùng tên và dễ đoán.

## 5. Danh mục tính năng public và tài khoản

### 5.1 Marketing, tìm mẫu, detail

| ID | Yêu cầu | Bằng chứng | Tiêu chí triển khai R |
|---|---|---|---|
| PUB-01 | Header/footer, điều hướng, CTA tạo thiệp | O | Desktop/mobile dùng được, liên kết không cụt |
| PUB-02 | Trang chủ kết nối khám phá mẫu → tạo thiệp | O | CTA giữ template đã chọn khi đi vào editor |
| PUB-03 | Danh mục, preview, tag và bộ sưu tập | O | Metadata độc lập renderer; slug ổn định |
| PUB-04 | Detail gồm nội dung giới thiệu, ảnh, demo, mẫu liên quan | O | Không nhầm detail marketing với demo tương tác |
| PUB-05 | Demo có dữ liệu mẫu đầy đủ | O | Demo không ghi vào dữ liệu thiệp thật |
| PUB-06 | Tìm/lọc/sắp xếp mẫu | R/U | Chỉ khóa behavior sau khảo sát UI; chưa khẳng định tham chiếu có mọi bộ lọc |
| PUB-07 | Chế độ sáng/tối của giao diện quản lý/marketing | O | Không làm đổi bảng màu cố định của thiệp |
| PUB-08 | FAQ, đánh giá, hướng dẫn, hỗ trợ chat/email | O/D | Copy lấy từ catalog; dùng số liệu/đánh giá thật của Site 1 |
| PUB-09 | Cookie settings | O | Lưu lựa chọn, điều khiển analytics tương ứng |

Nguồn quan sát: [Trang chủ](https://chungdoi.com/vi), [thư viện](https://chungdoi.com/vi/mau-thiep), [detail mẫu](https://chungdoi.com/vi/mau-thiep/minimalism-do-dam).

### 5.2 Tài khoản và dashboard

| ID | Yêu cầu | Nhãn | Trạng thái phải thiết kế |
|---|---|---|---|
| AUTH-01 | Đăng nhập Google, Apple, email OTP | O giao diện, U backend | Nhập email, đang gửi, nhập mã, hết hạn, gửi lại, lỗi provider |
| AUTH-02 | Session, đăng xuất, bảo vệ route | R | Hết phiên giữa lúc edit; callback quay đúng trang |
| AUTH-03 | Nhận draft anonymous vào tài khoản | R/U | Không mất nội dung, không claim trùng; xác minh lúc bắt buộc login |
| AUTH-04 | Hồ sơ và tùy chọn tài khoản | R/U | Cần khảo sát trường thực tế; không tự hứa đổi email/xóa tài khoản nếu chưa có |
| DASH-01 | Thiệp của tôi, tiếp tục chỉnh sửa | D | Chưa có thiệp, đang tải, load lỗi, nhiều thiệp |
| DASH-02 | Tạo thêm, nhân bản | D | Copy nội dung; khách mới bắt đầu rỗng; không copy quyền thanh toán |
| DASH-03 | Xem trạng thái, chia sẻ, thanh toán, mở trang khách | D | Mỗi thao tác tác động đúng invitation ID |
| DASH-04 | Xóa/lưu trữ/khôi phục thiệp | R/U | Chưa xác minh tham chiếu; nếu bổ sung cần chính sách dữ liệu và link public |

Nguồn D: [Hướng dẫn tạo thiệp](https://chungdoi.com/vi/help/cach-tao-thiep-cuoi-online), [nâng cấp](https://chungdoi.com/vi/help/cach-nang-cap-goi). Vị trí từng nút dashboard và quy tắc tạo thêm cần đối chiếu bằng tài khoản thật.

## 6. Editor và dữ liệu thiệp

### 6.1 Hành vi nền tảng

- **D:** editor có form và preview; đổi mẫu giữ nội dung. **R:** dùng chung renderer giữa preview, demo và thiệp public để tránh ba bản thiết kế bị lệch nhau.
- **D:** upload nhiều ảnh, đổi thứ tự album; tắt section không xóa nội dung. **R:** lưu `enabled` tách khỏi dữ liệu, upload có trạng thái và retry. [Media và section](https://chungdoi.com/vi/help/tuy-chinh-anh-nhac-va-cac-phan)
- **R/U:** cơ chế autosave, debounce, lưu thủ công, undo và lịch sử chưa xác minh. Tối thiểu phải có trạng thái chưa lưu/đang lưu/đã lưu/lỗi và cảnh báo rời trang khi có nguy cơ mất dữ liệu.
- **R:** revision check ngăn tab cũ ghi đè tab mới; validate server và client; lỗi gắn đúng trường; preview lỗi không làm hỏng form.
- **D:** template quyết định màu và hình trang trí. **R:** phần dữ liệu người dùng không chứa CSS tùy ý. [Đổi mẫu](https://chungdoi.com/vi/help/cach-doi-mau-thiep)

### 6.2 Hợp đồng dữ liệu đề xuất R

Bảng dưới là schema dựng mới, không phải danh sách field backend đã trích xuất. Mỗi field phải được ánh xạ lại với editor tham chiếu trước khi chốt fidelity chức năng.

| Nhóm | Dữ liệu cần biểu diễn | Quy tắc đề xuất |
|---|---|---|
| Định danh | ID, ownerId, slug, templateId, schemaVersion, revision | ID bất biến, slug unique; không suy quyền từ URL |
| Cặp đôi | Tên đầy đủ, tên hiển thị ngắn, vai vế trong gia đình | Unicode; tên ngắn có thể chỉnh; không cắt sai tên kép |
| Gia đình | Cha/mẹ từng bên, nhãn xưng hô, địa chỉ | Cho phép bỏ trường riêng lẻ, không sinh dấu phân cách rỗng |
| Phong bì | Lời chào, người nhận mặc định, lời mời, ảnh cover | Guest override chỉ thay phần dành cho người nhận |
| Lễ | Danh sách tên lễ, ngày, giờ; lời thông báo chung | Không tự thêm nhiều bản đồ riêng nếu chưa xác minh |
| Tiệc | Ngày, giờ đón khách, giờ bắt đầu, venue, địa chỉ, map reference | Timezone tường minh; địa chỉ text vẫn có khi map lỗi |
| Ngày tháng | Ngày dương, cách hiển thị ngày âm, timezone | Tính lịch âm theo quy tắc được test; không dùng giờ UTC để đổi ngày địa phương |
| Timeline | ID mục, giờ, tiêu đề, iconKey, thứ tự, bật/tắt | Icon thuộc bộ artwork template; không cố định số mốc |
| Dress code | Tiêu đề, mô tả, danh sách màu | Màu có nhãn văn bản; không nhập nhằng với đổi theme |
| Album | Asset ID, thứ tự, alt, focal point nếu hỗ trợ | Không nhúng base64 vào JSON; bảo toàn bản gốc |
| Story/video | Bật/tắt, các mốc/câu chuyện, video hoặc embed hợp lệ | D tính năng giới thiệu; U widget editor và dạng URL được hỗ trợ |
| Nhạc | Track ID, bật/tắt | Không coi autoplay thành công là điều kiện mở thiệp |
| RSVP | Bật/tắt, giới hạn số người, câu hỏi, thông điệp sau gửi | Client và server dùng cùng định nghĩa số người |
| Sổ lưu bút | Bật/tắt, tiêu đề; lời chúc lưu entity riêng | Phân biệt dữ liệu mẫu và nội dung khách thật |
| Mừng cưới | Bật/tắt, các bên nhận, bank code, account, account name, QR asset | Bảo toàn chuỗi có số 0 đầu; không lấy dữ liệu demo làm mặc định thật |
| Cảm ơn | Nội dung, ảnh nếu template dùng | Ẩn sạch phần vắng dữ liệu |
| Ngôn ngữ | Ngôn ngữ chính, thứ tự, bản dịch từng trường | Tách UI locale và nội dung thiệp |
| Chia sẻ | Tiêu đề, mô tả, ảnh OG, link công khai | Cache được cập nhật khi đổi nội dung |
| Xuất bản | publicationStatus, publishedAt | Tách khỏi entitlement/trạng thái thanh toán |
| Thương hiệu | Brand profile được phép áp dụng | Chỉ đại lý có quyền mới thay footer/support |

Nguồn định hướng dữ liệu: [Hướng dẫn sản phẩm](https://chungdoi.com/vi/tao-thiep-cuoi-online). Phần đa ngôn ngữ của tham chiếu có thể hiện nhiều ngôn ngữ cùng lúc; đây là dữ liệu của thiệp, độc lập menu website. [Ngôn ngữ](https://chungdoi.com/vi/help/ngon-ngu-tren-chungdoi)

## 7. Renderer thiệp và yêu cầu UI/assets 1:1

### 7.1 Ba bề mặt phải phân biệt

1. **Detail marketing:** ảnh preview, giới thiệu, FAQ, CTA của một mẫu.
2. **Demo:** nội dung mẫu, phong bì và toàn bộ trải nghiệm tương tác của mẫu.
3. **Thiệp thật:** cùng thiết kế, thay bằng nội dung người dùng, dữ liệu khách, các phần bật/tắt và trạng thái xuất bản.

Không dùng screenshot dài làm toàn bộ thiệp: chữ cần tùy chỉnh, nút phải hoạt động, layout phải đáp ứng mobile và dữ liệu dài/ngắn.

### 7.2 Inventory mẫu chuẩn Minimalism Đỏ Đậm

**O:** trình tự nội dung quan sát trên demo sau khi mở:

| Section | Dữ liệu/chức năng | Trạng thái cần kiểm tra khi triển khai |
|---|---|---|
| Cover đóng | Tên, ngày, lời mời, thao tác mở | Đóng, đang mở, đã mở, truy cập trực tiếp trạng thái mở |
| Mở đầu | Tên cặp đôi, artwork và ảnh | Font tải xong, ảnh crop đúng, tên dài |
| Thông tin lễ | Hai gia đình, tên/vai vế, ngày giờ và ngày âm | Thiếu cha/mẹ, nhiều lễ, nội dung dài |
| Album | Ảnh, trước/sau, chọn ảnh | 0/1/nhiều ảnh, lightbox, vuốt, ảnh lỗi |
| Thông tin tiệc | Ngày giờ, đón khách/khai tiệc, lịch tháng | Đúng ô ngày, qua tháng/năm, timezone |
| Lịch và RSVP | Link thêm lịch, nút RSVP | Link đúng giờ; modal mở/đóng, validation |
| Địa điểm | Địa chỉ, map, chỉ đường | Map chậm/bị chặn; link vẫn hoạt động |
| Dress code | Hướng dẫn trang phục | Không chỉ dựa vào màu để truyền thông tin |
| Timeline | Các mốc giờ và hoạt động | Số mốc thay đổi, nhãn dài |
| Sổ lưu bút | Tên, nội dung, nút AI, gửi, danh sách | Loading/rỗng/có dữ liệu/lỗi/gửi trùng |
| Hộp quà | Artwork mở hộp; thông tin hai bên, QR, lưu QR | 0/1/2 bên, modal dài, QR load lỗi |
| Kết thúc | Lời cảm ơn, footer thương hiệu | Không đè lên control nổi |
| Control nổi | Nhạc và chat hỗ trợ | Bật/tắt, mobile safe area |

Nguồn O: [Demo đang mở](https://chungdoi.com/vi/mau-thiep/minimalism-do-dam/demo?open=1). Đếm ngược được trang detail mô tả nhưng không xuất hiện rõ trong cây nội dung đã đọc; cần kiểm tra với ngày tương lai. Không ép mọi mẫu có cùng trình tự hoặc cùng kiểu album.

### 7.3 Quy trình thu hồi asset từ website còn hoạt động — R

1. Chốt danh mục mẫu từ link thực tế; lưu ngày khảo sát, URL detail, demo và tình trạng truy cập.
2. Mở cover, nội dung, album, RSVP, lời chúc, gift và footer của từng mẫu. Cuộn hết trang để các asset lazy-load xuất hiện.
3. Thu thập các tài nguyên phục vụ trang: ảnh nền, ảnh ghép, ảnh trong `srcset`, CSS background, SVG, mask, texture, seal, ribbon, font, icon, audio, video/poster.
4. Phân biệt tài nguyên trang trí cố định với ảnh/nội dung khách hàng thay được. Cùng màu chưa đủ chứng minh dùng chung asset.
5. Lưu bản asset phục vụ được từ website vào kho của Site 1, ghi nguồn/quyền sử dụng, hash và kích thước; không phụ thuộc hotlink trong bản production.
6. Nếu chỉ còn bản tối ưu nhỏ thì ghi độ phân giải thực tế; không gọi đó là file thiết kế gốc. File không truy cập được phải đánh dấu missing, không tự vẽ thay rồi ghi đã giống.
7. Lập screenshot theo viewport và tương tác; đo font, khoảng cách, crop, containing block, stacking, clipping và animation.
8. Version manifest và các bằng chứng cùng template. Khi Chungdoi thay đổi thiết kế, dùng snapshot đã chốt để quyết định có cập nhật chuẩn không.

**Manifest bắt buộc cho mỗi asset:** `assetId`, `templateId`, `sourceUrl`, `capturedAt`, `localPath`, `sha256`, `mimeType`, `width`, `height`, `bytes`, `role`, `sectionId`, `variant`, `crop/objectFit`, `containingBlock`, `layer/zIndex`, `breakpoint`, `provenance`, `verificationStatus`. Với font bổ sung family/weight/style/unicode coverage; audio/video bổ sung duration.

**Section contract bắt buộc:** section ID; mục đích; dữ liệu bắt buộc/tùy chọn; component owner; asset ID/path chính xác; desktop/tablet/mobile; states; motion; accessibility; bằng chứng; sai khác chưa xử lý.

Không chép offset phần trăm khi chưa biết kích thước phần tử cha. Không thay hộp quà/hoa văn/font bằng bộ generic. Không dùng một renderer chỉ đổi màu cho các họ mẫu có bố cục khác nhau.

### 7.4 Kiến trúc template — R

- `TemplateDefinition`: ID, slug, family, tags, màu, preview, schema version, capabilities, reference URLs.
- `TemplateRenderer`: component của template/family; thứ tự section và wrapper layout riêng.
- `TemplateTokens`: font, màu, khoảng cách, kích thước, breakpoint, motion đã đo.
- `TemplateAssetManifest`: map assets theo section và biến thể.
- `DemoFixture`: nội dung mẫu ổn định; không nhập lẫn với default cho thiệp khách.
- `SharedBehaviors`: RSVP, guestbook, audio, gallery, gift dialog, calendar và map; cho phép skin/layout riêng theo mẫu.
- `TemplateAdapter`: ánh xạ dữ liệu chung vào template; phần không hiển thị vẫn được giữ khi đổi mẫu.

Đổi mẫu chỉ cập nhật lựa chọn thiết kế, không thay owner, slug, guest links, album, lời chúc, phản hồi hay quyền đã thanh toán.

## 8. Khách mời, RSVP, lời chúc, chia sẻ và thanh toán

### 8.1 Khách mời — D và thiết kế R

Tham chiếu mô tả ba khu vực danh sách/tổng quan/lời chúc; thêm lẻ hoặc CSV; nhóm; câu hỏi; lọc/sắp xếp; thao tác hàng loạt; link riêng; xuất dữ liệu. Batch import tối đa 1.000, có preview và xử lý trùng. [Hướng dẫn khách mời](https://chungdoi.com/help/guest-manager-guide)

Các yêu cầu implementation R:

| ID | Chức năng | Điều kiện nghiệm thu |
|---|---|---|
| GST-01 | CRUD khách theo thiệp | Tên Unicode, tên trùng không làm đụng định danh |
| GST-02 | Nhóm nhiều-nhiều | Sửa nhóm không làm mất hồ sơ hoặc RSVP |
| GST-03 | Import CSV/dán danh sách | Preview số hợp lệ/lỗi/trùng trước commit; giao dịch không nhập nửa chừng |
| GST-04 | Filter/search/sort/pagination | Giữ trạng thái, tổng và selection khớp filter |
| GST-05 | Bulk edit/delete | Rõ phạm vi trang hay toàn kết quả; không đổi tên mọi người thành một tên |
| GST-06 | Link cá nhân, copy, preview, native share | Chào đúng khách; link ổn định sau đổi mẫu |
| GST-07 | Chi tiết khách | Tách lượt mở, RSVP, số người và câu trả lời |
| GST-08 | Export | Unicode Excel đúng, chống CSV formula injection, không rò tenant khác |
| GST-09 | Helper link | Token giới hạn thiệp và quyền, có rotation/revoke |
| GST-10 | Tổng quan | Tính từ dữ liệu thật; không gán lượt xem thành xác nhận |

**D:** link hỗ trợ cho phép người nhà thêm khách mà không đăng nhập bằng chủ thiệp; tạo link mới thay link cũ. **R:** log nguồn tạo khách; kiểm tra token đã thu hồi trên server. [Người nhà hỗ trợ](https://chungdoi.com/help/let-family-help-add-guests)

### 8.2 RSVP

- **O:** demo có form tên và lựa chọn tham dự/từ chối, nút gửi ban đầu bị vô hiệu hóa.
- **D:** có giới hạn số người và câu hỏi bổ sung; link cá nhân gắn phản hồi vào khách. [RSVP](https://chungdoi.com/vi/help/xac-nhan-tham-du-hoat-dong-the-nao)
- **R:** xác định `partySize` có bao gồm người được mời hay không và thống nhất từ form đến báo cáo. Người từ chối không làm tăng số suất ăn.
- **R:** dùng request ID/idempotency để double click không tạo hai phản hồi; cập nhật phản hồi có policy rõ ràng, không nhận guest ID tùy ý từ client.
- **R:** câu hỏi có ID bền vững; chỉnh label không làm mất answer; xóa câu hỏi cần quyết định lưu lịch sử hay xóa theo tham chiếu.
- **U:** kiểm tra policy gửi lại, sửa phản hồi, link chung, RSVP sau hết trial và nội dung màn thành công.

### 8.3 Lời chúc và quà mừng

- **O/D:** form lời chúc, nút gợi ý AI và danh sách; chủ thiệp quản lý lời chúc. **R:** giới hạn độ dài, chống HTML/script, rate limit; không tự gửi nội dung do AI tạo.
- **O:** hộp quà mở thông tin và QR hai bên, có thao tác lưu QR. **R:** QR và thông tin tài khoản phải cùng một nguồn dữ liệu, test đúng người nhận; cho phép tắt phần này hoàn toàn.
- **R:** phân biệt QR chuyển khoản mừng cưới với QR thanh toán dịch vụ Site 1. Hai luồng không dùng chung tài khoản thụ hưởng hay trạng thái order.
- **U:** chưa thử lưu QR, gửi lời chúc và tạo lời chúc AI end-to-end.

Nguồn: [Demo](https://chungdoi.com/vi/mau-thiep/minimalism-do-dam/demo).

### 8.4 Chia sẻ và tracking — R, được định hướng bởi D

- Link chung và cá nhân; copy có phản hồi; Web Share có fallback; QR dẫn đúng canonical.
- OG image/title/description phù hợp thiệp, hỗ trợ ảnh preview trong ứng dụng chat. Không nhét dữ liệu riêng của khách vào metadata có thể bị index ngoài ý muốn.
- Ghi nhận open event theo định nghĩa sản phẩm; tách bot preview, refresh và lượt truy cập thật nếu chúng ảnh hưởng hạn mức.
- Không dùng analytics như bằng chứng tuyệt đối ai đã đọc; chỉ trình bày đúng sự kiện thu được.
- Calendar: URL Google và file ICS cho hệ sinh thái khác; encode text, timezone và khoảng thời gian đúng.

### 8.5 Thanh toán và xuất ảnh/video

**D:** nâng cấp gắn với từng thiệp; có mã giảm giá và xuất ảnh/MP4 trả phí. [Nâng cấp](https://chungdoi.com/vi/help/cach-nang-cap-goi)

**Thiết kế R:**

1. Server tạo quote gồm thiệp, currency, amount, discount, expiresAt; frontend chỉ hiển thị.
2. Tạo order/idempotency key; điều hướng checkout hoặc QR tùy provider đã xác minh.
3. Trang kết quả chỉ hiển thị trạng thái; webhook hoặc đối soát server mới cấp entitlement.
4. Kiểm tra chữ ký, order, amount/currency; deduplicate event; transaction bảo đảm chỉ kích hoạt một lần.
5. Xử lý pending, paid, expired, failed, refunded; tiền đến chậm cần reconciliation.
6. Export media chạy bằng job queue, có progress, lỗi/retry, timeout, dọn file tạm; URL tải có thời hạn.
7. Worker export sử dụng renderer và asset version đã chốt; hỗ trợ font/nhạc, giới hạn thời lượng/kích thước theo cấu hình được duyệt.

Không giả lập thanh toán thành công bằng query string; không chạy render video nặng trong request web đồng bộ. Định dạng ảnh, độ phân giải MP4, watermark và thời gian xử lý là U cần khảo sát.

## 9. Công cụ và nội dung phụ trợ

Trang công cụ hiện liệt kê **14 công cụ**. Danh sách dưới ghi tên năng lực D và hướng implementation R; chưa test từng công cụ. [Nguồn](https://chungdoi.com/vi/cong-cu)

| # | Công cụ | Hướng implementation R |
|---|---|---|
| 1 | Kế hoạch cưới 12 tháng | Checklist theo ngày cưới, tiến độ, export bản in |
| 2 | Bài phát biểu | Form ngữ cảnh, sinh bản nháp, sửa và xuất |
| 3 | Tin nhắn mời cưới | Dữ liệu cặp đôi/khách, giọng điệu, copy kết quả |
| 4 | Lời chúc | Mẫu và tùy biến, không tự gửi tới người nhận |
| 5 | Đổi ngày âm/dương | Hàm lịch độc lập, kiểm thử múi giờ và tháng nhuận |
| 6 | Dự trù chi phí | Dòng chi phí, tính tổng, lưu/chia sẻ có chủ ý |
| 7 | Danh sách khách độc lập | Lưu local và export; không nhầm guest manager tài khoản |
| 8 | Nén ảnh | Pipeline browser, progress, file đầu ra |
| 9 | Nén video | Worker browser, giới hạn tài nguyên, cancel |
| 10 | Xóa nền ảnh | Model browser và fallback khi thiết bị thiếu bộ nhớ |
| 11 | Đổi kích thước ảnh | Preset, khóa tỷ lệ, xử lý nhiều file |
| 12 | Tạo ảnh báo hỷ | Renderer ảnh với font/artwork của template |
| 13 | Tạo QR | Encoding đúng, tải vector/raster |
| 14 | Trang báo hỷ | Loại nội dung riêng, chuyển thành thiệp đầy đủ |

**R:** mỗi công cụ có validation, empty/loading/error/success, reset và tải kết quả. Không mặc định upload file lên server khi giao diện hứa xử lý trên thiết bị. AI cần quota, timeout, kiểm soát chi phí và thông báo cách xử lý dữ liệu.

### Nội dung SEO và hỗ trợ

- **D/O:** blog, help, bộ sưu tập, đánh giá, đối tác và địa điểm cưới. [Help](https://chungdoi.com/vi/help), [đối tác](https://chungdoi.com/vi/doi-tac)
- **R:** nội dung lưu dạng structured data/MDX hoặc CMS; có slug, title, description, cover, author, publishedAt, updatedAt, category, related IDs và redirects.
- **R:** sitemap chỉ chứa public canonical; robots/noindex cho private, preview và token routes; structured data chỉ mô tả thông tin thật đang hiển thị.
- **R:** ảnh OG, breadcrumb, 404, nội dung không tồn tại, tìm kiếm không kết quả và link đã đổi cần đầy đủ.
- **D:** danh bạ nhà hàng chia địa phương và dựa trên thống kê tổng hợp. **R:** Site 1 phải có dữ liệu hợp lệ của riêng mình; không dùng số liệu tham chiếu làm thành tích của sản phẩm mới. [Nhà hàng](https://chungdoi.com/vi/nha-hang-tiec-cuoi)
- **U:** cần inventory riêng các bài, danh bạ và mọi route SEO; khảo sát này chưa phải full sitemap export.

## 10. Đại lý và vận hành

**D:** tham chiếu có mua gói thiệp, credit, thương hiệu ở footer/chat, quản lý khách hàng và tài nguyên bán hàng. [Đại lý](https://chungdoi.com/vi/dai-ly-ban-si)

**R — phân hệ đại lý:** brand profile; bảng khách được ủy quyền; cấp credit theo payment; debit credit khi kích hoạt đúng quy tắc; ledger bất biến; log hành động hỗ trợ; không chia sẻ session/mật khẩu để đăng nhập hộ. Quy trình impersonation nếu có phải thể hiện ai đang thao tác và chặn thao tác ngoài quyền được cấp.

**R — phân hệ vận hành tối thiểu:**

- Tra cứu người dùng/thiệp/order bằng định danh; không cần xem media hoặc tài khoản ngân hàng để xử lý mọi ticket.
- Quản lý template, trạng thái hiển thị, asset version và demo fixture.
- Quản lý nội dung/help/SEO, metadata và redirects.
- Đối soát payment, refund theo policy, sửa sai có lý do và audit trail.
- Moderation lời chúc, xử lý lạm dụng, khoá nội dung theo quyền.
- Theo dõi export job, upload lỗi, webhook lỗi, queue backlog và quota AI.
- Health, logs, cảnh báo, backup/restore; không log OTP, token, account number hoặc toàn bộ nội dung thiệp.

Giao diện admin nội bộ Chungdoi không quan sát được. Các mục này là nhu cầu vận hành Site 1, không phải mô tả admin đã sao chép.

## 11. Kiến trúc và cấu trúc dự án đề xuất

### 11.1 Công nghệ và ranh giới

**R:** có thể chọn Next.js App Router + React + TypeScript strict, Tailwind và Radix/shadcn cho shell/editor; CSS template riêng để đạt fidelity. Dùng next-intl cho catalog tiếng Việt. Đây là lựa chọn để dựng Site 1, không phải kết luận stack của Chungdoi.

Database quan hệ + ORM; PostgreSQL phù hợp nếu có nhiều writer/worker. SQLite có thể dùng cho một instance với tải phù hợp và backup được test. Chốt một backend production, không giả định chuyển qua lại mà không có migration. Media đặt trong storage bền vững, export có worker riêng; payment/email/AI đi qua adapter server.

```text
Browser
  ├─ Marketing / thư viện / detail
  ├─ Editor / dashboard / khách mời
  └─ Invitation renderer / RSVP / lời chúc
          │
          ▼
Web application + API
  ├─ Auth & authorization
  ├─ Invitation domain + validation
  ├─ Guest / RSVP / wishes
  ├─ Billing / entitlements / agency
  └─ Media / export / AI adapters
          │
          ├─ Database
          ├─ Asset & upload storage → CDN
          ├─ Job queue → export worker
          └─ Email / payment / map / AI providers
```

### 11.2 Cây thư mục

```text
site-1/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx
│   │   │   ├── mau-thiep/[slug]/page.tsx
│   │   │   ├── mau-thiep/bo-suu-tap/[slug]/page.tsx
│   │   │   ├── bang-gia/
│   │   │   ├── tao-thiep-cuoi-online/
│   │   │   ├── blog/[slug]/
│   │   │   ├── help/[slug]/
│   │   │   ├── cong-cu/[slug]/
│   │   │   ├── doi-tac/
│   │   │   ├── nha-hang-tiec-cuoi/[slug]/
│   │   │   ├── dai-ly-ban-si/
│   │   │   └── (policies)/
│   │   ├── (auth)/dang-nhap/
│   │   ├── (account)/dashboard/
│   │   ├── (account)/editor/[id]/
│   │   ├── (account)/agency/
│   │   ├── (invitation)/mau-thiep/[slug]/demo/
│   │   ├── (invitation)/thiep/[slug]/
│   │   ├── (invitation)/thiep/[slug]/[guestToken]/
│   │   ├── cong-tac/[token]/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── features/
│   │   ├── auth/
│   │   ├── invitations/{schemas,services,repositories}/
│   │   ├── editor/{fields,panels,state}/
│   │   ├── guests/
│   │   ├── rsvp/
│   │   ├── wishes/
│   │   ├── billing/
│   │   ├── media/
│   │   ├── exports/
│   │   ├── agency/
│   │   └── tools/
│   ├── templates/
│   │   ├── registry.ts
│   │   ├── contracts.ts
│   │   ├── shared/{behaviors,components}/
│   │   └── minimalism-do-dam/
│   │       ├── definition.ts
│   │       ├── Renderer.tsx
│   │       ├── sections/
│   │       ├── styles.css
│   │       ├── assets.manifest.json
│   │       └── demo.fixture.ts
│   ├── components/{ui,marketing,layout}/
│   ├── content/{blog,help,collections,policies}/
│   ├── i18n/
│   ├── lib/{db,storage,queue,email,payment,ai,security}/
│   └── types/
├── messages/vi.json
├── public/templates/[templateId]/
├── public/shared/{fonts,icons,music}/
├── prisma/{schema.prisma,migrations}/
├── workers/export/
├── scripts/{seed,backup,restore,verify-assets}/
├── tests/{unit,integration,e2e,visual}/
├── docs/
│   ├── rebuild-spec.md
│   ├── route-inventory.md
│   ├── feature-evidence.md
│   ├── architecture/
│   └── templates/[templateId]/{spec.md,evidence/}
├── Dockerfile
├── compose.yaml
├── .env.example
└── package.json
```

Route groups là tổ chức nội bộ, không xuất hiện trong URL. Không để demo kế thừa header/footer marketing. Upload thật không ghi vào git hoặc filesystem tạm của container. Đọc tài liệu đúng phiên bản framework trước khi dùng API chưa có pattern trong dự án mới.

### 11.3 Nguyên tắc module

- UI gọi service/domain qua boundary rõ ràng; component không tự quyết ownership hoặc giá.
- Server trả DTO công khai riêng, không serialize nguyên bản record chứa thông tin quản trị.
- Template không gọi payment/database; nhận dữ liệu đã chuẩn hóa và capability được cấp.
- Mọi schema nội dung có version và migration; cập nhật template không phá thiệp đã trả phí.
- Không tạo một file editor hoặc renderer chứa tất cả mẫu; chia field, section và family.

## 12. Mô hình dữ liệu đề xuất R

| Entity | Trường cốt lõi / quan hệ |
|---|---|
| User | ID, email chuẩn hóa, displayName, status, timestamps |
| AuthIdentity | userId, provider, providerSubject; unique provider + subject |
| Session / OtpChallenge | Token/code hash, expiry, attempts, revokedAt |
| Invitation | ownerId, slug unique, templateId, content JSON có schemaVersion, revision, publicationStatus |
| InvitationRevision | invitationId, version, snapshot, actorId, createdAt |
| Entitlement | invitationId, source order/credit, trial timestamps, limits, activatedAt |
| Asset | ownerId, storageKey, hash, MIME, dimensions, bytes, processing status |
| InvitationAsset | invitationId, assetId, role, order, focal point |
| Guest | invitationId, displayName, greeting/message override, token hash, source |
| GuestGroup / GuestGroupMember | Nhóm scoped theo thiệp, quan hệ nhiều-nhiều |
| RsvpQuestion / GuestQuestion | Câu hỏi, type, translations, guest assignment |
| RsvpResponse / RsvpAnswer | guestId, attendance, partySize, questionId, typed value, timestamps |
| Wish | invitationId, guestId optional, displayName, message, moderation status |
| OpenEvent / OpenAggregate | invitationId, guestId optional, event time, phân loại/dedupe |
| HelperAccess | invitationId, token hash, scope, expiry/revokedAt |
| Order / PaymentEvent | amount nguyên đơn vị nhỏ, currency, provider IDs, status, idempotency |
| Discount | Code, hiệu lực, giới hạn dùng, rule snapshot |
| ExportJob | invitationId, revision, format, state, outputKey, expiresAt, error |
| AgencyProfile / AgencyCustomer | Brand và quan hệ được ủy quyền |
| CreditLedger | Đại lý, delta, reason, order/invitation ref, idempotency |
| AuditLog | Actor, action, target, timestamp, metadata đã lọc |
| ContentEntry / Venue / Partner | Nội dung public, trạng thái xuất bản, provenance |

Ràng buộc: query luôn scoped theo owner/thiệp; unique token và slug; foreign keys; transaction cho claim draft/import/payment/credit. Không lưu token thô nếu có thể xác thực bằng hash. Không tạo bảng riêng cho từng template.

Nếu database cũ cũng mất, không thể khôi phục người dùng, lịch sử giao dịch và RSVP từ vài trang public. Phải phân biệt **dựng lại tính năng** với **khôi phục dữ liệu cũ**. Không hứa giữ URL cũ nếu không còn mapping và không kiểm soát domain cũ.

## 13. API/hợp đồng server đề xuất R

Tên endpoint không phải endpoint đã phát hiện của Chungdoi. Có thể dùng server action nội bộ, nhưng quyền và schema vẫn phải tương đương bảng này.

| Nhóm | Endpoint ví dụ | Quyền / chú ý |
|---|---|---|
| Auth | `POST /api/auth/otp/request`, `/verify`, `/logout`; OAuth callback | Rate limit, TTL, replay protection, state/nonce |
| Templates | `GET /api/templates`, `/api/templates/:slug` | Chỉ metadata public, cache theo version |
| Invitations | `GET/POST /api/invitations`; `GET/PATCH /api/invitations/:id` | Owner; PATCH kèm revision |
| Workflow | `POST /api/invitations/:id/publish`, `/duplicate`, `/change-template` | Owner; validate nội dung, không cấp paid khi duplicate |
| Upload | `POST /api/uploads/init`, `/complete`; `DELETE /api/uploads/:id` | MIME/size/ownership; không xóa asset đang dùng |
| Guests | `/api/invitations/:id/guests`, `/import`, `/bulk`, `/export` | Owner; preview import và commit tách rõ |
| Groups/questions | `/api/invitations/:id/groups`, `/questions` | Scope theo thiệp; kiểm tra dữ liệu liên quan |
| Helper | `/api/invitations/:id/helper-access`; `POST /api/helpers/:token/guests` | Owner tạo; token chỉ thêm khách |
| Public invitation | `GET /api/public/invitations/:slug` | Publication + entitlement; public DTO |
| Public RSVP | `POST /api/public/invitations/:slug/rsvp` | Token hợp lệ nếu cá nhân; rate limit/idempotency |
| Wishes | `GET/POST /api/public/invitations/:slug/wishes` | Sanitize; moderation theo owner ở endpoint riêng |
| Tracking | `POST /api/public/invitations/:slug/open` | Dedupe; không tin guest ID tự gửi |
| Calendar / QR / OG | Public resource tương ứng | Không lộ draft/secret; cache key đúng |
| Billing | `POST /api/invitations/:id/checkout`; `GET /api/orders/:id` | Owner; server quote |
| Webhooks | `POST /api/webhooks/payments/:provider` | Chữ ký, amount/currency, replay và reconciliation |
| Export | `POST /api/invitations/:id/exports`; `GET /api/exports/:id` | Owner + entitlement, signed download |
| AI | `POST /api/tools/generate` | Validation, quota, timeout; không lộ API key |

Chuẩn R: response lỗi có `code`, `messageKey`, `fieldErrors`, `requestId`; 401/403/404/409/422/429 có ý nghĩa nhất quán. Không biến lỗi lưu thành toast thành công. Pagination và giới hạn payload cho mọi danh sách.

## 14. Luồng nghiệp vụ và trạng thái

### Luồng A — tạo và xuất bản

Chọn mẫu → mở editor → nhập dữ liệu → upload → preview → lưu/nhận draft vào tài khoản theo luồng được xác minh → validate → publish → nhận link/QR → quản lý khách.

**R:** lỗi ở mỗi bước không làm mất dữ liệu bước trước. Publish phải thực hiện nguyên tử; bấm hai lần không tạo hai slug/trial. Demo không được dùng cùng ID với draft thật.

### Luồng B — đổi mẫu sau khi đã chia sẻ

Mở thiệp → chọn template khác → preview dữ liệu hiện tại → lưu → invalidate cache public/OG cần thiết. Guest URL và phản hồi cũ còn nguyên. **D:** giữ nội dung khi đổi mẫu. [Nguồn](https://chungdoi.com/vi/help/cach-doi-mau-thiep)

### Luồng C — khách xác nhận

Link chung/cá nhân → kiểm tra quyền xem → phong bì → mở thiệp → RSVP → validate → ghi dữ liệu → phản hồi thành công → dashboard nhận kết quả.

**R:** lỗi mạng cho phép retry an toàn; không tăng tổng hai lần. Khách chỉ xem thông tin liên quan mình; không tải toàn bộ danh sách khách về browser.

### Luồng D — nâng cấp

Chọn đúng thiệp → quote → mã giảm nếu có → order → provider → callback hiển thị pending → webhook xác nhận → entitlement paid → public hoạt động và mở export.

### Tách trạng thái — R

```text
publication: draft → published
entitlement: trial_active → trial_expired / trial_limit_reached → paid
order: pending → paid / failed / expired; paid → refunded (theo policy)
asset: uploading → processing → ready / failed
export: queued → running → completed / failed / expired
guest: pending → attending / declined
```

Không reset trial khi đổi mẫu, sửa ngày cưới hoặc refresh trang. Hết trial không xóa dữ liệu. Chính sách khóa hiển thị, hoàn tiền và dữ liệu sau xóa cần được chốt trước production. Nút gỡ xuất bản không được xem là chức năng parity mặc định.

## 15. Triển khai, cấu hình và bảo toàn hệ thống

Tất cả là R; không phải sơ đồ hạ tầng Chungdoi đã xác minh.

- Một ứng dụng Site 1 trên VPS/container: HTTPS reverse proxy, web process, database, storage và worker. Không hardcode IP cũ hoặc phụ thuộc Site 2.
- CI: lint → typecheck → unit/integration trọng yếu → E2E mục tiêu → build → artifact bất biến → deploy → smoke → rollback nếu lỗi.
- `.env.example`: site URL, DB URL, session secret, OAuth credentials, email provider, storage/CDN, payment/webhook secrets, queue, AI, map config. Chỉ để tên biến/giá trị mẫu, không lưu secret thật.
- Migration có backup trước khi chạy; ưu tiên thay đổi tương thích với phiên bản web đang chạy. Không deploy schema phá phiên bản rollback.
- Database và uploads phải backup cùng mapping; kiểm tra restore vào môi trường trống. Lưu template assets/manifests, fonts, content, migrations, lockfile và runbook độc lập với source chính.
- Thu thập error rate, latency, upload failures, webhook lag, export backlog, dung lượng đĩa và trạng thái backup; alert có người chịu trách nhiệm.
- Rate limit auth/RSVP/wishes/AI/upload; CSRF/origin checks phù hợp; validate URL embed và file; kiểm tra MIME thực, giới hạn decode pixels và không thực thi SVG/upload tùy ý.
- CSP và embed allowlist; session HttpOnly/Secure; token không xuất hiện trong log/analytics; cache public không chứa dữ liệu owner.
- Chốt RPO/RTO theo ngân sách trước launch; thực hiện một lần dựng mới hoàn toàn từ repo, secrets, backup và manifest.

## 16. Kế hoạch triển khai có thể giao việc

| Giai đoạn | Đầu ra bắt buộc | Điều kiện qua giai đoạn |
|---|---|---|
| 0. Khảo sát bổ sung | Full route inventory, khảo sát account/editor, giá/trial, asset manifest và bộ ảnh chuẩn | Các U ảnh hưởng flow lõi được giải quyết hoặc quyết định R được ghi rõ |
| 1. Nền tảng | Repo mới, catalog, schema, auth, storage, CI, layout public/private | Đăng nhập, ownership, lưu draft và upload qua test |
| 2. Một lát cắt hoàn chỉnh | Minimalism Đỏ Đậm từ detail/demo tới thiệp thật | Tạo → sửa → publish → mở → RSVP → quản lý chạy thật; visual pass |
| 3. Billing và chia sẻ | Trial, order/webhook, entitlement, OG/QR, export | Không bypass hạn mức; retry webhook không kích hoạt hai lần |
| 4. Khách mời đầy đủ | Import, nhóm, câu hỏi, helper, bulk, export | Số liệu đúng, token đúng quyền, dữ liệu UTF-8 |
| 5. Toàn bộ mẫu | 61 biến thể đã inventory, từng mẫu có manifest/spec/evidence | Từng mẫu đạt visual + functional checklist; không suy pass theo family |
| 6. Phần mở rộng | Công cụ, nội dung, danh bạ, đa ngôn ngữ thiệp, đại lý | Theo acceptance của từng module; không đánh đồng backlog với đã làm |
| 7. Production | Backup/restore, monitoring, runbook, smoke, rollback | Dựng môi trường sạch thành công và hoàn thành rehearsal |

Giai đoạn 2 là mốc end-to-end đầu tiên, không phải định nghĩa hoàn thành toàn bộ Site 1. Không ước lượng thời gian clone mọi mẫu chỉ từ số lượng slug; độ phức tạp artwork và motion khác nhau.

## 17. Tiêu chí nghiệm thu

### Chức năng

- [ ] Tài khoản A không đọc/sửa/upload/export dữ liệu tài khoản B bằng cách đổi ID.
- [ ] Draft không truy cập công khai; publish mới mở đúng link.
- [ ] Nội dung lưu được qua reload; lỗi mạng không báo lưu giả.
- [ ] Đổi template giữ dữ liệu, URL, khách, RSVP, lời chúc và entitlement.
- [ ] Nhân bản không nhân bản khách, token và quyền đã mua ngoài ý muốn.
- [ ] Tắt/bật section không mất dữ liệu, không để khoảng trắng dư.
- [ ] RSVP đúng khách, đúng party size; submit lại không làm sai tổng.
- [ ] Import có preview; bulk đúng selection; CSV mở đúng dấu tiếng Việt.
- [ ] Helper token không cho sửa thiệp; token cũ bị vô hiệu sau rotation.
- [ ] Thanh toán server xác minh; webhook trùng/sai tiền/sai currency không cấp sai quyền.
- [ ] QR mừng cưới đúng thông tin; QR share và QR billing không bị nhầm.
- [ ] Lịch âm/dương, thứ, tháng và calendar event đúng timezone.
- [ ] Link share, OG, map, nhạc, gallery, export hoạt động trên thiết bị mục tiêu.

### Hình ảnh và assets — bắt buộc cho từng mẫu

- [ ] Viewport chuẩn đề xuất: 390×844, 768×1024, 1440×900; thêm mobile hẹp 360px để stress test.
- [ ] Reference và bản mới cùng viewport, DPR, zoom, dữ liệu, scroll và trạng thái tương tác.
- [ ] Cover đóng, chuyển cảnh, hero, tất cả section, footer và control nổi đã đối chiếu.
- [ ] Album/lightbox, RSVP, guestbook, gift modal và QR đã đối chiếu cả layout và behavior.
- [ ] Font family/weight/glyph tiếng Việt, line-height, wrapping và khoảng cách đúng.
- [ ] Artwork đầy đủ, đúng file, crop, anchor, containing block, layer, opacity và clipping.
- [ ] Không có asset generic thay ngầm hoặc hotlink còn sót trong bản production.
- [ ] Motion đo cả duration/easing/trigger, không chỉ ảnh chụp cuối animation.
- [ ] Visual diff theo section; mask nội dung động có lý do và không che artwork/layout sai.
- [ ] Không coi screenshot similarity score là bằng chứng duy nhất; review thủ công mọi sai khác đáng kể.
- [ ] Mỗi mẫu có biên bản pass/fail và danh sách sai khác; chưa kiểm tra thì ghi chưa kiểm tra.

### Chất lượng và vận hành

- [ ] Lint/typecheck trước, test mục tiêu tiếp theo; build và smoke cuối cùng.
- [ ] Form có label, focus, keyboard, focus trap; hỗ trợ reduced motion.
- [ ] Kiểm tra Chrome/Safari và trình duyệt trong Zalo/Messenger bằng thiết bị phù hợp; không suy từ desktop.
- [ ] Không overflow ngang, nội dung tên dài không che nút, safe area không đè footer.
- [ ] Không lỗi hydration/console nghiêm trọng, request asset 404 hay layout shift do ảnh thiếu kích thước.
- [ ] Kiểm tra upload lớn, ảnh xoay EXIF, ảnh lỗi, nhạc bị chặn và mạng chậm.
- [ ] SEO/canonical/sitemap/noindex đúng; trang token không vô tình public dữ liệu riêng.
- [ ] Backup restore và rollback đã chạy thật; secrets không nằm trong repo/artifact public.

## 18. Danh mục 61 biến thể mẫu quan sát được

Nguồn: link thực tế trong [thư viện tiếng Việt](https://chungdoi.com/vi/mau-thiep), ngày 18/09/2026. Chỉ xác nhận xuất hiện trong catalog, **chưa xác nhận từng demo hoạt động hoặc đã thu đủ assets**. Mỗi slug dưới có detail tham chiếu dạng `https://chungdoi.com/vi/mau-thiep/<slug>`; phải kiểm tra link demo từ detail trước khi đưa vào manifest.

| Họ mẫu | Slug các biến thể |
|---|---|
| Minimalism (6) | `minimalism-do-dam`, `minimalism-nau`, `minimalism-xanh`, `minimalism-do`, `minimalism-lam-dam`, `minimalism-tim` |
| Hoa Lụa (1) | `hoa-lua-nau` |
| Song Hỷ (2) | `song-hy-xanh`, `song-hy-do` |
| Song Long (3) | `song-long-do`, `song-long-xanh`, `song-long-lam` |
| Song Phụng (2) | `song-phung-do`, `song-phung-xanh` |
| Long Phụng (6) | `long-phung-do`, `long-phung-xanh`, `long-phung-lam`, `long-phung-huyen`, `long-phung-v2-do`, `long-phung-v3-do` |
| Hoa Mộc (3) | `hoa-moc-xanh`, `hoa-moc-hong`, `hoa-moc-nau` |
| Vườn Kính (3) | `vuonkinh-xanh`, `vuonkinh-hong`, `vuonkinh-lam` |
| Vườn Xuân (3) | `vuon-xuan-do`, `vuon-xuan-xanh`, `vuon-xuan-lam` |
| Baroque (4) | `hoang-gia-vang`, `baroque-v2-do-dam`, `baroque-v2-lam-dam`, `baroque-v2-xanh-dam` |
| Hoàng Kim (5) | `hoang-kim-do`, `hoang-kim-lam`, `hoang-kim-xanh`, `hoang-kim-ii-xanh`, `hoang-kim-ii-tim` |
| Lâu Đài (2) | `lau-dai-xanh`, `lau-dai-lam` |
| Bạch Sứ (6) | `bach-su-lam`, `bach-su-nau`, `bach-su-do`, `bach-su-v2-xanh`, `bach-su-v2-hong`, `bach-su-v2-do` |
| Hoa Thuỷ Tinh (3) | `hoa-thuy-tinh-lam`, `hoa-thuy-tinh-xanh`, `hoa-thuy-tinh-do` |
| Liên Hoa (2) | `lien-hoa-hong`, `lien-hoa-v2-xanh` |
| Mẫu khác (10) | `nhat-binh-do`, `mai-lan-trang`, `thanh-diep-xanh`, `anh-dao-hong`, `chibi-red`, `hoa-tinh-do`, `co-ba-do`, `to-duyen-xanh`, `hoa-kho-cam`, `hoa-huong-duong` |

Các nhóm trên là nhóm tên để kiểm kê, chưa chứng minh chúng có cùng renderer. Khi tạo registry phải xác định `family` theo khảo sát thực tế. Tên hiển thị và slug có thể khác nhau, ví dụ Baroque Vàng dùng slug `hoang-gia-vang`; không tự suy slug từ tên.

## 19. Các việc còn phải xác minh trước khi implementation được gọi là đầy đủ

1. Toàn bộ editor: field, defaults, toggle, validation, save behavior, crop và preview.
2. Anonymous draft, thời điểm login bắt buộc, OTP/OAuth, khôi phục phiên.
3. Dashboard thật: tạo mới/nhân bản/xóa, điều kiện tạo thêm, settings và thứ tự thao tác.
4. Trial: thời điểm bắt đầu, hạn dùng, đơn vị hạn mức, giao diện khi khóa.
5. Giá theo thị trường, discount, payment provider, thuế, refund và đối soát.
6. RSVP submit/update thành công, dữ liệu link chung, câu hỏi, giới hạn party size.
7. Export ảnh/MP4: cấu hình, file thật, nhạc, chất lượng và quyền tải.
8. Tất cả 61 demo ở desktop/tablet/mobile và mọi modal; assets thực tế từng section.
9. Toàn bộ route/blog/help/tools/đối tác/pháp lý; không chỉ các trang đã mở.
10. Đại lý sau login, credit consumption, cấp quyền khách và tài nguyên bán hàng.
11. Danh sách ngôn ngữ thiệp thực sự cần cho Site 1, tách khỏi UI tiếng Việt.
12. Nội dung hoặc dữ liệu lịch sử muốn di chuyển: chỉ phục hồi khi có nguồn hợp lệ.

**Kết quả của tài liệu:** đủ để chia module, thiết kế nền tảng, lập backlog và bắt đầu dựng lại theo từng giai đoạn mà không phụ thuộc source clone cũ. Các nhãn U và bằng chứng còn thiếu phải được giải quyết trong giai đoạn khảo sát tương ứng; tài liệu này không thay thế manifest assets hay biên bản nghiệm thu 1:1 của từng mẫu.
