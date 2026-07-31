# Chung Đôi: Roadmap thiệp có UI khác biệt

## Mục đích

Tài liệu này lưu các hướng thiết kế thiệp phá cách để triển khai dần sau khi hoàn
thiện một mẫu thí điểm đầu tiên. Nó cũng khóa các yêu cầu trải nghiệm dùng chung
cho mọi mẫu hiện tại và tương lai.

Mục tiêu không phải tạo thêm các mẫu chỉ khác màu, font hoặc artwork. Mỗi renderer
family mới phải thay đổi rõ cách người dùng mở, khám phá và tương tác với thiệp,
trong khi vẫn giữ đầy đủ dữ liệu và chức năng của sản phẩm.

## Điểm khôi phục context sau khi reset

Đây là checkpoint phải đọc trước khi tiếp tục task tạo mẫu thiệp mới:

1. Đọc toàn bộ tài liệu này.
2. Đọc phần "Chung Đôi: Playbook tạo mẫu thiệp mới" trong
   [`INSPECTION_GUIDE.md`](./INSPECTION_GUIDE.md).
3. Chỉ hoàn thiện một mẫu thí điểm trước; chưa triển khai hàng loạt 66 mẫu.
4. Mọi mẫu mới phải có bìa 3D hai mặt, drag/tilt/flip được và click/tap để mở.
5. Opening phải tiếp nối pose 3D hiện tại và giống một vật thể thật đang mở,
   không fade bìa đi rồi thay bằng trang khác.
6. Stack đã chốt là React Three Fiber/Three.js cho vật thể, GSAP cho master
   timeline và React DOM cho nội dung sau mở.
7. Asset linh vật không được là một ảnh phẳng duy nhất. Asset phải được chuẩn bị
   theo layer, material mask và animation requirement của concept.
8. Mọi tính năng hiện có như album, map, RSVP, QR, guestbook, music, calendar và
   guest media phải còn đầy đủ.
9. PC và mobile có composition/timeline riêng; reduced motion và WebGL fallback
   là yêu cầu bắt buộc.

Trạng thái tại thời điểm tạo checkpoint:

- Mẫu thí điểm chính thức chưa được chốt; `gatefold` đang là đề xuất ưu tiên.
- Linh vật và hướng văn hóa của mẫu thí điểm chưa được chốt.
- Chưa generate asset công/phượng/rồng production nào cho mẫu mới.
- Chưa cài `gsap` hoặc `@gsap/react`.
- Chưa refactor opening hiện tại sang master timeline mới.
- Tài liệu này là nguồn quyết định cho phần UI phá cách, physical opening,
  technology stack và asset pipeline.

Việc cần làm đầu tiên sau khi tiếp tục:

1. Chọn concept/hình dạng mở của mẫu thí điểm.
2. Chốt `TemplateArtDirection` và `AssetBible`.
3. Viết storyboard desktop/mobile cho `CLOSED -> OPENING -> HANDOFF -> OPENED`.
4. Tạo mini asset pack đầu tiên.
5. Dùng asset thật để prototype physical opening trước khi xây toàn bộ section.

## Chiến lược triển khai

- Chỉ tập trung hoàn thiện một mẫu thí điểm trước.
- Mẫu thí điểm phải đi hết từ concept, bìa, opening animation, nội dung đầy đủ,
  responsive, accessibility, performance đến kiểm thử trực quan.
- Sau khi mẫu đầu tiên đạt Definition of Done, trích các primitive và contract
  có thể dùng chung rồi mới triển khai concept tiếp theo.
- Không ép renderer phá cách đi qua `ArtInvitation` nếu kiến trúc một cột hiện
  tại làm mất bản sắc concept.
- Không nhân bản logic nghiệp vụ như countdown, album, map, guestbook, QR, RSVP,
  music hoặc guest media trong từng template.

Mẫu thí điểm đầu tiên chưa được chốt. Đề xuất ưu tiên `gatefold` vì phù hợp cả
thiệp truyền thống lẫn hiện đại, tạo khác biệt rõ và có mobile fallback tự nhiên.

## Yêu cầu bắt buộc cho mọi mẫu thiệp

### 1. Luôn có bìa click/tap để mở thiệp

Mỗi mẫu phải có hai phạm vi tách biệt:

1. Bìa thiệp ở trạng thái đóng.
2. Nội dung thiệp sau khi mở.

Contract chung:

- Khách phải chủ động click hoặc tap để mở thiệp.
- Control mở thiệp hỗ trợ chuột, touch, bàn phím Enter/Space và focus rõ ràng.
- Vùng chạm tối thiểu `44px`.
- Một lần mở chỉ kích hoạt một transition; click liên tục không được chạy chồng
  animation hoặc phát nhạc nhiều lần.
- Bìa phải hiển thị tốt tên cặp đôi, ngày cưới và thông tin người nhận nếu link
  được cá nhân hóa.
- Decoration ở trạng thái đóng phải bị clip đúng theo hình học bìa và không làm
  document tràn ngang.
- Logic mở thiệp, phát nhạc và chuyển trạng thái thuộc experience shell dùng
  chung; template chỉ cung cấp visual treatment và opening choreography.

#### Bìa đóng phải là vật thể 3D tương tác được

Mọi mẫu thiệp mới phải có một phiên bản bìa hai mặt có thể quan sát trong không
gian trước khi mở. Không bắt buộc dùng đúng implementation `Envelope3D` hiện tại,
nhưng trải nghiệm phải có các khả năng tương đương:

- Người dùng có thể drag bằng chuột hoặc vuốt bằng touch để xoay/tilt bìa theo
  nhiều góc.
- Có thể xoay đủ để nhìn thấy mặt sau; mặt sau phải được thiết kế có chủ đích,
  không phải mặt phẳng trống hoặc bản sao mặt trước.
- Vật thể phải có độ dày/mép, perspective, lighting và shadow đủ để đọc được
  hướng trong không gian.
- Chuyển động drag có damping/inertia vừa phải, không rung, không lật mất kiểm
  soát và không gây chóng mặt.
- Khi thả tay, bìa có thể giữ góc hiện tại hoặc settle nhẹ về pose hợp lý tùy
  concept.
- Gesture drag và hành động click nút mở phải được phân biệt bằng movement
  threshold; xoay bìa không được vô tình mở thiệp.
- Nút mở vẫn phải bấm được trên mặt bìa tương tác và có keyboard fallback.
- Mobile không phụ thuộc hover; toàn bộ thao tác quan trọng phải dùng được bằng
  touch.
- Có thể dùng WebGL, CSS 3D hoặc kỹ thuật khác, miễn là có nhiều góc nhìn, hai
  mặt thật và chuyển động không giống một ảnh 2D chỉ nghiêng nhẹ.

Mỗi concept quyết định hình dạng vật thể:

