# 환경 변수 가이드

## 필수 환경 변수

### API 설정

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```
- 백엔드 API의 기본 URL
- 개발: `http://localhost:3000/api/v1`
- 프로덕션: `https://api.example.com/api/v1`

```bash
VITE_API_TIMEOUT_MS=15000
```
- API 요청 타임아웃 (밀리초)
- 기본값: 15000 (15초)

### 앱 설정

```bash
VITE_APP_NAME=ERP System
```
- 애플리케이션 이름 (브라우저 타이틀 등에 사용)

```bash
VITE_APP_VERSION=0.1.0
```
- 애플리케이션 버전

## 선택적 환경 변수

### Feature Flags

```bash
VITE_ENABLE_DEV_TOOLS=true
```
- 개발 도구 활성화 (React Query Devtools 등)
- 개발: `true`
- 프로덕션: `false`

```bash
VITE_ENABLE_MOCK_API=false
```
- Mock API 사용 여부
- 백엔드 없이 프론트엔드 개발 시 `true`

### 인증

```bash
VITE_AUTH_PROVIDER=jwt
```
- 인증 방식: `jwt`, `session`, `oauth`

```bash
VITE_AUTH_TOKEN_KEY=auth_token
```
- JWT 토큰 저장 키 (localStorage/sessionStorage)

### 분석 및 모니터링

```bash
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```
- Google Analytics 추적 ID

```bash
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```
- Sentry 에러 추적 DSN

## 환경별 설정

### 로컬 개발 (.env.local)

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_MOCK_API=false
```

### 스테이징 (.env.staging)

```bash
VITE_API_BASE_URL=https://api-staging.example.com/api/v1
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_MOCK_API=false
```

### 프로덕션 (.env.production)

```bash
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_MOCK_API=false
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

## 사용 방법

### TypeScript에서 사용

```typescript
// vite-env.d.ts에 타입 정의
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT_MS: string
  readonly VITE_APP_NAME: string
}

// 코드에서 사용
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
```

### 빌드 시 주입

```bash
# .env.production 파일 사용
npm run build

# 직접 주입
VITE_API_BASE_URL=https://api.example.com npm run build
```

## CORS 설정

프론트엔드와 백엔드가 다른 도메인에 있을 경우, 백엔드에서 CORS를 설정해야 합니다.

### Node.js (Express) 예시

```javascript
const cors = require('cors')

app.use(cors({
  origin: [
    'http://localhost:5173', // 로컬 개발
    'https://app.example.com', // 프로덕션
  ],
  credentials: true, // JWT HTTPOnly 쿠키를 위해 필요
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Start-Time'],
}))
```

### FastAPI (Python) 예시

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # 로컬 개발
        "https://app.example.com",  # 프로덕션
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 보안 주의사항

1. **API 키 노출 방지**: `VITE_` 접두사가 있는 변수는 클라이언트에 노출됩니다. 민감한 정보는 백엔드에서 관리하세요.

2. **.env 파일 Git 추가 방지**:
   ```gitignore
   .env
   .env.local
   .env.production
   .env.staging
   ```

3. **.env.example 제공**: 필요한 환경 변수 목록을 `.env.example`에 문서화하세요.

4. **환경별 분리**: 개발/스테이징/프로덕션 환경을 명확히 구분하세요.

