# Cloudflare — vận hành DNS & Deploy

Ghi chú vận hành cho domain `thiepmungonline.com` chạy qua Cloudflare Tunnel.

## 1. API Token

Token được lưu cục bộ trong `.env.local` (đã nằm trong `.gitignore`, **không commit**):

```bash
CF_API_TOKEN=cfut_...   # xem trong .env.local, không paste ra ngoài
```

Quyền tối thiểu khi tạo token trên https://dash.cloudflare.com/profile/api-tokens:

- `Zone / DNS / Edit`
- `Zone / Zone / Read`
- Zone Resources: `Include / Specific zone / thiepmungonline.com`

Nạp token vào shell trước khi chạy các lệnh bên dưới:

```bash
export CF_API_TOKEN=$(grep '^CF_API_TOKEN=' .env.local | cut -d= -f2)
```

## 2. Kiểm tra token

```bash
curl -s "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CF_API_TOKEN"
```

Kỳ vọng: `"status":"active"` và `"This API Token is valid and active"`.

## 3. Lấy Zone ID

```bash
curl -s "https://api.cloudflare.com/client/v4/zones?name=thiepmungonline.com" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"][0]["id"])'
```

Zone ID hiện tại: `b44abf6ca6658ea5d6c08b10cc14583d`

## 4. Xem DNS records

```bash
ZONE=b44abf6ca6658ea5d6c08b10cc14583d
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  | python3 -c 'import sys,json;[print(r["type"],r["name"],"->",r["content"],"proxied:",r["proxied"]) for r in json.load(sys.stdin)["result"]]'
```

## 5. Cấu hình DNS hiện tại (đã xác minh)

Cả root và `www` trỏ vào cùng một Cloudflare Tunnel, đều `proxied`:

```
CNAME thiepmungonline.com      -> 82b89851-396e-4501-af77-89e2bcf15a01.cfargotunnel.com (proxied)
CNAME www.thiepmungonline.com  -> 82b89851-396e-4501-af77-89e2bcf15a01.cfargotunnel.com (proxied)
```

Tunnel ID: `82b89851-396e-4501-af77-89e2bcf15a01`

> ⚠️ **QUAN TRỌNG — tunnel phải cùng account với zone.**
> CNAME `<id>.cfargotunnel.com` chỉ resolve khi tunnel **thuộc đúng account sở hữu zone**.
> - Zone `thiepmungonline.com` thuộc account `aac47b13496acc81581f936f0d10ee3d` (Vietducspk@gmail.com).
> - Tunnel `82b89851` (token trong `docker-compose.yml` của app) cùng account này → OK.
> - Từng gặp sự cố: DNS trỏ nhầm tunnel `2b6c73db...` (account khác `c7eca8...`) → Cloudflare trả **HTTP 530 / error 1033** dù tunnel vẫn "connected". Nếu thấy 530, việc đầu tiên là so `AccountTag` của tunnel với account của zone.

## 6. Tạo / cập nhật record (khi cần)

Tạo mới CNAME proxied:

```bash
ZONE=b44abf6ca6658ea5d6c08b10cc14583d
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"thiepmungonline.com","content":"82b89851-396e-4501-af77-89e2bcf15a01.cfargotunnel.com","proxied":true}'
```

Cập nhật record đã có (cần `record_id` lấy từ bước 4, thêm field `"id"`):

```bash
curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records/<RECORD_ID>" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"thiepmungonline.com","content":"82b89851-396e-4501-af77-89e2bcf15a01.cfargotunnel.com","proxied":true}'
```