- Envelope có mặt trước, mặt sau, flap, seal và card bên trong.
- Gatefold có spine/mép và hai cánh gấp.
- Storybook có bìa trước, gáy sách, bìa sau và block trang.
- Sleeve/vinyl/contact sheet có outer sleeve và insert bên trong.
- Newspaper/scroll có độ cong hoặc lớp giấy gấp phù hợp.
- Wedding OS vẫn phải được đặt trên một physical carrier có hai mặt, ví dụ
  invitation card, glass device hoặc display slab, thay vì bỏ hẳn bìa vật lý.

#### Nguyên tắc quan trọng nhất: liên tục như một vật thể thật

Opening không được là thao tác “fade bìa đi rồi mount một trang khác”. Người xem
phải cảm nhận bìa và nội dung là hai trạng thái của cùng một vật thể đang được mở.

Contract liên tục:

- Frame đầu của animation phải khớp trạng thái bìa đóng, không nhảy vị trí, kích
  thước, tỷ lệ, màu, decoration hoặc camera.
- Chuyển động phải xuất phát từ affordance người dùng vừa bấm: seal, mép giấy,
  tay nắm, flap, cánh gấp, bìa sách hoặc tấm card trong sleeve.
- Vật thể phải có transform origin/bản lề hợp lý với cấu tạo thật.
- Mặt trước, mặt sau, mép giấy, phần bị che và contact shadow phải đổi theo đúng
  quan hệ không gian trong suốt transition.
- Nội dung phải được nhìn thấy dần từ bên trong hoặc phía sau vật thể đang mở;
  không teleport vào một màn hình không liên quan.
- Nếu bìa đang ở một góc do người dùng vừa xoay, opening phải bắt đầu từ pose
  hiện tại hoặc nội suy mượt về opening pose; tuyệt đối không snap tức thời về
  góc mặc định.
- Frame cuối phải chuyển sang nội dung đã mở mà không flash nền, layout jump,
  đổi camera đột ngột hoặc xuất hiện một frame trống.
- Sau pha settle, experience shell mới hand-off scroll và interaction cho nội
  dung. Người dùng không được cảm nhận thời điểm DOM/renderer bị thay thế.

Cách mở phụ thuộc hình dạng và concept, không khóa một animation chung:

- Envelope: gỡ seal, mở flap, card trượt ra rồi mở/phóng về reading position.
- Gatefold: hai cánh xoay quanh bản lề trái/phải, nội dung trung tâm được lộ dần.
- Book/storybook: bìa nâng lên, trang đầu lật và camera settle vào trang đọc.
- Sleeve/contact sheet: card hoặc film strip trượt ra khỏi bao.
- Scroll: dây buộc tháo ra, giấy cuộn mở theo trục.
- Wedding OS: lock surface phản hồi thao tác rồi chuyển liên tục vào workspace.
- Museum: cửa/phông triển lãm mở và camera tiến vào phòng đầu tiên.
- Vinyl: outer sleeve mở/trượt, đĩa hoặc booklet xuất hiện bên trong.

Animation có thể dùng 2D, 2.5D, CSS 3D, SVG hoặc WebGL tùy hình học, nhưng kỹ
thuật phải phục vụ tính liên tục vật lý thay vì phô diễn công nghệ.

### 2. Animation phải có đủ ba giai đoạn

#### Trạng thái bìa đang đóng

- Có idle motion nhẹ phù hợp concept: shimmer, drift, breathing seal, ánh sáng,
  giấy rung nhẹ hoặc particle tiết chế.
- Không để animation làm chữ khó đọc hoặc khiến người dùng khó bấm nút mở.
- Không dùng chuyển động liên tục quá mạnh gây chóng mặt hoặc tiêu tốn pin.

#### Khi mở thiệp

- Mỗi concept có một signature transition riêng; không dùng cùng một animation
  scale/fade cho mọi mẫu.
- Transition phải truyền đạt hình học của concept, ví dụ gấp cánh, vẽ tuyến
  đường, mở cửa sổ, lật trang hoặc bung các lớp artwork.
- Renderer art dùng layer alpha hiện tại tiếp tục theo contract `1.3–1.5s`.
- Renderer family phá cách chọn duration theo vật lý của hình dạng, thông thường
  `1.2–2.2s`; không ép một duration chung nếu khiến thao tác mở thiếu tự nhiên.
- Chuyển động chính ưu tiên `transform` và `opacity`; hạn chế animation layout,
  filter nặng hoặc repaint toàn màn hình.
- Foreground phải còn sắc nét và dễ nhận biết tới khoảng `70%` timeline trước
  khi fade/blur.
- Sau khi transition kết thúc, overlay mở thiệp phải unmount và trả tương tác
  hoàn toàn cho nội dung.
- Asset animation lỗi không được chặn người dùng mở thiệp.

Opening choreography nên có đủ năm nhịp, dù một số nhịp có thể rất ngắn:

1. `anticipation`: seal/control phản hồi ngay sau click.
2. `release`: khóa, seal, flap hoặc lớp giữ được mở.
3. `reveal`: vật thể chính mở/trượt/lật để lộ nội dung.
4. `settle`: camera và card đi về reading position.
5. `handoff`: scroll, form và control nội dung nhận tương tác.

#### Sau khi mở thiệp

- Có motion language thống nhất với bìa: section reveal, parallax, route draw,
  page transition, window transition, photo drift hoặc ambient particle.
- Animation hỗ trợ hierarchy và kể chuyện, không chạy chỉ để trang trí.
- Interaction như album, lightbox, map, guestbook, QR và RSVP phải luôn ưu tiên
  khả năng sử dụng hơn hiệu ứng.
- Khi người dùng tự scroll/touch, animation và auto-scroll không được giành quyền
  điều khiển hoặc gây giật vị trí.

#### Reduced motion và performance

- Tôn trọng `prefers-reduced-motion`.
- Reduced motion dùng fade ngắn khoảng `160–220ms`, bỏ travel/rotate/zoom lớn.
- Mục tiêu là animation mượt ở `60fps` trên thiết bị phổ thông.
- Không tạo layout shift khi font, ảnh hoặc animation asset tải xong.
- Pause hoặc giảm ambient animation khi tab không visible nếu animation có chi
  phí đáng kể.

### 3. Hỗ trợ tốt cả PC và mobile

- Mobile-first nhưng không chỉ phóng to layout mobile trên desktop.
- Desktop được phép có composition nhiều panel, cuộn ngang có chủ đích, spatial
  layout hoặc interaction bằng hover nếu concept cần.
- Mọi interaction desktop phải có touch/mobile equivalent.
- Mobile phải có narrative fallback rõ ràng, thường là scroll dọc, scroll-snap
  theo chương hoặc accordion.
- Không bắt mobile thực hiện thao tác precision drag để đọc thông tin bắt buộc.
- Không có horizontal overflow ngoài container cuộn ngang có chủ đích.
- Tôn trọng `safe-area-inset-*` cho control fixed.
- Text, form, QR, bản đồ và nút thao tác phải đọc/bấm được ở các viewport tối
  thiểu `360px`, `390px`, `430px`.
