import { type NextRequest } from "next/server";

import { createInvitation } from "@/app/dashboard/actions";

/**
 * Kết quả phụ thuộc cookie phiên nên không được cache: cùng một URL, khách chưa
 * đăng nhập phải nhận redirect về /login còn khách đã đăng nhập phải nhận thiệp
 * mới. Thiếu dòng này, response 307 về /login của lượt đầu bị phát lại cho lượt
 * sau và không ai tạo được thiệp.
 */
export const dynamic = "force-dynamic";

/**
 * Chỗ hạ cánh sau khi đăng nhập cho một cú bấm "Tạo thiệp" bị chặn.
 *
 * Ý định tạo thiệp (mẫu nào, tên cô dâu chú rể) nằm trong POST body của form
 * CTA, mà vòng đăng nhập Google chỉ mang được một `?next=` dạng GET. Route này
 * dựng lại FormData đó rồi gọi đúng action cũ, nên khách đi một lượt:
 * bấm CTA → /login → Google → vào thẳng editor với mẫu và tên đã chọn.
 *
 * Không có guard riêng ở đây: `createInvitation` vẫn là cửa duy nhất và tự đẩy
 * về /login nếu session chưa phải account thật, nên gọi trực tiếp URL này lúc
 * chưa đăng nhập cũng không tạo được gì.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const formData = new FormData();
  for (const key of ["templateId", "groomShortName", "brideShortName"] as const) {
    const value = params.get(key);
    if (value) formData.set(key, value);
  }

  // createInvitation luôn kết thúc bằng redirect() nên hàm này không trả về.
  await createInvitation(formData);
}
