# Detective Conan Casebook - pilot specification

## Trạng thái quyết định

- Ngày khóa baseline: 2026-07-31.
- Phạm vi: một mẫu thí điểm duy nhất.
- Slug: `detective-conan-casebook`.
- Renderer family: `casebook-page-turn`.
- Physical carrier: hồ sơ bìa cứng có gáy sách và khối giấy thật trong Three.js.
- Nội dung sau mở: trình đọc DOM toàn màn hình, không dùng luồng cuộn dọc.
- Hướng thị giác: manga trinh thám cao cấp, navy lạnh, giấy ngà và một accent
  đỏ.
- Opening trigger: chỉ native button `Mở hồ sơ`.
- Stack: React Three Fiber/Three.js/Drei, GSAP, React DOM và CSS 3D transform.

## Concept một câu

Shinichi và Ran xuất hiện trên bìa một hồ sơ hôn lễ; khi khách mở bìa, camera
đi vào trang giấy đầu tiên và tiếp tục bằng một cuốn truyện DOM lật từng trang,
mỗi trang là một chương thông tin cùng một nhóm nhân vật.

## Originality gate

| Trục                | Detective Conan Casebook                         | Khác Doraemon Door |
| ------------------- | ------------------------------------------------ | ------------------ |
| `navigationModel`   | Trình đọc phân trang cố định, không cuộn dọc     | Có                 |
| `heroComposition`   | Hồ sơ bìa cứng với cặp đôi inset                 | Có                 |
| `sectionGrammar`    | Dossier, witness note, evidence page, case index | Có                 |
| `mediaPresentation` | Character groups như evidence plates             | Có                 |
| `signatureMotion`   | Mở gáy sách, first-sheet settle, DOM page turn   | Có                 |

Kết quả: khác `5/5` trục. Concept không chỉ đổi nhân vật, màu hoặc font.

## Architecture contract

Three.js chỉ chịu trách nhiệm cho những gì cần cảm giác vật lý:

- bìa cứng, gáy sách, khối giấy, độ dày và contact shadow;
- góc nhìn kiểm tra bìa trước khi mở;
- cover latch, cover turn, first-sheet follow-through và camera settle;
- hai frame chồng lấp cuối cùng để che điểm chuyển renderer.

DOM chịu trách nhiệm cho toàn bộ trải nghiệm đọc:

- text, lịch, gia đình, địa điểm, timeline, lời chúc, RSVP và thông tin quà;
- điều hướng trang, focus, keyboard, live region và deep link;
- responsive typography và single-page mode trên mobile;
- đo chiều rộng tên thực tế và co trục X theo nấc an toàn để cả giới hạn 60 ký
  tự vẫn nằm trên đúng một hàng cho mỗi người;
- CSS 3D page turn hai pha với một sheet nhẹ quay quanh gáy; incoming page nằm
  sẵn bên dưới và full-spread opacity chỉ dùng trong một đoạn crossfade ngắn.

DOM reader được mount ngay từ trạng thái đóng, nhưng ở dưới canvas và không thể
focus. Khi progress vào phase `settle`, trang DOM đầu tiên lấy đúng màu giấy,
aspect ratio và viewport anchor của sheet Three.js. Sau handoff, canvas đổi sang
trạng thái demand-rendered bất động và được giữ ẩn đến replay hoặc route teardown;
không dispose WebGL giữa lúc người dùng đang nhìn transition.

## `TemplateArtDirection`

```ts
const detectiveConanCasebookArtDirection = {
  layoutFamily: "casebook-page-turn",
  coverGeometry:
    "a deep-navy hardbound detective casebook with a raised spine, layered ivory paper block, restrained red evidence seal and Shinichi-Ran wedding portrait inset",
  openingMechanism:
    "the explicit open button releases the cover, the weighted front board turns around its spine, the first sheet lifts and settles into the same rectangle as the pre-mounted DOM reader",
  typography: {
    display: '"SVN-HC Built Titling", HelveticaNeue, sans-serif',
    body: '"HelveticaNeue", "Be Vietnam Pro", sans-serif',
    hierarchy:
      "compact case labels and large centered couple names for short display copy; neutral sans for dates, addresses, controls, forms and long messages",
  },
  colorPalette:
    "midnight navy #081A2E; case blue #123A63; paper #F6F1E7; ink #172437; signal red #C73B45; white #FFFCF5",
  materialPreset:
    "woven navy book cloth, matte ivory paper, painted paper edges, low-gloss inset portrait and a small embossed evidence seal",
  lightingPreset:
    "cool upper-left key, quiet warm bounce from the open paper and a soft contact shadow under the book",
  motionPreset:
    "weighted spine rotation, restrained paper follow-through, camera alignment and overlapping canvas-to-DOM handoff without a visible cut",
  soundPreset:
    "one cover-latch click, a short paper sweep and a soft page-seat cue; shared mute state",
};
```

## `PhysicalOpeningModel`