- Gate trực quan tối thiểu:
  - Mobile `390 × 844`.
  - Tablet khoảng `768px`.
  - Desktop `1280–1440px`.
  - Trạng thái bìa đóng.
  - Frame giữa opening animation.
  - Đầu, giữa và cuối thiệp sau khi mở.

## Nội dung và tính năng không được thiếu

Mỗi renderer family mới phải trình bày đầy đủ các capability sau khi dữ liệu tồn
tại:

1. Hero/artwork, tên cặp đôi và ngày cưới.
2. Một hoặc hai ảnh mở đầu.
3. Lời mời.
4. Thông tin hai gia đình.
5. Một hoặc nhiều nghi lễ.
6. Tiệc cưới.
7. Countdown và thêm vào lịch.
8. Lịch tháng cưới.
9. Album và lightbox.
10. Timeline.
11. Bản đồ và chỉ đường.
12. Dress code.
13. Sổ lưu bút và form lời chúc.
14. QR/phong bì mừng cưới.
15. Footer cảm ơn.

Experience shell tiếp tục cung cấp:

- Bìa và trạng thái mở thiệp.
- Cá nhân hóa khách mời.
- Music player.
- Auto-scroll có thể dừng khi người dùng tương tác.
- RSVP.
- Ảnh/video do khách đóng góp.
- Additional ceremonies.
- i18n.

## Danh sách concept để triển khai sau

### 1. Gatefold — thiệp gấp ba

- Hai cánh trái/phải đại diện hai gia đình, trung tâm là cặp đôi và ngày cưới.
- Countdown nằm trên seal; calendar là insert; map là tờ foldout.
- Album dùng loose photo/polaroid; dress code dùng fabric swatch.
- Guestbook là postcard; QR nằm trong phong bì nhỏ.
- Desktop mở hai cánh; mobile chuyển thành accordion hoặc panel dọc.

### 2. Journey Map — hành trình hai tuyến

- Hai tuyến cô dâu/chú rể bắt đầu từ hai gia đình và nhập tại ngày cưới.
- Nghi lễ, tiệc, album, timeline và địa điểm là các ga.
- Countdown là departure board; calendar là vé; wishes là ticket của khách.
- Mobile vẽ tuyến dọc theo scroll.

### 3. Wedding OS — thiệp dạng hệ điều hành

- Bìa là lock screen; mở thiệp giống unlock.
- Couple, Families, Calendar, Photos, Maps, Messages và Wallet là các app.
- RSVP là notification/action cố định; music dùng mini player.
- Desktop dùng cửa sổ; mobile dùng launcher và screen full-height.

### 4. Museum Exhibition — triển lãm tình yêu

- Hero là title wall; ảnh là tranh; thông tin gia đình là plaque.
- Mỗi nhóm nội dung là một phòng triển lãm.
- Timeline là niên biểu; map là floor plan; guestbook là visitor book.
- Desktop có thể đi ngang qua các phòng; mobile là triển lãm dọc.

### 5. Illustrated Storybook — sách truyện

- Nội dung chia chương với full-screen scene và page transition.
- Calendar, map, dress code và QR là các insert kẹp trong sách.
- Guestbook là endpaper để khách ký tên.
- Desktop có page-turn; mobile dùng scroll-snap theo chương.

### 6. Vinyl Album — album nhạc

- Bìa thiệp là album cover; ngày cưới là release date.
- Hai bên gia đình/lễ cưới là Side A và Side B.
- Timeline là tracklist; album là booklet; map là tour venue.
- Lời chúc là fan notes; QR là merchandise/support insert.
- Vinyl quay đồng bộ với trạng thái phát nhạc.

### 7. Contact Sheet — phòng tối nhiếp ảnh

- Hero là contact sheet/film negative; tên và ngày là metadata.
- Album là film strip; timeline là shooting log; calendar là date stamp.
- Map là location sheet; dress code là color grading palette.
- Wishes là ghi chú sau ảnh; QR nằm trong negative sleeve.

### 8. Wedding Newspaper — số báo ngày cưới

- Trang nhất là tên cặp đôi và ngày cưới.
- Gia đình là hai cột; album là photo essay; timeline là chronology.
- Map là mục địa phương; dress code là fashion column.
- Wishes là letters to the editor; QR là support/classified card.
- Mobile trở thành feed bài báo một cột có hierarchy mạnh.

### 9. Spatial Scrapbook — bàn kỷ niệm

- Ảnh polaroid, postcard, vé, ribbon, hoa khô và sticky note nằm trên một mặt bàn.
- Calendar là lịch xé; timeline là note; map là postcard.
- Dress code là fabric swatch; wishes là sticky note; QR trong phong bì giấy.
- Mobile dùng composition dọc được khóa vị trí, không yêu cầu precision drag.

### 10. Wedding Board Game — hành trình về chung nhà

- Hai người là hai quân cờ; hai gia đình là hai điểm xuất phát.
- Timeline là đường đi; album là memory card; địa điểm là ô đích.
- Countdown là spinner; dress code là token màu; wishes là event card.
- QR nằm trong treasure chest.

## Kiến trúc renderer family đề xuất

Không xem mỗi concept là một trang JSX khổng lồ. Experience shell giữ state và
logic dùng chung:

```ts
type InvitationExperienceState = "closed" | "opening" | "opened";

type InvitationRendererFamily =
  | "art-scroll"
  | "gatefold"
  | "journey-map"
  | "wedding-os"
  | "museum"
  | "storybook"
  | "vinyl"
  | "contact-sheet"
  | "newspaper"
  | "scrapbook"
  | "board-game";
```

Renderer family nhận dữ liệu đã chuẩn hóa và các interactive primitive dùng
chung. Nó sở hữu:

- Composition desktop và mobile.
- Visual grammar của section.
- Cover skin.
- Opening choreography theo hình học vật thể.
- Post-open motion language.
- Vị trí portal cho guest media trước footer.

Mỗi renderer family phải khai báo physical opening model trước khi code:

```ts
type PhysicalOpeningModel = {
  object:
    | "envelope"
    | "gatefold"
    | "book"
    | "sleeve"
    | "scroll"
    | "workspace"
    | "door"
    | "vinyl-sleeve";
  closedInteraction: {
    mode: "orbit" | "tilt-and-flip";
    showsBackFace: true;
    pointerDrag: true;
    touchDrag: true;
    gestureThresholdPx: number;
    settleBehavior: "hold" | "spring-to-pose";
  };
  affordance: string;
  hinges: Array<{
    part: string;
    transformOrigin: string;
  }>;
  revealOrder: string[];
  cameraTransition: string;
  settleTarget: string;
  durationMs: number;
  reducedMotionDurationMs: number;
};
```

Nó không sở hữu:

