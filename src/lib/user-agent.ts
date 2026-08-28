/**
 * Nhận ra tác nhân tự động qua `User-Agent`.
 *
 * Danh sách này ban đầu sống trong `src/lib/invitation-views.ts` để đếm lượt mở
 * thiệp. Nó chuyển ra đây khi endpoint đo click email cần đúng cùng một phép lọc:
 * hai bộ đếm mà dùng hai danh sách khác nhau thì con số của chúng không so được
 * với nhau, và bản nào bị bỏ quên sẽ âm thầm lệch dần.
 *
 * Ba nhóm được chặn: bot chung (`bot`/`crawl`/`spider`/`slurp`), bộ sinh link
 * preview của mạng xã hội (nhóm quan trọng nhất với sản phẩm này — thiệp được gửi
 * qua Zalo, và email cũng bị quét link tương tự), và các HTTP client dùng trong
 * script/giám sát, bao gồm cả trình duyệt headless để script chụp ảnh và Lighthouse
 * không đẩy số lên.
 */
const AUTOMATED_USER_AGENT =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|zalo|twitterbot|slackbot|telegrambot|whatsapp|discord|skypeuripreview|embedly|linkedinbot|pinterest|vkshare|preview|lighthouse|headless|phantomjs|curl|wget|python-requests|go-http-client|node-fetch|axios|okhttp|apache-httpclient|pingdom|uptimerobot/i;

/**
 * `true` khi request không nên được tính là một hành động của người thật.
 *
 * User-agent rỗng cũng tính là tự động: mọi trình duyệt và mail client thật đều
 * gửi header này, nên thiếu nó gần như chắc chắn là script. Sai số nghiêng về phía
 * đếm thiếu, đúng hướng cần cho một con số dùng để ra quyết định.
 */
export function isAutomatedUserAgent(userAgent: string): boolean {
  if (userAgent.trim() === "") return true;
  return AUTOMATED_USER_AGENT.test(userAgent);
}
