# ERP 시스템 보안 체크리스트

## 개요

운영 환경의 보안 상태를 점검하고 개선하기 위한 체크리스트입니다.

---

## 🔴 Critical (즉시 조치 필요)

### 1. Supabase Service Role Key 보호

#### 현재 상태 점검

```bash
# .env 파일 권한 확인
ssh root@139.59.110.55 "ls -la /opt/erp-backend/.env"

# Git 추적 여부 확인
git ls-files | grep "\.env$"

# 프론트엔드 번들에 노출 여부 확인
grep -r "SUPABASE_SERVICE_ROLE_KEY" dist/
```

#### 필수 조치

```bash
# 1. .env 파일 권한 600 설정
ssh root@139.59.110.55 "chmod 600 /opt/erp-backend/.env"

# 2. 소유자를 서비스 실행 유저로 변경
ssh root@139.59.110.55 "chown root:root /opt/erp-backend/.env"

# 3. .gitignore에 .env 추가 (이미 되어있어야 함)
echo ".env" >> .gitignore
echo "backend/.env" >> .gitignore

# 4. Git 히스토리에서 제거 (노출된 경우)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

#### 보안 등급

- ✅ **안전**: .env 파일 권한 600, Git 미추적, 프론트엔드 번들 미포함
- ⚠️ **경고**: .env 파일 권한 644, Git 추적됨
- 🔴 **위험**: Service Role Key가 프론트엔드 번들에 포함, 공개 리포지토리 노출

---

### 2. JWT Secret 강도 확인

#### 현재 상태 점검

```bash
# JWT_SECRET 길이 확인
ssh root@139.59.110.55 "grep JWT_SECRET /opt/erp-backend/.env | wc -c"
```

#### 필수 조치

```bash
# 최소 32자 이상의 랜덤 시크릿 생성
openssl rand -base64 32

# .env에 업데이트
JWT_SECRET=<generated_secret>

# 서비스 재시작
ssh root@139.59.110.55 "systemctl restart erp-engine.service"
```

#### 보안 등급

- ✅ **안전**: 32자 이상, 랜덤 생성, 주기적 로테이션
- ⚠️ **경고**: 16~31자, 단순 문자열
- 🔴 **위험**: 16자 미만, "secret123" 같은 약한 문자열

---

### 3. 프론트엔드에서 Supabase 직접 호출 금지

#### 현재 상태 점검

```bash
# 프론트엔드 코드에서 @supabase/supabase-js 사용 확인
grep -r "@supabase/supabase-js" src/

# createClient 호출 확인
grep -r "createClient" src/
```

#### 필수 조치

```bash
# 프론트엔드에서 Supabase 패키지 제거
npm uninstall @supabase/supabase-js

# API 클라이언트로만 통신
# src/shared/services/apiClient.ts 사용
```

#### 보안 등급

- ✅ **안전**: 프론트엔드는 API만 호출, Supabase는 백엔드만 접근
- 🔴 **위험**: 프론트엔드에서 Supabase 직접 호출, Service Role Key 노출 가능성

---

## 🟡 High (1주일 내 조치)

### 4. SSH 키 기반 인증

#### 현재 상태 점검

```bash
# 비밀번호 인증 활성화 여부 확인
ssh root@139.59.110.55 "grep PasswordAuthentication /etc/ssh/sshd_config"
```

#### 권장 조치

```bash
# 1. SSH 키 생성 (로컬)
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 서버에 공개키 등록
ssh-copy-id root@139.59.110.55

# 3. 비밀번호 인증 비활성화
ssh root@139.59.110.55 "sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config"
ssh root@139.59.110.55 "sudo systemctl restart sshd"
```

---

### 5. Nginx 보안 헤더

#### 현재 상태 점검

```bash
# 응답 헤더 확인
curl -I http://139.59.110.55/ | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security"
```

#### 권장 조치

```nginx
# /etc/nginx/sites-available/erp-app

server {
    listen 80;
    server_name 139.59.110.55;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # SSL/TLS (도메인 있을 경우)
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ...
}
```

```bash
# 적용
ssh root@139.59.110.55 "sudo nginx -t && sudo systemctl reload nginx"
```

---

### 6. UFW 방화벽 규칙

#### 현재 상태 점검

```bash
# UFW 상태 확인
ssh root@139.59.110.55 "sudo ufw status"

# 열린 포트 확인
ssh root@139.59.110.55 "sudo netstat -tulpn | grep LISTEN"
```

#### 권장 조치

```bash
# 1. 필수 포트만 허용
ssh root@139.59.110.55 "sudo ufw allow 22/tcp"   # SSH
ssh root@139.59.110.55 "sudo ufw allow 80/tcp"   # HTTP
ssh root@139.59.110.55 "sudo ufw allow 443/tcp"  # HTTPS

# 2. 내부 포트 차단 (8000, 8001은 localhost만 접근)
# Nginx 프록시로만 접근 가능

# 3. UFW 활성화
ssh root@139.59.110.55 "sudo ufw --force enable"

# 4. 상태 확인
ssh root@139.59.110.55 "sudo ufw status verbose"
```

---

## 🟢 Medium (1개월 내 조치)

### 7. SSL/TLS 인증서 (도메인 필요)

#### 준비사항

- 도메인 네임 (예: erp.example.com)
- DNS A 레코드: erp.example.com → 139.59.110.55

#### 권장 조치

```bash
# 1. Certbot 설치
ssh root@139.59.110.55 "sudo apt-get install -y certbot python3-certbot-nginx"

