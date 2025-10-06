# ERP App 배포 가이드

## 서버 정보

- **서버 IP**: 139.59.110.55
- **플랫폼**: DigitalOcean Droplet
- **OS**: Ubuntu 20.04/22.04 (권장)
- **백엔드 포트**: 8000 (내부)
- **프론트엔드 포트**: 80 (외부)

---

## 사전 준비

### 1. 서버 접속 설정

```bash
# SSH 키가 없다면 비밀번호로 접속
ssh root@139.59.110.55

# SSH 키가 있다면
ssh -i ~/.ssh/id_rsa root@139.59.110.55
```

### 2. Supabase 프로젝트 준비

1. [Supabase Dashboard](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 마이그레이션 실행:
   - `backend/supabase/migrations/001_initial_schema.sql` 복사 붙여넣기
3. API 키 확인:
   - Settings → API
   - `anon key` 복사
   - `service_role key` 복사 (주의: 비공개)

### 3. 백엔드 환경 변수 설정

```bash
cd backend
cp .env.example .env
nano .env  # 또는 vi .env
```

다음 값들을 실제 값으로 변경:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=random-secure-string-min-32-chars
```

---

## 배포 방법

### Option A: 자동 배포 스크립트 (권장)

```bash
# 스크립트 실행 권한 부여
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

### Option B: 수동 배포

#### 1. 프론트엔드 빌드

```bash
npm install
npm run build
```

#### 2. 서버 접속 및 디렉토리 생성

```bash
ssh root@139.59.110.55

# 디렉토리 생성
sudo mkdir -p /opt/erp-backend
sudo mkdir -p /var/www/erp-app
```

#### 3. 파일 업로드

로컬에서:

```bash
# 프론트엔드 업로드
scp -r dist/* root@139.59.110.55:/var/www/erp-app/

# 백엔드 업로드
scp -r backend/* root@139.59.110.55:/opt/erp-backend/
```

#### 4. 서버에서 백엔드 설정

```bash
ssh root@139.59.110.55

cd /opt/erp-backend

# Python 가상환경 생성
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install --upgrade pip
pip install -r requirements.txt
```

#### 5. Systemd 서비스 생성

```bash
sudo nano /etc/systemd/system/erp-backend.service
```

다음 내용 입력:

```ini
[Unit]
Description=ERP Backend API (FastAPI)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/erp-backend
Environment="PATH=/opt/erp-backend/venv/bin"
ExecStart=/opt/erp-backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

서비스 시작:

```bash
sudo systemctl daemon-reload
sudo systemctl enable erp-backend
sudo systemctl start erp-backend
sudo systemctl status erp-backend
```

#### 6. Nginx 설정

```bash
sudo apt-get update
sudo apt-get install -y nginx

sudo nano /etc/nginx/sites-available/erp-app
```

다음 내용 입력 (deploy.sh의 Nginx 설정 참조)

```bash
sudo ln -s /etc/nginx/sites-available/erp-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. 방화벽 설정

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable
sudo ufw status
```

---

## 배포 후 확인

### 1. 서비스 상태 확인

```bash
# 백엔드 서비스
sudo systemctl status erp-backend

# Nginx 서비스
sudo systemctl status nginx
```

### 2. 로그 확인

```bash
# 백엔드 로그 실시간 보기
sudo journalctl -u erp-backend -f

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log

# Nginx 액세스 로그
sudo tail -f /var/log/nginx/access.log
```

### 3. API 테스트

```bash
# 헬스체크
curl http://139.59.110.55/api/v1/health

# API 문서 접속
curl http://139.59.110.55/docs
```

브라우저에서:
- **프론트엔드**: http://139.59.110.55
- **API 문서**: http://139.59.110.55/docs
- **로그인**: admin / admin

---

## 업데이트 방법

### 프론트엔드만 업데이트

```bash
# 로컬에서
npm run build
scp -r dist/* root@139.59.110.55:/var/www/erp-app/
```

### 백엔드만 업데이트

```bash
# 로컬에서
scp -r backend/* root@139.59.110.55:/opt/erp-backend/

# 서버에서
ssh root@139.59.110.55
sudo systemctl restart erp-backend
```

### 전체 재배포

```bash
./deploy.sh
```

---

## 트러블슈팅

### 백엔드가 시작되지 않음

```bash
# 로그 확인
sudo journalctl -u erp-backend -n 50

# 수동 실행으로 에러 확인
cd /opt/erp-backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Nginx 에러

```bash
# 설정 파일 테스트
sudo nginx -t

# 에러 로그 확인
sudo tail -f /var/log/nginx/error.log
```

### 데이터베이스 연결 실패

```bash
# .env 파일 확인
cat /opt/erp-backend/.env

# Supabase URL 접근 테스트
curl https://your-project.supabase.co
```

### 방화벽 문제

```bash
# UFW 상태 확인
sudo ufw status

# 포트 열기
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
```

---

## SSL 인증서 추가 (선택사항)

도메인이 있다면 Let's Encrypt로 무료 SSL 인증서를 추가할 수 있습니다:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
sudo systemctl reload nginx
```

---

## 모니터링

### 시스템 리소스 확인

```bash
# CPU, 메모리 사용량
htop

# 디스크 사용량
df -h

# 네트워크 연결
sudo netstat -tulpn | grep LISTEN
```

### 프로세스 확인

```bash
# Python 프로세스
ps aux | grep uvicorn

# Nginx 프로세스
ps aux | grep nginx
```

---

## 백업

### 데이터베이스 백업

Supabase Dashboard에서:
- Database → Backups
- 자동 백업 활성화

### 애플리케이션 파일 백업

```bash
# 백엔드 백업
ssh root@139.59.110.55 "tar -czf /tmp/erp-backend-backup.tar.gz -C /opt erp-backend"
scp root@139.59.110.55:/tmp/erp-backend-backup.tar.gz ./backups/

# 프론트엔드 백업
ssh root@139.59.110.55 "tar -czf /tmp/erp-frontend-backup.tar.gz -C /var/www erp-app"
scp root@139.59.110.55:/tmp/erp-frontend-backup.tar.gz ./backups/
```

---

## 보안 체크리스트

- [ ] SSH 키 기반 인증 사용 (비밀번호 로그인 비활성화)
- [ ] UFW 방화벽 활성화
- [ ] JWT_SECRET 강력한 랜덤 값으로 설정
- [ ] Supabase Service Role Key 안전하게 보관
- [ ] Nginx에 보안 헤더 설정 완료
- [ ] 정기적인 시스템 업데이트 (`sudo apt-get update && sudo apt-get upgrade`)
- [ ] 로그 모니터링 설정
- [ ] SSL 인증서 설치 (프로덕션)

---

## 문의

배포 관련 문제가 있다면 로그를 확인하고 필요 시 도움을 요청하세요.
