# Thiết kế luồng Admin hỗ trợ thiệp của người dùng

**Ngày:** 2026-08-13
**Trạng thái:** Đã được người dùng duyệt
**Phạm vi:** Cho mọi Admin xem thiệp của từng người dùng, tạo và chỉnh sửa thiệp thay người dùng, xuất bản thiệp, đặt giá cuối cùng hoặc tặng miễn phí, đồng thời lưu audit log tự động.

## 1. Mục tiêu

Bổ sung một luồng hỗ trợ khách hàng trong khu vực `/admin` để mọi tài khoản `Admin` có thể:

- Tìm và mở hồ sơ của một người dùng.
- Xem toàn bộ thiệp thật thuộc người dùng đó.
- Xem trước, chỉnh sửa và xuất bản một thiệp thay người dùng.
- Chọn mẫu và tạo thiệp mới thuộc đúng người dùng.
- Đặt giá cuối cùng riêng cho từng thiệp hoặc tặng miễn phí bằng giá `0`.
- Đưa thiệp trở lại cơ chế giá hệ thống.
- Xem lịch sử thao tác, gồm Admin thực hiện, thời gian, người dùng, thiệp và hành động.

Luồng này dùng quyền hỗ trợ Admin riêng. Hệ thống không đăng nhập giả, không thay cookie phiên người dùng và không đổi chủ sở hữu thiệp.

## 2. Quyết định sản phẩm đã duyệt

- Tất cả Admin, không chỉ Super Admin, có toàn bộ quyền trong phạm vi này.
- Ưu đãi áp dụng theo từng thiệp, không phải credit của tài khoản và không phải voucher dùng chung.
- Admin nhập **giá cuối cùng**; `0đ` nghĩa là tặng miễn phí.
- Không bắt Admin nhập lý do.
- Audit log được tạo tự động và phải xác định cụ thể Admin nào thực hiện.
- Chưa gửi email hoặc thông báo riêng cho người dùng; thay đổi xuất hiện ngay trong dashboard và thiệp của họ.
- Thiệp được tặng miễn phí được kích hoạt nhưng không được ghi là đã thanh toán và không làm tăng doanh thu.
- Editor hỗ trợ là đường Admin riêng, không dùng impersonation.

## 3. Phạm vi không thực hiện

- Không xây chức năng đăng nhập hoặc impersonate người dùng.
- Không cấp credit ở cấp tài khoản.
- Không tạo mã voucher riêng cho từng khách.
- Không hỗ trợ giảm theo phần trăm hoặc nhập số tiền giảm; chỉ nhập giá cuối cùng.
- Không gửi email, notification hoặc tin nhắn cho người dùng.
- Không xây hoàn tiền, sửa giao dịch đã thanh toán hoặc thu hồi một khoản đã thanh toán.
- Không lưu version đầy đủ của nội dung thiệp để khôi phục từng bản sửa.
- Không ghi audit cho từng lần gõ/autosave hoặc từng file upload tạm.
- Không thay đổi quyền quản lý khách mời/RSVP trong giai đoạn đầu; Admin hỗ trợ nội dung thiệp qua editor.

## 4. Hiện trạng và vấn đề cần giải quyết

### 4.1. Người dùng và Admin

- `User` và `Admin` là hai model/session độc lập.
- `Admin` có `isSuperAdmin`, nhưng yêu cầu mới cho phép mọi Admin thao tác.
- `/admin/users` hiện chỉ hiển thị email, ngày đăng ký và số thiệp; chưa có trang chi tiết hoặc thao tác.

### 4.2. Quyền sở hữu/editor

- Editor người dùng tại `/editor/[id]` gọi `verifySession()` và `ownInvitation()`.
- Các action lưu, autosave, kiểm tra slug, xuất bản và preview cũng kiểm tra session người dùng.
- `EditorForm` đã có `adminMode`, nhưng mode này đang phục vụ thiệp demo: tắt autosave, dùng action lưu demo và ẩn phần xuất bản. Không thể dùng nguyên trạng cho hỗ trợ khách hàng.
- `/api/upload` đã cho phép cả user session và admin session, nên pipeline upload ảnh có thể được tái sử dụng. Quyền ghi nội dung cuối cùng vẫn phải được kiểm tra ở server action.