- Cách submit wish hoặc RSVP.
- Cách tạo Google Calendar URL.
- Cách embed map.
- Cách tạo VietQR.
- Audio state dùng chung.
- Upload và lưu guest media.

## Stack và kiến trúc animation đã chốt

### Design read chung

Trải nghiệm được định hướng như một sản phẩm thiệp cưới cao cấp dành cho người
xem phổ thông, có khoảnh khắc mở thiệp đáng nhớ nhưng nội dung sau khi mở vẫn
thoáng, dễ đọc và dễ thao tác.

Ba dial tham chiếu cho mẫu thí điểm:

```ts
const invitationDesignDials = {
  designVariance: 8,
  motionIntensity: 8,
  visualDensity: 3,
};
```

Ý nghĩa:

- UI phải có độ khác biệt cao giữa các renderer family.
- Opening được phép có choreography điện ảnh và cảm giác vật lý rõ.
- Nội dung sau khi mở không trở thành một màn hình hiệu ứng dày đặc.
- Mỗi animation phải phục vụ hierarchy, storytelling, feedback hoặc state
  transition. Không animate chỉ vì có sẵn công cụ.

### Phân vai công nghệ

| Lớp | Công nghệ | Trách nhiệm |
| --- | --- | --- |
| Bìa và vật thể vật lý | React Three Fiber, Three.js, Drei | Geometry, hai mặt, độ dày, pivot, ánh sáng, bóng, camera và drag/tilt |
| Choreography | GSAP, `@gsap/react` | Một master timeline điều phối Object3D, camera, controls, material, sound cue và DOM handoff |
| Nội dung đã mở | React DOM, Tailwind, shadcn/ui | Text, form, map, RSVP, QR, album, accessibility, SEO và responsive |
| Motion đơn giản sau mở | CSS hoặc Web Animations API | Hover, active, fade/slide nhỏ và reveal không cần timeline phức tạp |
| Cuộn trang | Lenis hiện tại | Giữ một nguồn điều khiển scroll duy nhất |
| Âm thanh mở thiệp | Web Audio API | Preload và phát sound effect đúng timestamp |

Quyết định:

- Dùng React Three Fiber thay vì chuyển sang raw Three.js vì project đã là
  React/Next và đã có `three`, `@react-three/fiber`, `@react-three/drei`.
- Three.js là renderer và mô hình vật thể; GSAP là lớp đạo diễn timeline.
- Không render toàn bộ thiệp trong Canvas. Canvas chỉ sở hữu bìa và transition
  mở; nội dung chức năng vẫn là DOM.
- Chỉ thêm runtime dependency bắt buộc:

```bash
npm install gsap @gsap/react
```

### State machine và vòng đời Canvas

```text
CLOSED -> OPENING -> HANDOFF -> OPENED
```

#### `CLOSED`

- Canvas tồn tại và bìa 3D có thể drag/tilt/flip để xem mặt sau.
- Idle motion chạy tiết chế.
- Nút mở là control truy cập được bằng pointer, touch và bàn phím.
- Bìa có thể giữ pose người dùng vừa xoay hoặc settle nhẹ tùy concept.

#### `OPENING`

Khi người dùng kích hoạt mở:

1. Chụp chính xác camera pose, object pose và `OrbitControls.target` hiện tại.
2. Khóa controls và không cho mở lặp.
3. Bắt đầu GSAP master timeline từ pose đang thấy, không reset về góc mặc định.
4. Xoay/mở từng bộ phận quanh pivot hoặc bản lề thật.
5. Đồng bộ camera, ánh sáng, bóng, occlusion, material và sound cue.
6. Nội dung bên trong được lộ ra theo mức mở của vật thể.

GSAP timeline nên có label ổn định:

```text
anticipation -> release -> unfold -> reveal -> settle -> handoff
```

Timeline phải hỗ trợ `play`, `pause`, `reverse` và đặc biệt là `seek` để có thể
kiểm tra từng frame xác định.

#### `HANDOFF`

- Đưa mặt đọc WebGL tới đúng vị trí, tỷ lệ và góc của DOM hero.
- Chỉ bàn giao khi hai representation trùng nhau về hình ảnh.
- Việc thay WebGL bằng DOM diễn ra trong khoảng 1-2 frame sau khi vật thể đã
  settle, không được dùng crossfade để giả vờ mở thiệp.
- Chuyển focus và quyền scroll sang nội dung mà không flash nền hoặc layout jump.

#### `OPENED`

- Unmount Canvas sau khi handoff hoàn tất để trả tài nguyên GPU.
- Nội dung là DOM đầy đủ chức năng.
- Post-open animation tiếp tục cùng motion language nhưng không tranh quyền
  scroll/touch với người dùng.

### Refactor cần làm từ implementation 3D hiện tại

`Envelope3D` hiện tại là nền móng tốt vì đã có:

- Texture mặt trước được capture từ DOM.
- Mặt sau, thân có độ dày và perspective.
- Drag/rotate bằng `OrbitControls`.
- Phân biệt drag với click bằng movement threshold.
- Cả mặt trước và sau đều ở WebGL, tránh drift giữa CSS perspective và camera
  WebGL trên iOS.

Phần cần thay đổi:

- Expose refs cho root group, camera, controls và các bộ phận có bản lề.
- Tách slab nguyên khối thành flap, gate, cover, insert hoặc page tùy concept.
- Lưu pose hiện tại trước khi bắt đầu opening.
- Thay `setTimeout` và CSS animation làm bìa biến mất bằng callback hoàn tất của
  GSAP master timeline.
- Giữ cùng một Canvas xuyên suốt `CLOSED`, `OPENING` và `HANDOFF`.
- Chỉ mount hoặc kích hoạt nội dung đầy đủ sau khi timeline hoàn tất.

## Material system cho thiệp

Chất lượng cảm nhận đến nhiều từ vật liệu đúng hơn là thêm hiệu ứng chuyển động.
Mỗi renderer family phải khai báo material preset thay vì chỉ đổi ảnh và màu.

### Các loại vật liệu cần hỗ trợ

- Giấy mỹ thuật: roughness cao, normal map rất nhẹ.
- Giấy cotton: thớ giấy và cạnh mềm.
- Giấy ngọc trai: iridescence rất nhẹ theo góc nhìn.
- Ép kim: mesh/material riêng với metalness và roughness riêng.
- Dập nổi hoặc dập chìm: normal/height map có mask.
- Vải và ribbon: sheen.
- Wax seal: clearcoat nhẹ và normal map.
- Giấy can: transmission có giới hạn.
- Sơn mài: clearcoat, phản chiếu sâu nhưng không giống nhựa.

Không nên chỉ vẽ gradient vàng vào texture để giả ép kim. Vùng ép kim nên có
alpha mask hoặc mesh riêng để highlight thay đổi đúng theo góc nhìn.

