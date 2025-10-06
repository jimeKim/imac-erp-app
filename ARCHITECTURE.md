# 🏗️ ERP 시스템 아키텍처 문서

> **일관성 표준**: 이 문서는 프로젝트의 모든 배포 환경에서 동일하게 적용되는 아키텍처 원칙을 정의합니다.

---

## 📐 시스템 구조 (완전 분리)

```
[사용자 브라우저]
     ↓ http://139.59.110.55
[Nginx :80] ← 단일 진입점
     ├─ / → erp-app (정적 파일)
     ├─ /api/* → erp-engine :8000
     └─ /healthz → erp-engine :8000/healthz
          ↓
[erp-engine (FastAPI)]
     ↓ Supabase REST API (HTTP)
[Supabase PostgreSQL]
```

---

## 🔴 erp-app (프론트엔드)

### 역할

- **사용자 인터페이스 제공**
- 브라우저에서 실행되는 SPA
- API 호출만 수행 (데이터베이스 직접 접근 절대 금지)

### 기술 스택

```yaml
framework: React 18
language: TypeScript 5.6
build: Vite 5.4
styling: Tailwind CSS + shadcn/ui
state: Zustand + TanStack Query v5
routing: React Router v6
i18n: i18next (ko/zh/en)
```

### 배포 위치

```bash
# 서버 경로
/var/www/erp-app/

# 빌드 명령어 (로컬)
npm run build

# 업로드 명령어
rsync -avz --delete dist/ root@139.59.110.55:/var/www/erp-app/
```

### 서빙 방식

- **운영**: Nginx가 정적 파일 직접 제공
- **개발**: Vite Dev Server (`npm run dev`)
- ❌ 운영 환경에서 `erp-web.service` (Python HTTP) 사용 안 함

---

## 🔵 erp-engine (백엔드 API)

### 역할

- **비즈니스 로직 처리**
- **Supabase Client SDK를 통한 데이터베이스 통신**
- RESTful API 제공
- ❌ 직접 데이터베이스 연결 금지 (psycopg2 사용 안 함)

### 기술 스택

```yaml
framework: FastAPI 0.118+
server: Uvicorn
language: Python 3.10+ (목표: 3.12)
database_client: supabase-py 2.21+
auth: python-jose, passlib
validation: Pydantic 2.11+
```

### 배포 위치

```bash
# 서버 경로
/opt/erp-backend/

# 가상환경
/opt/erp-backend/venv/

# 서비스
systemctl status erp-engine.service
```

### 워커 정책 (표준)

```bash
# 산정 공식: (CPU 코어 수 * 2) + 1
# 예: 2 코어 → 5 workers
# 예: 4 코어 → 9 workers

# systemd 설정
ExecStart=/opt/erp-backend/venv/bin/uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 5
```

### Supabase 통신 방식 (필수)

```python
# ✅ 올바른 방법
from app.core.supabase import supabase

result = supabase.table("engines").select("*").execute()

# ❌ 절대 금지
import psycopg2
conn = psycopg2.connect(DATABASE_URL)  # 이렇게 하지 마세요!
```

---

## 🟢 Supabase (데이터베이스)

### 연결 정보

```bash
# 프로젝트 URL
https://qijwwiijpkqzmlamdtmd.supabase.co

# 키 관리 (환경변수)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJhbG...        # 프론트엔드용 (미사용)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # 백엔드용 (사용)
```

### 핵심 테이블

```sql
-- ERP 기본
items           -- 상품
stocks          -- 재고
inbounds        -- 입고

-- 엔진 시스템 (핵심!)
engines         -- 비즈니스 엔티티
engine_templates -- 엔진 정의
flows           -- 입출고 흐름

-- 권한
user_roles      -- RBAC
```

---

## 🎯 핵심 원칙 (절대 준수)

### ✅ 해야 할 것

1. **완전 분리 원칙**
   - 프론트엔드는 API만 호출
   - 백엔드만 데이터베이스 접근
   - 데이터베이스는 Supabase REST API로만 통신

2. **엔진 중심 설계**
   - 모든 비즈니스 엔티티는 `engines` 테이블 기반
   - 상태 변화는 `flows` 테이블로 추적

3. **표준 엔드포인트**
   ```
   GET /healthz        # 헬스체크 (표준)
   GET /health         # 하위 호환
   GET /api/engines    # 엔진 목록
   GET /api/flows      # 흐름 목록
   ```

### ❌ 하지 말아야 할 것

1. **직접 데이터베이스 연결 금지**

   ```python
   # ❌ psycopg2, SQLAlchemy 직접 연결
   import psycopg2
   conn = psycopg2.connect(...)
   ```

2. **프론트엔드에서 Supabase 직접 호출 금지**

   ```typescript
   // ❌ @supabase/supabase-js 프론트엔드 사용
   import { createClient } from '@supabase/supabase-js'
   ```

3. **비즈니스 로직을 프론트엔드에 넣지 말 것**

---