### 4.3. Thanh toán

- `Invitation.paid` hiện là boolean quyết định thiệp đã được kích hoạt vĩnh viễn.
- `Payment.status = paid` và webhook đặt `Invitation.paid = true`.
- Giá được tính từ giá sản phẩm đầu tiên hoặc giá khách cũ; voucher chỉ giảm một số tiền cố định.
- Chưa có khái niệm giá riêng hoặc kích hoạt miễn phí do Admin cấp.

Các khái niệm “đã trả tiền” và “được tặng quyền sử dụng” phải được tách ra để doanh thu, giá khách cũ và giao diện không bị sai.

## 5. Kiến trúc được chọn

### 5.1. Tuyến Admin

- `/admin/users`: danh sách và tìm kiếm người dùng.
- `/admin/users/[id]`: hồ sơ hỗ trợ, danh sách thiệp và audit log.
- `/admin/invitations/[id]/edit`: editor hỗ trợ Admin.

`/admin/users/[id]` là điểm vào chính. ID người dùng trên URL chỉ dùng để tải hồ sơ; mọi thao tác trên thiệp phải truy vấn lại thiệp và xác nhận `invitation.userId` khớp người dùng đích khi action nhận cả hai ID.

### 5.2. Không dùng impersonation

Editor hỗ trợ gọi các server action dành riêng cho Admin. Mỗi action bắt đầu bằng `verifyAdmin()`, tự tải thiệp đích từ database và không dựa vào user cookie. Cookie `session` của người dùng hiện tại, nếu có, không được đọc hoặc thay đổi trong luồng này.

### 5.3. Tái sử dụng editor theo mode rõ ràng

Thay cờ boolean `adminMode` bằng ngữ nghĩa editor rõ ràng, ví dụ:

- `owner`: editor người dùng, có autosave và xuất bản.
- `demo-admin`: editor thiệp demo, lưu bản nháp theo hành vi hiện tại.
- `support-admin`: editor hỗ trợ, không autosave, có lưu và xuất bản bằng action Admin.

`EditorForm` nhận các action cần thiết qua props cho mode hỗ trợ, tối thiểu gồm lưu và xuất bản. Các thao tác cần quyền server khác như kiểm tra slug/resolve map phải có action Admin tương ứng hoặc một abstraction access policy được truyền rõ ràng; không nới lỏng action chủ sở hữu để “ai có Admin cookie cũng được” một cách ngầm định.

## 6. Mô hình dữ liệu

### 6.1. Invitation

Thêm vào `Invitation`:

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `adminPriceOverride` | `Int?` | Giá cuối cùng do Admin đặt; `null` dùng giá hệ thống, `0` là miễn phí, số dương là giá phải trả |
| `complimentary` | `Boolean` mặc định `false` | Thiệp được Admin kích hoạt miễn phí |
| `complimentaryAt` | `DateTime?` | Thời điểm cấp miễn phí gần nhất |

Không dùng `paid = true` cho thiệp miễn phí. Quyền sử dụng vĩnh viễn được tính bằng một helper duy nhất, tương đương:

```text
isActivated = invitation.paid || invitation.complimentary
```

Mọi nơi đang dựa trực tiếp vào `paid` để quyết định hết hạn dùng thử, hiển thị CTA thanh toán hoặc gửi nhắc thanh toán phải chuyển sang helper/trạng thái activation này. Giao diện vẫn phân biệt:

- `paid`: Đã thanh toán.
- `complimentary`: Được tặng miễn phí.
- còn lại: Dùng thử/chưa thanh toán.

### 6.2. Audit log