`MeshPhysicalMaterial` có thể dùng cho clearcoat, sheen, iridescence,
transmission và anisotropy, nhưng có chi phí GPU cao hơn. Chỉ bật tính năng đúng
khu vực cần thiết; không áp toàn bộ feature lên mọi pixel.

Với mặt thiệp có texture capture từ DOM:

- Giữ một print/color pass để bảo toàn màu thiết kế.
- Thêm physical material pass hoặc overlay có mask cho giấy, foil và emboss.
- Kiểm soát tone mapping để màu brand không thay đổi quá mạnh theo environment.
- Không để reflection làm chữ mất tương phản.

## Lighting và shadow

Mỗi concept có lighting preset riêng nhưng cùng dùng một lighting rig contract:

- Một key light mềm tạo hướng.
- Một fill light nhẹ để mặt sau không thành mảng đen.
- Environment map để foil, ngọc trai và clearcoat có phản xạ tự nhiên.
- Contact shadow giúp vật thể có trọng lượng và quan hệ với mặt nền.
- Shadow và occlusion phải thay đổi trong suốt quá trình mở.

Nguyên tắc production:

- Self-host HDR/EXR/gainmap; không phụ thuộc preset CDN.
- Ưu tiên gainmap nhẹ nếu chất lượng đáp ứng.
- Giới hạn số frame của contact/accumulative shadow khi vật thể đứng yên.
- Chỉ render shadow động trong lúc drag hoặc opening, rồi settle về shadow tĩnh.
- Không dùng post-processing để che geometry, pivot hoặc lighting chưa đúng.

Thứ tự hoàn thiện hình ảnh:

```text
geometry
-> pivot
-> material
-> lighting
-> shadow
-> timing
-> sound
-> post-processing
```

## Sound design và haptic

Nhạc nền hiện tại tiếp tục do experience shell quản lý. Opening có thêm sound
effect ngắn, được phát sau user gesture và đồng bộ với GSAP timeline.

Sound palette có thể gồm:

- Chạm hoặc bóc seal.
- Giấy bắt đầu chịu lực.
- Tiếng gấp/lật giấy.
- Card hoặc insert trượt ra.
- Âm settle nhỏ khi thiệp mở phẳng.

Quy tắc:

- Dùng Web Audio API trước; chưa cần thêm `howler.js`.
- Preload/decode sound effect trước khi mở nếu có thể.
- Dùng gain envelope để không có click âm thanh.
- Có thể pan nhẹ theo hướng flap/cánh mở.
- Không để sound effect lấn nhạc nền hoặc nghe giống hiệu ứng game.
- Khi tắt tiếng, cả nhạc và opening SFX phải tôn trọng cùng một trạng thái.
- Nếu sound asset lỗi, opening vẫn hoàn tất.

Haptic là progressive enhancement:

- Có thể gọi `navigator.vibrate(5-10)` khi seal release trên thiết bị hỗ trợ.
- Không dựa vào vibration để truyền đạt trạng thái bắt buộc.
- API không hỗ trợ đồng đều nên phải fail silently.

Ví dụ mapping timeline tham chiếu:

```text
0%    control nhận lực, thiệp nghiêng rất nhẹ
8%    seal release, click sound, haptic tùy thiết bị
15%   bản lề bắt đầu mở
35%   bóng giữa hai lớp giấy đậm nhất
60%   nội dung bên trong bắt đầu lộ
82%   camera tiến về reading position
94%   thiệp mở phẳng
100%  DOM handoff và settle sound
```

## Motion design system

GSAP là engine, không phải motion language. Cần một bộ token chung và preset theo
vật liệu/hình dạng:

```ts
type InvitationMotionTokens = {
  anticipation: number;
  release: number;
  unfold: number;
  reveal: number;
  settle: number;
  easePhysical: string;
  easePaper: string;
  easeSettle: string;
};

const referenceMotionTokens: InvitationMotionTokens = {
  anticipation: 0.16,
  release: 0.32,
  unfold: 1.1,
  reveal: 0.7,
  settle: 0.5,
  easePhysical: "power3.inOut",
  easePaper: "power2.out",
  easeSettle: "elastic.out(1, 0.5)",
};
```

Các preset được phép override:

- Giấy dày: chậm hơn, anticipation và quán tính rõ hơn.
- Giấy mỏng: nhanh, travel nhẹ hơn.
- Gatefold: hai cánh lệch timing một lượng rất nhỏ để tránh cảm giác máy móc.
- Book: spine giữ ổn định, cover và page có timing khác nhau.
- Sleeve: easing ưu tiên ma sát và release.
- Scroll: nhiều phase liên tiếp thay vì một tween duy nhất.
- Pop-up: detail dựng lên theo dependency vật lý.

`gsap.matchMedia()` hoặc contract tương đương phải cung cấp:

- Desktop timeline.
- Mobile timeline.
- Reduced-motion timeline.

Không dùng duration và easing giống nhau cho mọi renderer family.

## Art-direction contract cho từng template

Để tránh 66 mẫu chỉ đổi skin, mỗi mẫu phải có spec tương đương:

```ts
type TemplateArtDirection = {
  layoutFamily: string;
  coverGeometry: string;
  openingMechanism: string;
  typography: {
    display: string;
    body: string;
    hierarchy: string;
  };
  colorPalette: string;
  materialPreset: string;
  lightingPreset: string;
  motionPreset: string;
  soundPreset: string;
  sectionCompositions: string[];
};
```

Ví dụ:

- Thiệp Nhật: giấy washi, mở ngang, chuyển động chậm, bóng mềm.
- Art Deco: gatefold, kim loại sắc, timing dứt khoát.
- Cổ tích: storybook, pop-up và particle tiết chế.
- Tối giản: sleeve pull-out, monochrome, ít decoration.
- Truyền thống Việt: gatefold hoặc scroll, đỏ sơn mài, dập kim.
- Editorial: mở như tạp chí, typography lớn, composition bất đối xứng.

Mỗi template chỉ khóa một visual theme có chủ đích. Không tự động nhét dark-mode
toggle vào thiệp nếu làm mất art direction; nhưng mọi control vẫn phải đạt tương
phản và accessibility.

## Asset pipeline cho linh vật và artwork

Có thể tạo asset mới cho từng thiệp, gồm công, phượng, rồng, hạc, uyên ương,
hoa sen, mẫu đơn, mây, khung viền, pattern truyền thống, texture giấy và các
decoration liên quan.

Mục tiêu không phải tạo một ảnh đẹp để dán lên bìa. Mỗi asset pack phải được thiết
kế cho composition, material và animation của template cụ thể.

### Các dạng asset cần hỗ trợ

#### Asset trang trí nền trong suốt

Ví dụ:

- Phượng đứng riêng hoặc cặp phượng đối xứng.
- Cặp long phụng.
- Công xòe đuôi.
- Rồng uốn quanh khung hoặc chạy dọc mép gatefold.
- Hạc, uyên ương, bướm hoặc chim nhỏ.
- Mây, hoa sen, mẫu đơn, lá, ribbon và corner ornament.
- Border, divider và seamless pattern.

