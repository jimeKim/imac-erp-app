# Blue-Green 배포 가이드

## 개요

Zero-downtime 배포를 위한 Blue-Green 배포 전략입니다. 두 개의 백엔드 인스턴스를 준비하고, Nginx에서 트래픽을 스위칭합니다.

---

## 아키텍처

```
[Nginx :80]
    ↓
    ├─ Blue  → 127.0.0.1:8000 (현재 운영)
    └─ Green → 127.0.0.1:8001 (대기/새 버전)
```

### 배포 흐름

```
1. Blue (8000) 운영 중
2. Green (8001)에 새 버전 배포
3. Green (8001) 헬스체크 통과
4. Nginx 스위치: 8000 → 8001
5. Blue (8000) 중지/업데이트
6. 다음 배포 시 역할 교체
```

---

## 설정 방법

### 1. systemd 서비스 파일 생성

#### Blue 서비스 (8000)

```bash
sudo nano /etc/systemd/system/erp-engine-blue.service
```

```ini
[Unit]
Description=ERP Engine API (Blue - Port 8000)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/erp-backend
Environment="PATH=/opt/erp-backend/venv/bin"
Environment="ENGINE_ENV=production"
ExecStart=/opt/erp-backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 5
Restart=always
RestartSec=3
EnvironmentFile=/opt/erp-backend/.env

[Install]
WantedBy=multi-user.target
```

#### Green 서비스 (8001)

```bash
sudo nano /etc/systemd/system/erp-engine-green.service
```

```ini
[Unit]
Description=ERP Engine API (Green - Port 8001)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/erp-backend-green
Environment="PATH=/opt/erp-backend-green/venv/bin"
Environment="ENGINE_ENV=production"
ExecStart=/opt/erp-backend-green/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 5
Restart=always
RestartSec=3
EnvironmentFile=/opt/erp-backend-green/.env

[Install]
WantedBy=multi-user.target
```

### 2. Nginx Upstream 설정

```bash
sudo nano /etc/nginx/sites-available/erp-app
```

```nginx
# Upstream 정의 (스위칭 대상)
upstream erp_backend {
    server 127.0.0.1:8000;  # Blue (현재 운영)
    # server 127.0.0.1:8001;  # Green (대기)
}

server {
    listen 80;
    server_name 139.59.110.55;

    # 프론트엔드
    location / {
        root /var/www/erp-app;
        try_files $uri $uri/ /index.html;
    }

    # API 라우팅
    location /api/ {
        proxy_pass http://erp_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # Blue-Green 헬스체크
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 헬스체크
    location /healthz {
        proxy_pass http://erp_backend/healthz;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## 배포 스크립트

### Blue → Green 스위치

```bash
#!/bin/bash
# blue-to-green.sh

set -e

echo "🔵 → 🟢 Blue to Green Deployment"

# 1. Green 디렉토리 준비
echo "📦 Step 1: Preparing Green environment..."
sudo rsync -a /opt/erp-backend/ /opt/erp-backend-green/
cd /opt/erp-backend-green

# 2. 새 코드 업로드 (이미 완료되었다고 가정)
echo "✅ Code synced to Green"

# 3. Green 서비스 시작
echo "🚀 Step 2: Starting Green service (8001)..."
sudo systemctl start erp-engine-green
sleep 5

# 4. Green 헬스체크
echo "🏥 Step 3: Health check on Green..."
for i in {1..10}; do
    if curl -f http://127.0.0.1:8001/healthz > /dev/null 2>&1; then
        echo "✅ Green is healthy!"
        break
    fi
    echo "⏳ Waiting for Green... ($i/10)"
    sleep 3
    if [ $i -eq 10 ]; then
        echo "❌ Green failed health check. Aborting."
        sudo systemctl stop erp-engine-green
        exit 1
    fi
done

# 5. Nginx 스위치 (Blue → Green)
echo "🔄 Step 4: Switching Nginx to Green (8001)..."
sudo sed -i.bak 's/server 127.0.0.1:8000;/server 127.0.0.1:8001;/' /etc/nginx/sites-available/erp-app
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Traffic switched to Green"

# 6. Blue 중지 (optional)
echo "🔵 Step 5: Stopping Blue (8000)..."
sudo systemctl stop erp-engine
echo "✅ Blue stopped"

echo "🎉 Deployment complete! Green is now live on port 8001"
echo "🔍 Verify: curl http://139.59.110.55/healthz"
```

### Green → Blue 롤백

```bash
#!/bin/bash
# rollback-to-blue.sh

