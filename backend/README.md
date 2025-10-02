# ERP App - Backend

FastAPI + Supabase 백엔드

---

## 시작하기

### 1. Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 이름: `erp-app`
4. Database Password 설정 (안전하게 보관!)
5. Region 선택: `Northeast Asia (Seoul)`

### 2. 마이그레이션 실행

Supabase Dashboard → SQL Editor:

```sql
-- supabase/migrations/001_initial_schema.sql 복사 붙여넣기 후 실행
```

### 3. 환경변수 설정

`.env` 파일 생성:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-jwt-secret

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### 4. 의존성 설치

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. 개발 서버 실행

```bash
uvicorn app.main:app --reload --port 3000
```

서버: http://localhost:3000
API Docs: http://localhost:3000/docs

---

## API 엔드포인트

### Items
- `GET /api/v1/items` - 목록 조회
- `GET /api/v1/items/{id}` - 상세 조회
- `POST /api/v1/items` - 생성 (staff+)
- `PUT /api/v1/items/{id}` - 수정 (manager)
- `DELETE /api/v1/items/{id}` - 삭제 (manager)

### Stocks
- `GET /api/v1/stocks` - 재고 현황 조회

### Outbounds
- `GET /api/v1/outbounds` - 목록 조회
- `GET /api/v1/outbounds/{id}` - 상세 조회
- `POST /api/v1/outbounds` - 생성 (staff+)
- `PUT /api/v1/outbounds/{id}` - 수정 (owner only, draft만)
- `POST /api/v1/outbounds/{id}/submit` - 승인 요청 (owner)
- `POST /api/v1/outbounds/{id}/approve` - 승인 (manager)
- `POST /api/v1/outbounds/{id}/commit` - 커밋 (manager)
- `DELETE /api/v1/outbounds/{id}` - 취소 (owner/manager)

### Auth
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/logout` - 로그아웃
- `GET /api/v1/auth/me` - 현재 사용자 정보

---

## 디렉토리 구조

```
backend/
├── app/
│   ├── main.py                 # FastAPI 앱
│   ├── routers/
│   │   ├── items.py           # Items CRUD
│   │   ├── outbounds.py       # Outbounds 워크플로우
│   │   ├── stocks.py          # Stocks 조회
│   │   └── auth.py            # 인증
│   ├── services/
│   │   ├── outbound_service.py # 출고 비즈니스 로직
│   │   └── stock_service.py    # 재고 계산 로직
│   ├── core/
│   │   ├── config.py          # 환경변수
│   │   ├── supabase.py        # Supabase 클라이언트
│   │   └── auth.py            # JWT 검증
│   ├── models/
│   │   └── schemas.py         # Pydantic 모델
│   └── middleware/
│       └── cors.py            # CORS 설정
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## 다음 단계

1. ✅ Supabase 스키마 생성
2. ⏳ FastAPI 프로젝트 구조 생성
3. ⏳ Items API 구현
4. ⏳ Outbounds API 구현
5. ⏳ 프론트엔드 API 클라이언트 연동