Đầu ra production:

- PNG master độ phân giải cao, có alpha.
- WebP tối ưu cho runtime khi phù hợp.
- Không chữ, không watermark.
- Có safe padding để cánh, sừng, đuôi hoặc lông không bị cắt.
- Composition đọc được cả khi thu nhỏ trên mobile.

Lông công, lông phượng, sợi vải, khói và chi tiết bán trong suốt cần matte đặc
biệt cẩn thận. Nếu chroma-key removal tạo viền màu hoặc mất lông mảnh, phải dùng
quy trình native transparency hoặc cleanup thủ công thay vì ship asset lỗi.

#### Asset tách lớp cho animation

Ví dụ một con phượng có thể tách:

```text
phoenix-body
phoenix-head
phoenix-left-wing
phoenix-right-wing
phoenix-tail-front
phoenix-tail-back
phoenix-feather-particles
phoenix-shadow
```

Ví dụ rồng có thể tách:

```text
dragon-head
dragon-body-front
dragon-body-back
dragon-claws
dragon-whiskers
dragon-cloud-front
dragon-cloud-back
dragon-shadow
```

Các layer cho phép:

- Cánh mở nhẹ khi bìa nghiêng.
- Đuôi chuyển động theo quán tính.
- Râu/mây trễ nhịp so với thân rồng.
- Ánh sáng chạy dọc lông hoặc vảy.
- Hai linh vật tách sang hai bên khi gatefold mở.
- Linh vật dựng thành pop-up sau khi thiệp mở.
- Một phần decoration nằm trước và một phần nằm sau text/card.

Không bắt buộc mọi asset đều có nhiều layer. Chỉ tách phần có chuyển động hoặc
quan hệ che khuất thực sự.

#### Material mask

Mỗi asset quan trọng có thể cần:

```text
phoenix-color.png
phoenix-alpha.png
phoenix-foil-mask.png
phoenix-emboss-mask.png
phoenix-roughness.png
phoenix-highlight.png
phoenix-shadow.png
```

Ý nghĩa:

- `color`: màu và chi tiết in.
- `alpha`: silhouette/matte sạch.
- `foil-mask`: vùng dùng material ép kim.
- `emboss-mask`: vùng dập nổi hoặc dập chìm.
- `roughness`: thay đổi độ nhám theo vùng.
- `highlight`: pass phản sáng có thể điều khiển độc lập.
- `shadow`: bóng minh họa hoặc ambient occlusion nếu concept cần.

Mask là dữ liệu, không được chứa ánh sáng giả hoặc màu nền. Vùng foil phải điều
khiển material thật để highlight đổi theo góc camera.

#### Pattern, texture và surface

Có thể tạo:

- Texture giấy dó, giấy cotton, giấy mỹ thuật và giấy ngọc trai.
- Vân lụa, sợi vải và ribbon.
- Sơn mài đỏ hoặc đen.
- Họa tiết trống đồng.
- Pattern long vân, phượng vũ, hoa sen và hồi văn.
- Normal/height source cho dập nổi.
- Seamless background pattern.

Texture phải tile sạch nếu được dùng lặp. Normal, roughness và height map cần được
derive/cleanup từ source phù hợp; không xem một ảnh màu do AI sinh là dữ liệu PBR
chính xác.

#### Concept art cho vật thể 3D

Image generation dùng để tạo concept, silhouette và texture. Pop-up phức tạp,
die-cut hoặc relief thật đi theo pipeline:

```text
concept image
-> approved silhouette/layers
-> procedural Three.js geometry hoặc Blender
-> glTF
-> material
-> rig/animation
-> optimized runtime asset
```

Không dựng glTF cho một shape đơn giản có thể tạo rẻ và chính xác bằng Three.js.

### Style direction có thể khai thác

Cùng một linh vật phải có khả năng thay đổi visual language theo template:

- Cung đình Việt Nam, nét vàng trên nền sơn son.
- Motif Việt Nam thời Lý/Trần dạng line art.
- Tranh khắc gỗ.
- Watercolor trên lụa.
- Paper-cut nhiều lớp.
- Dập nổi monochrome.
- Men sứ xanh cobalt.
- Sơn mài.
- Art Deco hình học.
- Stained glass.
- Embroidery.
- Chrome/cold luxury.
- Silhouette tối giản.
- 3D paper sculpture.

Nếu dùng motif lịch sử hoặc văn hóa cụ thể, cần reference đủ chính xác để không
trộn đặc điểm rồng/phượng Việt Nam, Trung Hoa, Nhật Bản hoặc fantasy một cách
ngẫu nhiên.

### `AssetBible` bắt buộc

Sau khi asset chủ đạo đầu tiên được duyệt, nó trở thành style reference cho toàn
bộ asset còn lại của template.

```ts
type AssetBible = {
  templateSlug: string;
  culturalDirection: string;
  historicalReference?: string;
  primaryMotifs: string[];
  illustrationStyle: string;
  lineWeight: string;
  palette: string[];
  materialLanguage: string[];
  lightingDirection: string;
  detailLevel: "low" | "medium" | "high";
  symmetryRule: string;
  animationLayers: string[];
  requiredMasks: string[];
  mobileReadabilityRule: string;
  avoid: string[];
};
```

`AssetBible` phải khóa:

- Hình dáng và tỷ lệ linh vật.
- Nét vẽ, mức chi tiết và texture.
- Palette.
- Hướng sáng.
- Material.
- Quy tắc đối xứng/bất đối xứng.
- Layer animation.
- Điều cấm và các lỗi văn hóa cần tránh.

Không để bìa dùng phượng watercolor nhưng bên trong dùng hoa vector phẳng, icon
3D và rồng khắc gỗ không cùng một hệ hình ảnh.

### Prompt production phải được lưu

Mỗi prompt tạo asset phải có tối thiểu:

```text
Use case
Asset type và vị trí sử dụng
Subject
Cultural/historical direction
Style/medium
Pose và composition
Lighting direction
Palette
Materials/textures
Required animation layers
Required masks
Transparent-background requirement
Mobile readability constraint
Must preserve
Avoid
```

Không yêu cầu model sinh chữ trong artwork. Tên cặp đôi, ngày cưới và copy luôn
được render bằng DOM/texture pipeline để đúng chính tả và cá nhân hóa được.

### Quy trình tạo một asset pack