Thêm model `AdminAuditLog` với các trường dự kiến:

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | `String` | CUID |
| `adminId` | `String?` | Quan hệ tới Admin; `SetNull` nếu tài khoản Admin bị xoá |
| `adminEmail` | `String` | Snapshot để vẫn biết người thực hiện sau khi Admin bị xoá |
| `targetUserId` | `String?` | Quan hệ tới User; `SetNull` nếu người dùng bị xoá |
| `targetUserEmail` | `String?` | Snapshot email tại thời điểm thao tác |
| `invitationId` | `String?` | Quan hệ tới Invitation; `SetNull` nếu thiệp bị xoá |
| `action` | `String` | Mã hành động ổn định |
| `details` | `String?` | JSON text có cấu trúc, chỉ chứa metadata cần thiết |
| `createdAt` | `DateTime` | Thời điểm thao tác |

Snapshot email làm audit không mất danh tính khi record liên quan bị xoá. `details` không lưu toàn bộ nội dung nhạy cảm của thiệp; với chỉnh sửa nội dung, chỉ lưu danh sách nhóm/trường thay đổi và các giá trị định danh cần thiết như template, slug hoặc status.

Các action tối thiểu:

- `INVITATION_CREATED_FOR_USER`
- `INVITATION_UPDATED_BY_ADMIN`
- `INVITATION_PUBLISHED_BY_ADMIN`
- `PRICE_OVERRIDE_SET`
- `PRICE_OVERRIDE_CLEARED`
- `COMPLIMENTARY_GRANTED`
- `COMPLIMENTARY_REVOKED`

Audit record và thay đổi nghiệp vụ được ghi trong cùng transaction database. Không có trường lý do và không có input lý do trên UI.

### 6.3. Index

Thêm index phục vụ trang chi tiết và lịch sử:

- `AdminAuditLog(targetUserId, createdAt)`
- `AdminAuditLog(invitationId, createdAt)`
- `AdminAuditLog(adminId, createdAt)`

## 7. Quy tắc giá và kích hoạt

### 7.1. Nguồn giá

Một hàm resolve giá duy nhất nhận thiệp và người dùng:

1. Nếu `adminPriceOverride !== null`, dùng đúng giá này.
2. Nếu không, dùng giá hệ thống hiện hành: giá sản phẩm đầu tiên hoặc giá khách cũ.

Giá override phải là số nguyên VND từ `0` đến một giới hạn hợp lý được validation phía server. Không tin hidden input hoặc giá chuẩn từ client.

### 7.2. Đặt giá dương

Khi Admin đặt giá lớn hơn `0` cho thiệp chưa thanh toán:

- Lưu `adminPriceOverride`.
- Nếu thiệp đang complimentary, bỏ `complimentary` và `complimentaryAt`.
- Vô hiệu hoá mọi payment đang chờ của thiệp.
- Payment mới tiếp theo lấy giá override.
- Ghi audit giá trước/sau và việc thu hồi complimentary nếu có.

### 7.3. Tặng miễn phí

Khi Admin đặt giá `0`:

- Lưu `adminPriceOverride = 0`.
- Đặt `complimentary = true` và `complimentaryAt = now()`.
- Vô hiệu hoá payment đang chờ.
- Không tạo `Payment` giá `0` và không đặt `paid = true`.
- Thiệp được coi là kích hoạt vĩnh viễn ngay.
- Ghi `COMPLIMENTARY_GRANTED` cùng giá trị trước/sau.

### 7.4. Trở về giá hệ thống

Khi Admin bấm đưa về giá hệ thống:

- Đặt `adminPriceOverride = null`.
- Nếu thiệp chưa thanh toán và đang complimentary, thu hồi complimentary.
- Vô hiệu hoá payment đang chờ để lần tạo mới dùng giá hệ thống mới nhất.
- Ghi `PRICE_OVERRIDE_CLEARED`; nếu có thu hồi miễn phí, ghi thêm `COMPLIMENTARY_REVOKED` trong cùng transaction.