# 2. SSL 인증서 발급
ssh root@139.59.110.55 "sudo certbot --nginx -d erp.example.com"

# 3. 자동 갱신 확인
ssh root@139.59.110.55 "sudo certbot renew --dry-run"
```

---

### 8. 정기적인 시스템 업데이트

#### 현재 상태 점검

```bash
# 업데이트 가능한 패키지 확인
ssh root@139.59.110.55 "sudo apt-get update && sudo apt-get -s upgrade | grep -P '^\d+ upgraded'"
```

#### 권장 조치

```bash
# 1. 월 1회 시스템 업데이트
ssh root@139.59.110.55 "sudo apt-get update && sudo apt-get upgrade -y"

# 2. 보안 업데이트 자동 설치 (optional)
ssh root@139.59.110.55 "sudo apt-get install -y unattended-upgrades"
ssh root@139.59.110.55 "sudo dpkg-reconfigure -plow unattended-upgrades"
```

---

### 9. 로그 모니터링

#### 권장 조치

```bash
# 1. Fail2ban 설치 (SSH 브루트포스 방어)
ssh root@139.59.110.55 "sudo apt-get install -y fail2ban"

# 2. 로그 보관 기간 설정
ssh root@139.59.110.55 "sudo journalctl --vacuum-time=30d"

# 3. 정기 로그 점검
ssh root@139.59.110.55 "sudo journalctl -u erp-engine.service --since today | grep -i error"
ssh root@139.59.110.55 "sudo tail -100 /var/log/nginx/error.log"
```

---

### 10. Supabase RLS (Row Level Security)

#### Supabase Dashboard에서 설정

```sql
-- items 테이블 RLS 활성화
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 인증된 사용자
CREATE POLICY "Allow read for authenticated users"
ON items FOR SELECT
TO authenticated
USING (true);

-- 쓰기 정책: manager 역할만
CREATE POLICY "Allow write for managers"
ON items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.email = auth.jwt()->>'email'
    AND user_roles.role = 'manager'
  )
);
```

---

## 🔵 Low (3개월 내 조치)

### 11. 백업 자동화

```bash
# 1. Supabase 자동 백업 활성화 (Dashboard)
# Database → Backups → Enable Daily Backups

# 2. 애플리케이션 파일 백업 (주간)
# crontab -e
0 2 * * 0 tar -czf /backup/erp-backend-$(date +\%Y\%m\%d).tar.gz /opt/erp-backend
```

---

### 12. 감사 로그 (Audit Trail)

```python
# backend/app/middleware/audit.py

@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    """모든 POST/PUT/PATCH/DELETE 요청을 flows에 기록"""
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        # flows 테이블에 기록
        await log_to_flows(
            method=request.method,
            path=request.url.path,
            user=request.state.user,
            timestamp=datetime.utcnow()
        )
    response = await call_next(request)
    return response
```

---

### 13. Rate Limiting

```python
# backend/app/middleware/rate_limit.py

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/v1/items")
@limiter.limit("100/minute")
async def get_items():
    # ...
    pass
```

---

## 보안 점검 스크립트

자동화된 보안 점검:

```bash
#!/bin/bash
# security-check.sh

echo "🔒 ERP Security Check"

# 1. .env 파일 권한
echo "📄 Checking .env permissions..."
ssh root@139.59.110.55 "ls -la /opt/erp-backend/.env | awk '{print \$1}'"

# 2. 열린 포트
echo "🔓 Checking open ports..."
ssh root@139.59.110.55 "sudo netstat -tulpn | grep LISTEN"

# 3. UFW 상태
echo "🛡️ Checking firewall status..."
ssh root@139.59.110.55 "sudo ufw status"

# 4. SSL 인증서
echo "🔐 Checking SSL certificate..."
curl -I https://erp.example.com 2>&1 | grep -E "SSL|TLS"

# 5. 최근 로그인 시도
echo "👤 Checking recent login attempts..."
ssh root@139.59.110.55 "sudo last -10"

# 6. 서비스 상태
echo "⚙️ Checking service status..."
ssh root@139.59.110.55 "systemctl is-active erp-engine nginx"

echo "✅ Security check complete"
```

---

## 보안 등급 체계

### Level 1: Critical (즉시 조치)

- [ ] Service Role Key 권한 600
- [ ] JWT Secret 32자 이상
- [ ] 프론트엔드 Supabase 직접 호출 금지

### Level 2: High (1주일)

- [ ] SSH 키 기반 인증
- [ ] Nginx 보안 헤더
- [ ] UFW 방화벽 활성화

### Level 3: Medium (1개월)

- [ ] SSL/TLS 인증서
- [ ] 정기 시스템 업데이트
- [ ] 로그 모니터링
- [ ] Supabase RLS

### Level 4: Low (3개월)

- [ ] 백업 자동화
- [ ] 감사 로그
- [ ] Rate Limiting

---

## 정기 점검 주기

- **일간**: 로그 확인, 서비스 상태
- **주간**: 백업 확인, 업데이트 적용
- **월간**: 보안 점검 스크립트 실행, 액세스 로그 분석
- **분기**: JWT Secret 로테이션, Supabase Key 로테이션

---

**Last Updated**: 2025-10-06  
**Version**: 1.0.0