```ts
const detectiveConanCasebookOpeningModel = {
  object: "casebook",
  openTrigger: "explicit-button",
  closedInteraction: {
    mode: "tilt",
    pointerDrag: true,
    touchDrag: true,
    gestureThresholdPx: 8,
    settleBehavior: "hold",
  },
  hinges: [
    {
      part: "front-cover",
      transformOrigin: "left spine",
    },
    {
      part: "first-sheet",
      transformOrigin: "left paper gutter",
    },
  ],
  durationMs: 1750,
  mobileDurationMs: 1500,
  reducedMotionDurationMs: 220,
};
```

Trạng thái trải nghiệm là:

```text
closed -> opening -> handoff -> opened
```

Timeline mở dùng các label deterministic:

```text
anticipation -> unlock -> cover-turn -> page-reveal -> settle -> handoff
```

## Storyboard desktop

Target full-motion duration: khoảng `1750ms`.

|  Progress | Phase          | Hành động                                                 |
| --------: | -------------- | --------------------------------------------------------- |
|    `0-6%` | `anticipation` | Seal và bìa phản hồi ngay, không có dead beat sau click.  |
|   `3-14%` | `unlock`       | Latch thả trong khi bìa đã bắt đầu chuyển động.           |
|   `6-67%` | `cover-turn`   | Front cover quay liên tục quanh gáy bằng ease cân bằng.   |
|  `22-70%` | `page-reveal`  | First sheet lift rõ rồi hạ xuống, không có pose reset.    |
|  `31-78%` | `settle`       | Camera và thân sách về góc đọc trong lúc bìa còn chạy.    |
| `78-100%` | `handoff`      | DOM crossfade vào; canvas ngủ ẩn thay vì bị dispose.      |

Không reset pose ngay frame đầu. Pose do khách kéo phải được đưa vào tween để
tránh snap.

## Storyboard mobile

Target full-motion duration: khoảng `1500ms`.

- Sách bắt đầu nhỏ hơn để luôn thấy rõ gáy và mép bìa ở viewport `360px`.
- Camera widen trước khi front cover đi qua đường giữa màn hình.
- Góc cover turn ngắn hơn desktop, first sheet chỉ lift nhẹ.
- DOM vào single-page mode ngay khi handoff, không tạo spread hai trang hẹp.
- Vùng swipe nằm trong viewport reader nhưng không chặn native button.
- Tên Shinichi và Ran luôn ở hai hàng riêng khi chiều rộng không đủ.

## Reduced motion

- Duration `220ms`.
- Vẫn giữ thứ tự latch response, reveal và focus handoff.
- Không orbit, camera dolly lớn hoặc paper follow-through.
- Bìa đổi bằng transform ngắn và trang DOM crossfade vào đúng geometry.
- Page turn trong reader đổi thành crossfade có hướng.

## Reader navigation model

Reader chiếm `100dvh` và khóa document overflow trong lúc mở. Đây không phải
một landing page cuộn dọc.

- Desktop từ `768px`: spread hai trang, nhưng mỗi lần điều hướng chỉ tiến một
  chương.
- Tablet và mobile: một trang duy nhất.
- Input: nút trước/sau, phím `ArrowLeft`/`ArrowRight`, swipe ngang và chapter
  index.
- URL dùng query `?chapter=...` để reload, back và forward có ý nghĩa.
- Khi idle, mount trang hiện tại và hàng xóm để ảnh được tải trước. Khi lật chỉ
  giữ outgoing + incoming; hàng xóm mới chỉ mount sau transition.
- State machine `preparing -> running -> idle` dành hai RAF để promote/raster
  layer trước khi đổi transform; focus và `inert` chỉ đổi khi motion kết thúc.
- Mỗi group nhân vật chỉ render một `<picture>` art-directed bằng
  `getImageProps`; desktop và mobile không mount hai bản ảnh trùng nhau.
- Nội dung dài phải tách thành nhiều trang hoặc mở trong overlay có focus trap;
  không cho trang tự kéo dài rồi phát sinh cuộn dọc.
- Ở demo production trên mobile, trang sách chừa dải trên và gutter phải cho
  CTA, replay và music controls; control không được phủ lên mặt giấy.
- Overlay heading lặp lại thông tin trên bìa vật lý được ẩn ở production dưới
  breakpoint desktop rộng; tên và ngày vẫn hiện trực tiếp trên mặt bìa, còn CTA
  không thể chồng lên heading.

## Chapter map

| Chương       | Nhóm nhân vật                           | Nội dung chính                               |
| ------------ | --------------------------------------- | -------------------------------------------- |
| `cover`      | Shinichi, Ran                           | Tên hai người, ngày cưới, CTA mở hồ sơ       |
| `invitation` | Conan, Kogoro                           | Lời mời và thông điệp mở đầu                 |
| `families`   | Không cần art mới                       | Gia đình hai bên trên hai witness sheets     |
| `schedule`   | Ayumi, Genta, Agasa, Haibara, Mitsuhiko | Lịch trình dạng list dọc                     |
| `ceremonies` | Heiji, Kazuha, Sonoko, Masumi           | Hai lễ, địa điểm, calendar và map CTA        |
| `allies`     | Shuichi Akai, Rei Furuya                | Album, dress code và các ghi chú khách mời   |
| `wishes`     | Evidence notes                          | Lời chúc, form gửi lời chúc và thông tin quà |
| `finale`     | Tái bố cục năm group asset              | Lời cảm ơn và kết thúc hồ sơ                 |