set -e

echo "🔄 Rolling back to Blue (8000)..."

# 1. Blue 재시작
echo "🔵 Starting Blue service..."
sudo systemctl start erp-engine
sleep 5

# 2. Blue 헬스체크
echo "🏥 Health check on Blue..."
for i in {1..5}; do
    if curl -f http://127.0.0.1:8000/healthz > /dev/null 2>&1; then
        echo "✅ Blue is healthy!"
        break
    fi
    sleep 2
done

# 3. Nginx 스위치 (Green → Blue)
echo "🔄 Switching Nginx to Blue (8000)..."
sudo sed -i.bak 's/server 127.0.0.1:8001;/server 127.0.0.1:8000;/' /etc/nginx/sites-available/erp-app
sudo nginx -t && sudo systemctl reload nginx

# 4. Green 중지
echo "🟢 Stopping Green (8001)..."
sudo systemctl stop erp-engine-green

echo "✅ Rollback complete! Blue is now live on port 8000"
```

---

## 운영 절차

### 초기 설정 (1회만)

```bash
# 1. Green 디렉토리 생성
sudo mkdir -p /opt/erp-backend-green
sudo rsync -a /opt/erp-backend/ /opt/erp-backend-green/

# 2. Green 서비스 등록
sudo systemctl daemon-reload
sudo systemctl enable erp-engine-green

# 3. Blue 서비스 이름 변경 (optional)
sudo mv /etc/systemd/system/erp-engine.service /etc/systemd/system/erp-engine-blue.service
sudo systemctl daemon-reload
sudo systemctl enable erp-engine-blue
```

### 배포 시 (매번)

```bash
# 1. 새 코드 배포
./deploy.sh

# 2. Blue → Green 스위치
./blue-to-green.sh

# 3. 검증
curl http://139.59.110.55/healthz | jq .engine

# 4. 문제 발생 시 롤백
./rollback-to-blue.sh
```

---

## 모니터링

### 현재 활성 포트 확인

```bash
# Nginx upstream 확인
nginx -T | grep "server 127.0.0.1"

# Blue 상태
sudo systemctl status erp-engine-blue

# Green 상태
sudo systemctl status erp-engine-green

# 포트 점유 확인
sudo netstat -tlnp | grep -E ":8000|:8001"
```

### 헬스체크

```bash
# Blue (8000)
curl http://127.0.0.1:8000/healthz | jq .

# Green (8001)
curl http://127.0.0.1:8001/healthz | jq .

# 외부 (Nginx 경유)
curl http://139.59.110.55/healthz | jq .engine
```

---

## 주의사항

### 1. 데이터베이스 마이그레이션

Blue-Green 배포 시 DB 스키마 변경이 있다면:

1. **Backward Compatible 마이그레이션 우선** (Blue와 Green 모두 호환)
2. Green 배포 후 검증
3. Blue 중지 전 마이그레이션 완료 확인

### 2. 환경변수 동기화

```bash
# .env 파일 동기화
sudo cp /opt/erp-backend/.env /opt/erp-backend-green/.env
```

### 3. 세션/캐시

- JWT 토큰은 두 인스턴스에서 동일한 SECRET 사용
- Supabase는 Stateless이므로 세션 문제 없음

---

## 트러블슈팅

### Green이 시작되지 않음

```bash
# 로그 확인
sudo journalctl -u erp-engine-green -n 50

# 수동 실행으로 에러 확인
cd /opt/erp-backend-green
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Nginx 스위치 실패

```bash
# 설정 테스트
sudo nginx -t

# 백업에서 복원
sudo cp /etc/nginx/sites-available/erp-app.bak /etc/nginx/sites-available/erp-app
sudo systemctl reload nginx
```

### 포트 충돌

```bash
# 포트 점유 프로세스 확인
sudo lsof -i :8000
sudo lsof -i :8001

# 프로세스 종료
sudo kill -9 <PID>
```

---

## 자동화 (향후)

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Blue-Green Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Green
        run: |
          ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_IP }} "bash blue-to-green.sh"
      - name: Verify Deployment
        run: |
          curl -f http://${{ secrets.SERVER_IP }}/healthz
```

---

## 참고

- Nginx upstream health checks (nginx-plus 필요)
- Ansible playbook for automated deployment
- Prometheus + Grafana 모니터링

---

**Last Updated**: 2025-10-06  
**Version**: 1.0.0