1. Chốt concept, hình dạng mở và vị trí asset trong storyboard.
2. Chốt reference văn hóa/hình thái nếu dùng linh vật truyền thống.
3. Viết `AssetBible`.
4. Generate 2-4 concept variants cho asset chủ đạo.
5. Chọn một direction; không trộn các direction chưa duyệt.
6. Generate master resolution với silhouette và safe padding đúng.
7. Kiểm tra giải phẫu, số chi, cánh, sừng, vuốt, lông và chi tiết đối xứng.
8. Tạo/cleanup alpha.
9. Tách layer animation có chủ đích.
10. Tạo material masks.
11. Tạo texture/pattern hỗ trợ trong cùng style.
12. Test asset trên bìa thật ở closed pose và nhiều góc camera.
13. Test frame giữa opening để kiểm tra occlusion.
14. Test ở mobile để loại chi tiết bị bệt hoặc rung.
15. Optimize runtime format và kích thước.
16. Lưu master, prompt, manifest và asset runtime vào project.

### Cấu trúc thư mục đề xuất

```text
public/chungdoi/templates/<template-slug>/
  source/
    phoenix-master.png
    dragon-master.png
  cover/
    phoenix-left.webp
    phoenix-right.webp
    phoenix-foil-mask.png
    dragon.webp
  materials/
    paper-color.webp
    paper-normal.webp
    foil-roughness.webp
  opening/
    phoenix-body.webp
    phoenix-wing-left.webp
    phoenix-wing-right.webp
    phoenix-tail-front.webp
    phoenix-tail-back.webp
  sections/
    floral-divider.webp
    corner-ornament.webp
    cloud-pattern.webp
  asset-manifest.json
  prompts.md
```

Master source không được ghi đè khi tối ưu runtime. Nếu chỉnh lại asset, tạo
version mới hoặc giữ source có thể phục hồi.

### `asset-manifest.json`

Manifest nên lưu:

```ts
type TemplateAssetManifest = {
  version: number;
  assetBible: string;
  sourcePromptFile: string;
  assets: Array<{
    id: string;
    source: string;
    runtime: string;
    role: "color" | "mask" | "texture" | "shadow" | "animation-layer";
    width: number;
    height: number;
    anchor?: [number, number];
    pivot?: [number, number];
    zLayer?: number;
    mobileVariant?: string;
  }>;
};
```

Anchor, pivot và `zLayer` phải được khai báo khi asset tham gia opening để tránh
hardcode vị trí rải rác trong component.

### Mini asset pack đầu tiên

Với concept long phụng/gatefold, pack thử nghiệm tối thiểu:

```text
dragon-left-color
dragon-left-foil-mask
dragon-left-shadow
phoenix-right-color
phoenix-right-foil-mask
phoenix-right-shadow
front-cloud-layer
back-cloud-layer
paper-color
paper-normal
foil-roughness
asset-manifest
prompts
```

Nếu phượng có cánh hoặc đuôi chuyển động trong opening, bổ sung các layer tương
ứng thay vì cắt chúng từ một ảnh runtime đã nén.

### Lỗi asset phải reject

- Anatomy sai rõ ràng: thừa chân, cánh, vuốt hoặc bộ phận dính vào nhau.
- Hai con đối xứng bằng mirror máy móc nhưng ánh sáng hoặc hình thái không hợp lý.
- Chi tiết văn hóa bị trộn mà không có chủ đích.
- Asset đẹp ở 4K nhưng thành mảng bệt trên mobile.
- Alpha fringe, halo nền hoặc mất lông mảnh.
- Foil/highlight bị bake vào color image nên không phản ứng theo camera.
- Shadow bị bake sai hướng so với lighting rig.
- Style giữa cover, section decoration và icon không nhất quán.
- Có text AI sai chính tả, watermark hoặc signature.
- File runtime quá lớn mà không có mobile variant.
- Không lưu prompt hoặc source master nên không thể tạo tiếp cùng style.

## Performance và quality tier

### Render loop

- Dùng `frameloop="demand"` khi scene đứng yên.
- Gọi invalidate khi drag, GSAP update, resize hoặc material thực sự thay đổi.
- Pause idle animation khi `document.visibilityState !== "visible"`.
- Preload texture, environment và SFX trước khi cho phép bắt đầu opening.
- Unmount Canvas sau handoff.

### Độ phân giải

- Cap DPR mobile khoảng `1-1.5`.
- Desktop có thể lên tới `2` nếu profiling cho phép.
- Không dùng cùng shadow resolution và post-processing quality cho mọi thiết bị.
- Reserve kích thước Canvas/DOM để tránh CLS.

### Quality tier tham chiếu

```text
Desktop mạnh:
physical materials + dynamic shadow + environment đầy đủ

Mobile khá:
physical materials giản lược + shadow resolution thấp

Mobile yếu:
standard materials + baked shadow + ít idle motion

Không có WebGL:
CSS 3D/static two-sided cover + opening fallback ngắn
```

### Reduced motion

- Bỏ orbit travel, camera zoom lớn, parallax và elastic overshoot.
- Vẫn giữ thứ tự state có nghĩa: activate, reveal, handoff.
- Không chỉ đặt mọi duration bằng `0`, vì có thể tạo flash và mất ngữ cảnh.

### Mục tiêu kiểm thử

- `60fps` trên thiết bị phổ thông trong opening.
- Không có long task đáng kể ngay sau click.
- Không có layout shift khi handoff.
- Không double-play sound hoặc timeline.
- Không mất focus sau khi DOM nhận quyền tương tác.

## Công cụ tùy chọn cho tương lai

### Rive

Chỉ thêm Rive khi có asset `.riv` và use case cụ thể:

- Hoa vector nở theo tương tác.
- Chim, bướm hoặc nhân vật minh họa.
- Wax seal/icon có state machine.
- Ornament 2D phản ứng với hover/tap.
- Loading animation mang bản sắc template.

Nếu dùng React runtime, ưu tiên package canvas phù hợp thay vì bundle cả các
backend không cần thiết. Không thêm Rive vào mẫu thí điểm chỉ để có thêm một
animation engine.

### `@react-three/postprocessing`

Chỉ cân nhắc sau khi scene cơ bản đã đúng và profiling đạt yêu cầu:

- Bloom cực nhẹ cho foil, đom đóm hoặc nguồn sáng thực.
- Depth of field trong một khoảnh khắc ngắn.
- Vignette nhẹ có lý do về composition.
- Grain tĩnh và không đặt trên scrolling container.

Không dùng bloom, blur, chromatic aberration hoặc glow như mặc định. Quá tay sẽ
làm thiệp giống game/demo WebGL thay vì một vật phẩm cao cấp.

### Blender và glTF

- Geometry procedural trong Three.js đủ cho gatefold, envelope, sleeve và card
  đơn giản.
- Dùng Blender/glTF khi làm pop-up phức tạp, die-cut, embossed relief hoặc chi
  tiết trang trí có topology khó tạo bằng code.
- Với glTF, tối ưu mesh/texture trước khi ship; không đưa file source nặng vào
  runtime chỉ để tạo một silhouette đơn giản.

## Những công nghệ chưa nên thêm