UI phải xác nhận rõ khi thao tác này sẽ làm một thiệp miễn phí mất quyền kích hoạt và có thể quay lại trạng thái dùng thử/hết hạn.

### 7.5. Thiệp đã thanh toán

Một payment đã trả là lịch sử tài chính bất biến trong phạm vi này. Với `Invitation.paid = true`:

- Thiệp luôn được kích hoạt dù override thay đổi.
- UI không cho đổi giá hoặc tặng miễn phí vì thay đổi không còn ý nghĩa với giao dịch đã hoàn tất.
- Hoàn tiền hoặc điều chỉnh giao dịch nằm ngoài phạm vi.

### 7.6. Payment đang chờ

Thay đổi giá phải làm các payment pending cũ không thể kích hoạt thiệp bằng số tiền lỗi thời:

- Đổi trạng thái local sang một trạng thái không còn được webhook chấp nhận, dùng quy ước hiện có hoặc bổ sung trạng thái `superseded`.
- Với payOS, gửi huỷ link theo cơ chế best-effort sau khi trạng thái database đã được bảo vệ.
- Webhook/`markPaymentPaid` chỉ được claim payment còn hợp lệ; payment đã superseded không được tự kích hoạt thiệp.
- Với Casso hoặc trường hợp tiền đến muộn sau khi huỷ, hệ thống log để đối soát thủ công; không tự nhận một khoản theo giá cũ.

Các cập nhật giá, activation, trạng thái payment và audit phải có tính nguyên tử trong database. Lời gọi huỷ provider là side effect bên ngoài và phải idempotent/best-effort.

### 7.7. Giá khách cũ

Thiệp complimentary không được tính là giao dịch trả tiền và không tự làm người dùng đủ điều kiện nhận giá khách cũ. Chỉ payment thật có `status = paid` tiếp tục tham gia phép tính hiện tại.

## 8. Giao diện quản trị

### 8.1. Danh sách `/admin/users`

- Giữ bảng hiện tại và biến email/hàng thành liên kết tới `/admin/users/[id]`.
- Thêm ô tìm kiếm theo email, thực hiện bằng search params và query server-side.
- Hiển thị empty state riêng khi không có người dùng và khi tìm kiếm không có kết quả.
- Không hiển thị tài khoản hệ thống `system@demo.local` như hiện tại.

### 8.2. Hồ sơ `/admin/users/[id]`

Phần đầu trang:

- Email hoặc nhãn chưa có email.
- Ngày đăng ký.
- Tổng số thiệp.
- Nút `Tạo thiệp mới`.

Danh sách thiệp hiển thị:

- Tên cặp đôi nếu có, fallback về tên mẫu/ID ngắn.
- Mẫu thiệp.
- Trạng thái draft/published.
- Trạng thái activation: đã thanh toán, miễn phí, dùng thử hoặc chưa xuất bản.
- Giá hiệu lực: giá hệ thống hoặc giá Admin đặt.
- Ngày cập nhật.
- Thao tác `Xem`, `Chỉnh sửa`, `Đặt giá`.

Thiệp đã publish có thể mở public URL. Thiệp draft được xem bằng preview an toàn trong editor hỗ trợ; không tạo public slug chỉ để xem.

Phần cuối trang hiển thị audit log mới nhất của người dùng, gồm thời gian, email Admin, thiệp và mô tả hành động. Có empty state khi chưa có thao tác hỗ trợ.

### 8.3. Tạo thiệp cho người dùng

`Tạo thiệp mới` mở bộ chọn mẫu tái sử dụng catalog/preview hiện có. Server action:

1. Xác thực Admin.
2. Xác thực User đích tồn tại và không phải user hệ thống.
3. Xác thực template từ allowlist server-side.
4. Tạo `Invitation` và `InvitationContent` với `userId` đích trong transaction.
5. Ghi audit cùng transaction.
6. Redirect tới `/admin/invitations/[id]/edit`.

