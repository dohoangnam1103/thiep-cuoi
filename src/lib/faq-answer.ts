export type FaqAnswerBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

/**
 * Câu trả lời trong `messages/*.json` dùng `\n\n` để ngắt khối và `\n` để ngắt
 * từng dòng danh sách bên trong một khối. Khối một dòng là đoạn văn, khối nhiều
 * dòng là danh sách gạch đầu dòng xếp sát nhau.
 *
 * Tách ra khỏi component vì có hai chỗ dựng khối hỏi đáp với vỏ khác nhau
 * (`chungdoi-faq.tsx` và chương hỏi đáp của trang chủ V9) nhưng cùng đọc một
 * định dạng câu trả lời. Nếu chỉ một chỗ phân tích, chỗ còn lại in ra danh sách
 * mất dấu đầu dòng.
 */
export function parseFaqAnswer(text: string): FaqAnswerBlock[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines) =>
      lines.length > 1
        ? ({ type: "list", items: lines } satisfies FaqAnswerBlock)
        : ({ type: "paragraph", text: lines[0] } satisfies FaqAnswerBlock),
    );
}