## 🔐 보안 표준

### 환경변수 관리

```bash
# 파일 위치
/opt/erp-backend/.env

# 권한 설정 (필수!)
chmod 600 /opt/erp-backend/.env

# systemd에서 로드
[Service]
EnvironmentFile=/opt/erp-backend/.env
```

### 시크릿 운영 가드레일

- ✅ Service Role Key는 백엔드만 사용
- ✅ 환경변수 파일 권한 600
- ✅ Git에 커밋 금지 (.gitignore)
- 🔄 주기적 키 로테이션 (분기별)
- 📊 액세스 로그 점검 (월별)

---

## 📊 배포 환경

### 운영 서버

```bash
IP: 139.59.110.55
OS: Ubuntu 22.04
Python: 3.10 (목표: 3.12)
```

### 실행 중인 서비스

```bash
● erp-engine.service  (포트 8000, 5 workers)
● nginx.service       (포트 80)

# 개발 서비스 (운영에서 비활성화)
× erp-web.service     (비활성화됨)
× erp-api.service     (비활성화됨)
× erp-proxy.service   (비활성화됨)
```

### 서비스 관리

```bash
# 상태 확인
systemctl status erp-engine.service

# 재시작
systemctl restart erp-engine.service
systemctl restart nginx

# 로그 확인
journalctl -u erp-engine.service -f
```

---

## 🔄 데이터 흐름 (표준)

### API 요청 흐름

```
[사용자 클릭]
  ↓
[React Component]
  ↓ fetch('/api/engines')
[Nginx]
  ↓ proxy_pass → http://127.0.0.1:8000/api/engines
[FastAPI Endpoint]
  ↓ supabase.table("engines").select("*").execute()
[Supabase REST API]
  ↓ HTTP Request
[PostgreSQL]
  ↓ Query Result
[FastAPI]
  ↓ JSON Response
[React]
  ↓ State Update
[UI 렌더링]
```

---

## 🚀 배포 프로세스

### 프론트엔드 배포

```bash
# 1. 로컬 빌드
cd /Users/kjimi/Documents/GitHub/imac-erp-app
npm run build

# 2. 서버 업로드
rsync -avz --delete dist/ root@139.59.110.55:/var/www/erp-app/

# 3. 캐시 클리어 (필요시)
ssh root@139.59.110.55 "systemctl reload nginx"
```

### 백엔드 배포

```bash
# 1. 코드 업로드
rsync -avz --delete backend/ root@139.59.110.55:/opt/erp-backend/

# 2. 패키지 설치 (변경 시)
ssh root@139.59.110.55 "cd /opt/erp-backend && source venv/bin/activate && pip install -r requirements.txt"

# 3. 서비스 재시작
ssh root@139.59.110.55 "systemctl restart erp-engine.service"

# 4. 헬스체크
curl http://139.59.110.55/healthz
```

---

## 📈 Future: 이벤트 기반 확장 (Phase-Next)

> 현재는 REST 단일 경로 MVP입니다. 향후 이벤트 기반 아키텍처로 확장할 수 있습니다.

### 계획 중인 계층

```
[erp-engine]
     ↓ Event Publishing
[NATS/JetStream]
     ↓ Event Stream
[Event Handlers]
     ↓
[Supabase / External Services]
```

### 추가 예정 패턴

- **Outbox Pattern**: 트랜잭션 보장
- **Event Sourcing**: 상태 변화 추적
- **CQRS**: 읽기/쓰기 분리
- **Saga Pattern**: 분산 트랜잭션

---

## 🧪 헬스체크 & 모니터링

### 표준 엔드포인트

```bash
# 헬스체크 (표준)
GET /healthz

# 응답 예시
{
  "status": "healthy",
  "app": "ERP Engine API",
  "version": "1.0.0",
  "supabase": "connected",
  "database": "ok"
}
```

### 모니터링 스크립트

```bash
# 간단한 헬스체크
curl -f http://139.59.110.55/healthz || echo "❌ 서비스 다운!"

# 상세 점검
curl -s http://139.59.110.55/healthz | jq .status
```

---

## 📝 일관성 체크리스트

### 배포 전 확인사항

- [ ] Python 버전 통일 (로컬/CI/운영)
- [ ] 환경변수 파일 권한 600
- [ ] Nginx 설정에 `/healthz` 사용
- [ ] Uvicorn 워커 수 코어 기반 설정
- [ ] 운영 서비스에서 dev 서버 비활성화
- [ ] Supabase Client SDK 사용 확인
- [ ] 직접 DB 연결 코드 없음 확인

---

## 🔗 관련 문서

- `README.md` - 프로젝트 개요
- `DEPLOYMENT.md` - 배포 가이드
- `backend/README.md` - 백엔드 상세
- `frontend/README.md` - 프론트엔드 상세

---

**Last Updated**: 2025-10-05  
**Version**: 1.0.0  
**Status**: ✅ Production Ready (Python 3.12 업그레이드 예정)
