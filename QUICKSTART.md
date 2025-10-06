# 🚀 빠른 시작 가이드

## 배포 전 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] Supabase 마이그레이션 실행 완료
- [ ] SSH로 서버 접속 가능 (139.59.110.55)
- [ ] 로컬에서 프로젝트 빌드 가능

---

## 1단계: Supabase 설정 (5분)

### 1.1 프로젝트 생성

1. https://supabase.com 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `imac-erp-app`
   - Database Password: 강력한 비밀번호 입력
   - Region: `Northeast Asia (Seoul)` 선택

### 1.2 마이그레이션 실행

1. Supabase Dashboard → SQL Editor
2. 다음 파일 내용을 복사 붙여넣기:
   ```
   backend/supabase/migrations/001_initial_schema.sql
   ```
3. "RUN" 버튼 클릭

### 1.3 API 키 확인

1. Supabase Dashboard → Settings → API
2. 다음 값들을 메모장에 복사:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` public key
   - `service_role` secret key

---

## 2단계: 로컬 환경 설정 (2분)

```bash
# 프로젝트 디렉토리로 이동
cd /Users/kjimi/Documents/GitHub/imac-erp-app

# 환경 변수 템플릿 생성
./setup-env.sh

# backend/.env 파일 편집
nano backend/.env
# 또는
code backend/.env
```

**backend/.env 파일에 다음 값들을 입력:**

```bash
SUPABASE_URL=https://xxxxx.supabase.co  # 1.3에서 복사한 URL
SUPABASE_ANON_KEY=eyJhbGc...            # 1.3에서 복사한 anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...    # 1.3에서 복사한 service_role key
JWT_SECRET=이미_생성된_랜덤_값_그대로_유지
```

저장하고 닫기 (nano: Ctrl+X → Y → Enter)

---

## 3단계: 서버 접속 확인 (1분)

```bash
# SSH 접속 테스트
ssh root@139.59.110.55

# 접속 성공 시
exit
```

**접속이 안 되는 경우:**
- 비밀번호를 확인하세요
- 또는 SSH 키를 설정해야 할 수 있습니다

---

## 4단계: 배포 실행 (10-15분)

```bash
# 전체 자동 배포
./deploy.sh
```

배포 스크립트가 다음 작업들을 자동으로 수행합니다:
1. ✅ 프론트엔드 빌드
2. ✅ 서버에 파일 업로드
3. ✅ Python 환경 설정
4. ✅ Nginx 설정
5. ✅ Systemd 서비스 등록
6. ✅ 방화벽 설정

**예상 소요 시간**: 10-15분

---

## 5단계: 배포 확인 (1분)

```bash
# 서버 상태 확인
./server-status.sh
```

**정상 출력 예시:**
```
🔍 Checking ERP App Server Status

📊 Service Status:
Backend Service:
  ✅ Running

Nginx Service:
  ✅ Running

🌐 Endpoint Tests:
Frontend: ✅ http://139.59.110.55
Backend API: ✅ http://139.59.110.55/api/v1
API Docs: ✅ http://139.59.110.55/docs
```

---

## 6단계: 브라우저에서 접속

### 프론트엔드
**URL**: http://139.59.110.55

**로그인 정보**:
- ID: `admin`
- PW: `admin`

### API 문서
**URL**: http://139.59.110.55/docs

FastAPI Swagger UI에서 API를 테스트할 수 있습니다.

---

## 업데이트 방법

### 프론트엔드만 업데이트 (1분)

코드 변경 후:

```bash
./quick-deploy.sh
```

### 백엔드 업데이트 (2분)

```bash
# 백엔드 파일 업로드
scp -r backend/* root@139.59.110.55:/opt/erp-backend/

# 서버에서 재시작
ssh root@139.59.110.55 "sudo systemctl restart erp-backend"
```

### 전체 재배포 (10분)

```bash
./deploy.sh
```

---

## 트러블슈팅

### ❌ "Connection refused"

```bash
# 방화벽 확인
ssh root@139.59.110.55
sudo ufw status

# 포트 열기
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
```

### ❌ 백엔드 서비스가 시작되지 않음

```bash
# 로그 확인
ssh root@139.59.110.55
sudo journalctl -u erp-backend -n 50

# 수동 실행으로 에러 확인
cd /opt/erp-backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### ❌ Supabase 연결 실패

```bash
# .env 파일 확인
ssh root@139.59.110.55
cat /opt/erp-backend/.env

# Supabase URL이 올바른지 확인
# API 키가 올바른지 확인
```

### ❌ 404 Not Found

```bash
# Nginx 설정 확인
ssh root@139.59.110.55
sudo nginx -t
sudo systemctl reload nginx
```

---

## 자주 사용하는 명령어

### 로그 실시간 보기

```bash
# 백엔드 로그
ssh root@139.59.110.55 "sudo journalctl -u erp-backend -f"

# Nginx 에러 로그
ssh root@139.59.110.55 "sudo tail -f /var/log/nginx/error.log"
```

### 서비스 재시작

```bash
# 백엔드만
ssh root@139.59.110.55 "sudo systemctl restart erp-backend"

# Nginx만
ssh root@139.59.110.55 "sudo systemctl reload nginx"

# 전체
ssh root@139.59.110.55 "sudo systemctl restart erp-backend nginx"
```

### 서버 상태 확인

```bash
# CPU, 메모리 사용량
ssh root@139.59.110.55 "htop"

# 디스크 사용량
ssh root@139.59.110.55 "df -h"

# 프로세스 확인
ssh root@139.59.110.55 "ps aux | grep uvicorn"
```

---

## 다음 단계

배포가 완료되었다면:

1. ✅ Items/Stocks/Inbounds API 테스트
2. ✅ Outbounds API 연동 작업 시작
3. ✅ 사용자 추가 및 권한 설정
4. ✅ 데이터 백업 설정
5. ✅ SSL 인증서 설정 (도메인이 있는 경우)

자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md) 참조

---

## 도움이 필요하신가요?

문제가 해결되지 않으면:
1. 로그를 확인하세요 (`journalctl -u erp-backend -n 50`)
2. [DEPLOYMENT.md](./DEPLOYMENT.md)의 트러블슈팅 섹션 참조
3. 에러 메시지를 복사하여 문의하세요