- Motion/Framer Motion.
- React Spring.
- Anime.js.
- AOS.
- Physics engine như Rapier hoặc Cannon.
- Spline runtime.
- Lottie chỉ để tạo particle hoặc shimmer đơn giản.
- GSAP ScrollTrigger ở mẫu thí điểm.
- WebGPU renderer.

Lý do:

- GSAP đã quản lý timeline DOM và Three Object3D; thêm animation engine khác dễ
  tạo nhiều nguồn ghi lên cùng transform.
- Opening là choreography xác định trước, không cần rigid-body physics.
- Lenis hiện là scroll authority; chưa thêm ScrollTrigger cho tới khi có concept
  thực sự cần pin/scrub.
- WebGPU renderer còn chưa cần thiết cho scope bìa thiệp và làm tăng rủi ro
  compatibility.
- Particle, shimmer và reveal nhỏ có thể làm bằng Three, CSS hoặc Web
  Animations API.

ScrollTrigger chỉ được thêm sau này nếu một concept như Journey Map, Museum hoặc
Storybook thật sự cần scroll-scrub. Khi đó phải thiết kế integration với Lenis
và giữ đúng một nguồn scroll state.

## Lab nội bộ và kiểm thử deterministic

Nên có một route/dev harness riêng cho opening:

- Chọn viewport preset `390x844`, `768x1024`, `1440x900`.
- Chọn DPR và quality tier.
- Bật/tắt reduced motion.
- Scrub timeline từ `0` đến `1`.
- Chụp trạng thái `0%`, `25%`, `50%`, `75%`, `100%`.
- Hiển thị FPS, frame time và số draw call ở development.
- Test click liên tục, drag rồi mở, multi-touch, resize giữa animation và tab
  visibility change.
- Test WebGL fallback.

Playwright có thể seek timeline tới progress xác định để visual regression không
phụ thuộc timing thực tế.

## Nguồn kỹ thuật tham chiếu

- [GSAP Timeline](https://gsap.com/docs/v3/GSAP/Timeline/)
- [GSAP Tween](https://gsap.com/docs/v3/GSAP/Tween/)
- [`gsap.matchMedia()`](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/)
- [`@gsap/react`](https://github.com/greensock/react)
- [Three.js `Object3D`](https://threejs.org/docs/pages/Object3D.html)
- [Three.js `MeshPhysicalMaterial`](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [Three.js WebGPU renderer](https://threejs.org/manual/en/webgpurenderer)
- [React Three Fiber events](https://r3f.docs.pmnd.rs/api/events)
- [React Three Fiber performance scaling](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Drei `Environment`](https://drei.docs.pmnd.rs/staging/environment)
- [Drei `ContactShadows`](https://drei.docs.pmnd.rs/staging/contact-shadows)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [Rive state machines](https://rive.app/docs/runtimes/state-machines)

## Originality gate cho AI và review

Một mẫu chỉ được coi là concept mới khi khác các mẫu hiện có ít nhất `4/5` trục:

1. `navigationModel`: continuous scroll, chapter, map path, windows, page turn...
2. `heroComposition`: gatefold, lock screen, exhibition wall, album cover...
3. `sectionGrammar`: panel, station, page, window, newspaper column...
4. `mediaPresentation`: film strip, gallery wall, loose photo, booklet...
5. `signatureMotion`: fold, route draw, unlock, page turn, vinyl rotation...

Reject nếu khác chủ yếu ở:

- Palette.
- Font.
- Artwork.
- Border/radius.
- Particle.

## Definition of Done cho mẫu thí điểm đầu tiên

- [ ] Concept và renderer family được chốt bằng spec trước khi code.
- [ ] Có bìa click/tap để mở và hoạt động bằng bàn phím.
- [ ] Bìa đóng là vật thể 3D hai mặt, xoay được nhiều góc bằng chuột và touch.
- [ ] Mặt sau, mép/độ dày, lighting và shadow được thiết kế đúng concept.
- [ ] Drag xoay bìa và click mở thiệp không kích hoạt nhầm lẫn.
- [ ] Physical opening model được mô tả trước khi triển khai animation.
- [ ] Bìa và nội dung tạo cảm giác là hai trạng thái của cùng một vật thể.
- [ ] Không dùng fade/swap đơn thuần để thay bìa bằng nội dung.
- [ ] Opening tiếp nối pose 3D hiện tại, không snap về góc mặc định.
- [ ] Frame đầu khớp bìa đóng; frame cuối hand-off liền mạch sang nội dung.
- [ ] Bản lề, transform origin, che khuất và bóng đổ hợp lý với hình dạng thiệp.
- [ ] Có idle, opening và post-open animation cùng một motion language.
- [ ] Opening không chạy lặp/chồng khi click nhiều lần.
- [ ] Reduced motion hoạt động đúng.
- [ ] `TemplateArtDirection` và `AssetBible` đã được chốt trước khi generate.
- [ ] Asset chủ đạo có source master, prompt và manifest.
- [ ] Asset animation đã được tách layer theo pivot/occlusion thực tế.
- [ ] Foil, emboss, roughness hoặc shadow dùng mask/pass đúng vai trò.
- [ ] Asset không có anatomy lỗi, alpha fringe, watermark hoặc text AI.
- [ ] Cover, opening và section decoration cùng một visual language.
- [ ] Asset đọc được trên mobile và có runtime format được tối ưu.
- [ ] Có đủ mọi section/capability khi dữ liệu tồn tại.
- [ ] Logic nghiệp vụ dùng component/service chung.
- [ ] Desktop có composition riêng, không chỉ kéo rộng mobile.
- [ ] Mobile có fallback tự nhiên và không tràn ngang.
- [ ] Map, form, QR, RSVP, album và music control sử dụng được bằng touch.
- [ ] Không có layout shift đáng kể khi asset tải.
- [ ] Animation mượt trên thiết bị phổ thông.
- [ ] Đã kiểm tra bìa đóng, frame giữa opening và nội dung sau mở.
- [ ] Đã kiểm tra mobile, tablet và desktop.
- [ ] Typecheck, unit test, lint error gate và build pass.

## Trình tự thực hiện mẫu đầu tiên

1. Chọn một concept trong roadmap.
2. Chốt `TemplateArtDirection` và `AssetBible`.
3. Viết spec riêng cho concept, gồm desktop storyboard và mobile storyboard.
4. Tạo mini asset pack chủ đạo, material masks và animation layers.
5. Prototype bìa và state machine `closed → opening → handoff → opened`.
6. Hoàn thiện signature opening animation bằng asset thật.
7. Render đủ toàn bộ section với dữ liệu thật.
8. Thêm post-open motion và interaction.
9. Hoàn thiện responsive/mobile fallback và asset mobile variants.
10. Kiểm tra accessibility, reduced motion và performance.
11. Chạy visual gate, asset gate và test tự động.
12. Chỉ sau khi mẫu đầu tiên hoàn chỉnh mới trích primitive dùng lại.