Không gọi `getOrCreateUserId()` và không thay session người dùng.

### 8.4. Editor hỗ trợ

Editor có banner cố định, dễ nhận biết:

> Đang hỗ trợ tài khoản {email}

Banner có đường quay lại hồ sơ người dùng và nhắc rằng thay đổi sẽ tác động trực tiếp tới thiệp của khách. Editor:

- Dùng lại các trường, template picker, upload và preview hiện tại.
- Không autosave để tránh ghi nội dung ngoài ý muốn và spam audit.
- Có `Lưu bản nháp`.
- Có `Xuất bản` hoặc `Lưu` đối với thiệp đã xuất bản.
- Cho chỉnh slug/kiểm tra slug giống luồng chủ sở hữu.
- Sau mỗi submit thành công, ghi một audit record; submit lỗi không ghi.
- Không hiển thị CTA thanh toán dành cho người dùng.

### 8.5. Đặt giá

Form/modal đặt giá hiển thị:

- Giá hệ thống hiện tại cho đúng người dùng/thiệp.
- Giá override hiện tại nếu có.
- Input giá cuối cùng bằng VND; `0` có nhãn rõ là tặng miễn phí.
- Nút lưu.
- Nút đưa về giá hệ thống.

Thao tác `0đ` và thu hồi miễn phí cần hộp xác nhận nêu đúng hậu quả. Không có trường lý do.

## 9. Bảo mật và bất biến

- Mọi page/action Admin gọi `verifyAdmin()` ở server.
- Mọi ID nhận từ URL/form được truy vấn lại; không tin email, userId, giá, trạng thái hoặc `paid` từ client.
- Action sửa thiệp chỉ chấp nhận thiệp thật (`isDemo = false`); action demo hiện tại tiếp tục chỉ chấp nhận `isDemo = true`.
- Không đổi `Invitation.userId` trong editor hỗ trợ.
- Validation nội dung/template/slug dùng chung schema hiện tại để hành vi không lệch giữa owner và Admin.
- Giá là số nguyên không âm; format VND chỉ dành cho hiển thị.
- Audit snapshot không chứa password hash, session token, thông tin ngân hàng hoặc toàn bộ nội dung thiệp.
- Các mutation nhiều bảng dùng transaction và ghi audit trong cùng transaction.
- API upload tiếp tục yêu cầu user hoặc Admin session, kiểm tra signature/size và sinh tên file ngẫu nhiên; URL upload chỉ trở thành dữ liệu thiệp sau một action lưu đã được phân quyền.
- Trang Admin tiếp tục `robots: noindex, nofollow`.

## 10. i18n và nội dung

Nội dung mới phải đi qua `next-intl`, kể cả khi giao diện Admin hiện dùng tiếng Việt. Thêm namespace phù hợp cho:

- Danh sách/hồ sơ hỗ trợ Admin.
- Banner và action editor hỗ trợ.
- Trạng thái paid/complimentary/trial.
- Form giá và hộp xác nhận.
- Lỗi validation/action.

Các catalog `vi`, `en`, `ko`, `ja`, `zh` phải giữ cùng shape. Admin có thể mặc định render locale `vi`; dashboard người dùng dùng locale hiện hành.

## 11. Xử lý lỗi và xung đột

- User/thiệp không tồn tại: trả 404 ở page; action trả lỗi an toàn và không ghi audit thành công.
- Thiệp bị đổi/xoá giữa lúc mở form và submit: transaction không ghi một phần.
- Slug trùng: dùng thông báo/validation hiện tại.
- Admin submit giá không hợp lệ: giữ form và hiển thị lỗi; không đổi payment.
- Payment vừa được trả trong lúc Admin đổi giá: transaction đọc lại trạng thái. Nếu đã paid, từ chối thay đổi giá và hiển thị trạng thái mới.
- Huỷ payOS thất bại: database vẫn đánh dấu payment không hợp lệ; log lỗi provider để đối soát.
- Audit UI không parse được `details`: vẫn hiển thị action, Admin và thời gian; metadata có fallback.

