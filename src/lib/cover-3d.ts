/**
 * Mặc định của công tắc bìa 3D, dùng được ở CẢ client và server.
 *
 * Tách khỏi `cover-3d-config.ts` vì file đó là `"server-only"` (nó chạm Prisma),
 * mà `chungdoi-demo.tsx` là client component cần cùng giá trị mặc định này cho
 * prop `cover3dEnabled`.
 *
 * Tắt: bìa 3D chặn màn hình tới khi tải xong chunk three.js và chụp DOM thành
 * texture — đo trên `long-phung-v3-do` ở Fast 4G + CPU x4 là ~4,9s so với ~1,5s
 * của bìa 2D. Quên truyền prop ở một call site thì hệ quả là bìa nhanh, không
 * phải bìa nặng.
 */
export const DEFAULT_COVER_3D_ENABLED = false;