## Page-turn motion contract

- Dùng CSS `perspective`, `transform-origin` tại gáy và rotation theo trục Y.
- Chỉ animate `transform` và `opacity`; không tween width, height hoặc layout.
- Trang outgoing ở trên trong nửa đầu, trang incoming đổi stacking ở điểm
  giữa.
- Khoảng bấm liên tiếp bị khóa trong lúc turn đang chạy.
- Swipe threshold không nhỏ hơn `36px`; drag nhỏ hơn threshold trở về trang cũ.
- Không dùng animation vô hạn cho nhân vật.
- Reduced motion không render mặt sau xoay qua camera.

## Asset bible

| Asset group            | Cast                                    | Vai trò            | Format          |
| ---------------------- | --------------------------------------- | ------------------ | --------------- |
| `shinichi-ran-wedding` | Shinichi, Ran                           | Bìa và finale      | Portrait alpha  |
| `conan-kogoro`         | Conan, Kogoro                           | Invitation dossier | Portrait alpha  |
| `detective-boys`       | Ayumi, Genta, Agasa, Haibara, Mitsuhiko | Schedule           | Landscape alpha |
| `heiji-friends`        | Heiji, Kazuha, Sonoko, Masumi           | Ceremony/friends   | Landscape alpha |
| `akai-furuya`          | Shuichi Akai, Rei Furuya                | Allies             | Portrait alpha  |

Asset style là cel-shaded detective anime thống nhất. Không bake text, page,
shadow hoặc background vào character PNG. Paper, cover cloth, seal, halftone và
speed-line motif được dựng ở runtime để giữ khả năng đổi màu và responsive.

## Asset pack v1

```text
public/chungdoi/templates/detective-conan-casebook/
  characters/
    source/
      shinichi-ran-wedding.png
      conan-kogoro.png
      detective-boys.png
      heiji-friends.png
      akai-furuya.png
    shinichi-ran-wedding.webp
    shinichi-ran-wedding.mobile.webp
    conan-kogoro.webp
    conan-kogoro.mobile.webp
    detective-boys.webp
    detective-boys.mobile.webp
    heiji-friends.webp
    heiji-friends.mobile.webp
    akai-furuya.webp
    akai-furuya.mobile.webp
  asset-manifest.json
```

## Performance budget

- Chỉ preload cặp Shinichi/Ran trước khi mở.
- Tải nhóm Conan/Kogoro khi app idle hoặc ngay sau intent mở.
- Các group còn lại tải theo chapter kế tiếp.
- Canvas device pixel ratio phải có trần trên mobile.
- Không render character raster thành nhiều Three texture trùng nhau.
- Canvas dùng DPR `1` trên mobile và tối đa `1.25` trên desktop; sau handoff giữ
  nguyên context ở `frameloop="demand"`, chỉ dispose khi rời route.
- DOM reader không dùng backdrop blur diện rộng.
- Main-thread page turn không được layout-thrash; transform layer có lifecycle
  hữu hạn.

## Accessibility and interaction

- `Mở hồ sơ` là button thật, có focus ring và nhãn rõ ràng.
- Canvas không phải control mở.
- Reader có heading, progress text và live region báo tên chương.
- Điều khiển trước/sau có disabled state ở hai đầu.
- Keyboard không bị phụ thuộc hover.
- Sau handoff, focus chuyển vào heading trang đầu.
- Khi đóng overlay hoặc gift drawer, focus quay về trigger.
- Màu đỏ không là tín hiệu duy nhất cho trạng thái.

## Acceptance gates

- Bìa đóng chỉ có Shinichi và Ran.
- Chỉ button mở hồ sơ; drag không mở.
- Frame đầu của opening không snap khỏi pose người dùng.
- Cover turn và first-sheet follow-through đọc được như một vật thể có gáy.
- DOM đã mount trước handoff và không tạo flash trắng.
- Canvas còn attached nhưng stage opacity `0`, pointer-events tắt và không chạy
  frame sau two-frame handoff.
- Không có document scroll dọc hoặc scroll ngang ở `360`, `390`, `430`,
  `768`, `1280` và `1440px`.
- Tên cô dâu và chú rể không bị cắt; mobile cho phép hai hàng rõ ràng.
- Schedule và wishes là list dọc trong từng trang.
- Arrow keys, swipe, deep link, back/forward và replay đều hoạt động.
- Reduced motion, double-click guard và focus transfer đều pass.
- Typecheck, lint, build và E2E pass.