## 12. Kiểm thử

### 12.1. Unit test

- Validation tìm kiếm, template và giá cuối cùng.
- Resolve giá: override `null`, `0`, giá dương và giá khách cũ.
- Activation: paid, complimentary, trial và hết hạn.
- Tạo audit detail không chứa dữ liệu nhạy cảm.
- Xác định danh sách field thay đổi khi Admin lưu editor.

### 12.2. Server/integration test

- Không có Admin session thì mọi action hỗ trợ bị từ chối.
- Admin thường và Super Admin có cùng quyền trong phạm vi này.
- User A không bị gán nhầm thiệp của User B.
- Admin tạo thiệp cho đúng user, đúng template và có audit trong cùng transaction.
- Admin lưu/xuất bản thiệp thật; thiệp demo và ID không tồn tại bị từ chối.
- Lưu lỗi không tạo audit log.
- Đặt giá dương ảnh hưởng payment mới và supersede payment pending cũ.
- Đặt `0` kích hoạt complimentary nhưng không tạo payment, không đặt paid và không tăng doanh thu.
- Reset về giá hệ thống thu hồi complimentary đối với thiệp chưa paid.
- Thiệp đã paid không cho sửa giá và vẫn kích hoạt.
- Webhook không claim payment đã superseded.
- Thiệp complimentary không được tính vào giá khách cũ.
- Xoá Admin/User/Invitation theo policy không làm mất snapshot nhận diện trong audit.

### 12.3. UI/runtime

1. Đăng nhập bằng một Admin không phải Super Admin.
2. Tìm user theo email và mở hồ sơ.
3. Tạo thiệp mới từ một template, xác nhận thiệp xuất hiện trong dashboard đúng user.
4. Mở editor hỗ trợ, xác nhận banner danh tính và không có impersonation cookie.
5. Lưu nội dung, preview và xuất bản; xác nhận public URL hoạt động.
6. Đặt một giá dương, mở trang thanh toán bằng user và xác nhận đúng số tiền.
7. Thay đổi giá khi có payment pending; xác nhận payment cũ không còn được chấp nhận tự động.
8. Đặt giá `0`; xác nhận thiệp kích hoạt, dashboard ghi miễn phí và doanh thu không tăng.
9. Reset về giá hệ thống; xác nhận cảnh báo và trạng thái activation đúng.
10. Kiểm tra audit log hiển thị đúng email Admin, thời gian, user, thiệp và before/after giá.
11. Kiểm tra desktop/mobile cho bảng, modal chọn mẫu, modal giá và editor banner.

## 13. Triển khai và migration

- Tạo Prisma migration bổ sung các trường Invitation, model audit và index.
- Backfill mặc định `complimentary = false`; dữ liệu `paid`/Payment cũ giữ nguyên.
- Không suy diễn thiệp cũ là complimentary.
- Chạy Prisma generate, test phạm vi, typecheck, lint và production build.
- Trước deploy phải backup SQLite và chạy migration bằng đúng revision image.
- Worktree hiện có nhiều thay đổi không liên quan; việc triển khai/deploy phải cô lập đúng patch của tính năng và không reset thay đổi của người dùng.

## 14. Tiêu chí hoàn thành

Tính năng hoàn thành khi một Admin thường có thể đi từ danh sách người dùng tới hồ sơ, tạo hoặc chỉnh/xuất bản thiệp cho đúng người dùng, đặt giá cuối cùng hoặc tặng miễn phí, và mọi mutation thành công đều có audit xác định Admin thực hiện. Người dùng thấy đúng thiệp/trạng thái trong dashboard; thanh toán dùng đúng giá; thiệp miễn phí được kích hoạt mà không làm sai số liệu payment hoặc doanh thu; không có thao tác nào cần impersonate người dùng.
