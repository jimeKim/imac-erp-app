# BOM 구성품 추가 기능 운영 안정화 체크리스트

**작성일:** 2025-10-06  
**대상:** Phase 2 - BOM 구성품 추가 기능  
**목적:** 운영 환경 배포 전 안정성 검증

---

## ✅ 완료된 항목

### 1. 버튼 활성 상태 통합 ✅

- **문제:** 빈 BOM/기존 BOM에 두 개의 다른 버튼 렌더링
- **해결:** 단일 `AddComponentButton` 컴포넌트로 통합
- **코드:** `src/features/items/components/BomTree.tsx`
- **검증:**
  ```tsx
  const AddComponentButton = ({ size }) => (
    <Button
      variant="outline"
      size={size}
      onClick={() => setIsAddModalOpen(true)}
      disabled={!canAddComponent}
    >
      <PlusCircle className="mr-2 h-4 w-4" />
      {t('modules:items.bom.addComponent')}
    </Button>
  )
  ```

### 2. 권한 가드 (RBAC) ✅

- **구현:** `admin`, `manager`, `staff`만 구성품 추가 가능
- **코드:**
  ```tsx
  const canAddComponent = user?.role && ['admin', 'manager', 'staff'].includes(user.role)
  ```
- **테스트 계정:**
  - `admin`: 모든 작업 가능
  - `staff`: 추가 가능 (향후 단가 편집 제한 예정)
  - `readonly`: 버튼 비활성화

### 3. 백엔드 에러 처리 개선 (제안) 📝

- **현재 상태:** HTTP 200으로 에러 반환
- **개선안:**
  - 409 Conflict: 중복/순환 참조
  - 422 Unprocessable Entity: 수량 유효성
  - 404 Not Found: 구성품 미존재
  - 500 Internal Server Error: 서버 오류
- **파일:** `/tmp/bom_api_improved.py` (개선안 참조)

---

## 🚧 진행 중 / 추가 필요

### 4. 순환 참조 방지 ⚠️

**현재:** 직접 순환만 체크 (`A → A`)  
**필요:** 간접 순환 체크 (`A → B → C → A`)

**개선안:**

```python
def check_circular_reference(parent_id: str, target_id: str, visited: set, depth: int = 0) -> bool:
    if depth > 10:  # 최대 깊이 제한
        return False

    if parent_id in visited:
        return False

    visited.add(parent_id)

    # target_id의 하위 구성품들을 조회
    children = supabase.table("bom_components")\
        .select("component_item_id")\
        .eq("parent_item_id", target_id)\
        .execute()

    for child in children.data or []:
        child_id = child["component_item_id"]
        if child_id == parent_id:
            return True
        if check_circular_reference(parent_id, child_id, visited, depth + 1):
            return True

    return False
```

### 5. 중복 구성품 방지 ✅

**현재 구현:**

```python
existing = supabase.table("bom_components")\
    .select("id")\
    .eq("parent_item_id", item_id)\
    .eq("component_item_id", component_item_id)\
    .execute()

if existing.data:
    return {"error": "Component already exists in this BOM"}
```

**권장:** HTTP 409로 변경 (개선안 참조)

### 6. 수량 유효성 검사 ⚠️

**현재:** 프론트엔드만 검증  
**필요:** 백엔드 Pydantic 모델

**개선안:**

```python
class BomComponentCreate(BaseModel):
    component_item_id: str
    quantity: float = Field(gt=0, le=9999, description="수량은 0보다 크고 9999 이하여야 합니다")
    unit: str = Field(default="EA", max_length=10)
    notes: Optional[str] = Field(None, max_length=500)
```

### 7. 캐시 정책 최적화 ✅

**구현 완료:**

- `vite.config.ts`: 빌드ID 주입
- 빌드 시 `VITE_BUILD_ID=$(date +%s)` 환경변수 설정

**Nginx 설정 권장:**

```nginx
location / {
    root /var/www/erp-app;
    try_files $uri $uri/ /index.html;

    # HTML: 항상 최신 확인
    location = /index.html {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # 에셋: 해시 기반 영구 캐시
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8. 로깅 및 관측 가능성 📝

**권장 로그 키:**

```python
logger.info(
    f"BOM_COMPONENT_ADDED: "
    f"tenant={tenant_id}, "
    f"parent={item_id}, "
    f"child={component_item_id}, "
    f"qty={quantity}, "
    f"user={user_id}"
)
```

**에러 로깅:**

```python
logger.error(
    f"BOM_COMPONENT_ADD_ERROR: "
    f"reason={error_type}, "
    f"parent={item_id}, "
    f"child={component_item_id}, "
    f"user={user_id}",
    exc_info=True
)
```

### 9. 데이터 무결성 (DB 제약) 📝

**Supabase 마이그레이션 확인:**

```sql
-- backend/supabase/migrations/002_bom_tables.sql
ALTER TABLE public.bom_components
ADD CONSTRAINT unique_parent_component UNIQUE (parent_item_id, component_item_id);

-- 자기 참조 방지 (CHECK 제약)
ALTER TABLE public.bom_components
ADD CONSTRAINT no_self_reference CHECK (parent_item_id != component_item_id);
```

**확인 방법:**

```bash
ssh root@139.59.110.55 "psql -U postgres -d erp_db -c '\d bom_components'"
```

### 10. 롤백 플랜 📝

**배포 전 체크리스트:**

1. ✅ Git 태그 생성: `git tag v1.2.0-bom-phase2`
2. ✅ 이전 빌드 백업: `/opt/erp-backend-backup/v1.1.0`
3. ⚠️ 롤백 스크립트 작성

**롤백 스크립트 예시:**

```bash
#!/bin/bash
# rollback.sh
echo "Rolling back to previous version..."
ssh root@139.59.110.55 << 'EOFSSH'
  cd /opt/erp-backend
  git checkout v1.1.0
  systemctl restart erp-engine

  cd /var/www/erp-app
  rm -rf *
  cp -r /opt/erp-app-backup/v1.1.0/* .

  # Nginx 캐시 퍼지 (필요시)
  nginx -s reload
EOFSSH
echo "Rollback completed!"
```

---

## 🧪 E2E 테스트 시나리오

### 시나리오 A: 정상 추가 플로우

1. **Given:** 빈 BOM 상태의 상품 (예: LCD 모니터)
2. **When:**
   - "구성품 추가" 버튼 클릭
   - 모달에서 "LCD 모듈" 검색 및 선택
   - 수량 1 입력
   - "추가" 버튼 클릭
3. **Then:**
   - ✅ 성공 토스트 표시
   - ✅ BOM 트리에 구성품 추가됨
   - ✅ 총 원가 자동 갱신

**반복:** 두 번째 구성품 추가 (예: 전원 모듈)

### 시나리오 B: 중복 구성품 시도

1. **Given:** 이미 "LCD 모듈"이 추가된 상태
2. **When:** 동일한 "LCD 모듈"을 다시 추가 시도
3. **Then:**
   - ✅ 에러 토스트: "이미 등록된 구성품입니다"
   - ✅ 모달 상태 정상 복귀
   - ✅ 다른 구성품 추가 가능

### 시나리오 C: 권한별 동작

**admin 계정:**

- ✅ "구성품 추가" 버튼 활성화
- ✅ 추가/삭제 모두 가능

**staff 계정:**

- ✅ "구성품 추가" 버튼 활성화
- ✅ 추가 가능

**readonly 계정:**

- ✅ "구성품 추가" 버튼 비활성화
- ✅ 툴팁: "구성품 추가 권한이 없습니다"

### 시나리오 D: 네트워크 오류 처리

1. **Given:** 정상 상태
2. **When:** DevTools → Network → Offline 활성화 후 추가 시도
3. **Then:**
   - ✅ 로딩 스피너 표시
   - ✅ 에러 토스트: "네트워크 오류"
   - ✅ 모달 상태 복귀 (중복 요청 방지)

---

## 📊 운영 리포트 템플릿 (일일 1분 요약)

```markdown
## BOM 구성품 추가 일일 리포트 (YYYY-MM-DD)

### 요청 통계

- 총 시도: N건
- 성공: n건
- 실패: f건
  - 중복 (duplicate): d건
  - 순환 참조 (cycle): c건
  - 권한 없음 (rbac): r건
  - 네트워크 (network): n건

### 성능 지표

- p50 응답: X ms
- p95 응답: Y ms
- 평균 응답: Z ms

### Top 3 에러 원인

1. [에러 타입]: N건 - [재발 방지 액션]
2. [에러 타입]: M건 - [재발 방지 액션]
3. [에러 타입]: L건 - [재발 방지 액션]

### 사용자 피드백

- [사용자 의견 요약]
```

---

## 🔜 Phase 3 확장 계획

| 항목                   | 요약                                 | 난이도 | 가치/리스크               | 우선순위 |
| ---------------------- | ------------------------------------ | ------ | ------------------------- | -------- |
| **Excel 일괄 Import**  | xlsx 업로드 → 미리보기 → 검증 → 반영 | 중     | 데이터 정확도↑, 교육비용↓ | 1        |
| **단가 일괄 계산**     | 하위 원가 롤업, 손익 시뮬레이션      | 중~상  | 의사결정 속도↑            | 2        |
| **Drag & Drop 재정렬** | 순서/그룹 변경, 일괄 수량 편집       | 중     | 현장 UX↑                  | 3        |
| **BOM 버전 관리**      | Draft/Active/Archived, 유효기간      | 상     | 회계/원가 정합성↑         | 4        |

**권장 순서:** Excel Import → 단가 롤업 → DnD → 버전 관리

---

## 📌 다음 액션 (즉시 수행)

### 1. 백엔드 개선안 적용 (30분)

- `/tmp/bom_api_improved.py` 내용을 `/opt/erp-backend/app/main.py`에 적용
- 순환 참조 체크 함수 추가
- Pydantic 모델 정의
- HTTP 상태 코드 수정

### 2. Nginx 캐시 정책 적용 (10분)

```bash
ssh root@139.59.110.55
sudo nano /etc/nginx/sites-enabled/erp
# (위 권장 설정 추가)
sudo nginx -t
sudo systemctl reload nginx
```

### 3. DB 제약조건 확인 (5분)

```bash
# Supabase 마이그레이션 실행 확인
ssh root@139.59.110.55
cd /opt/erp-backend
source venv/bin/activate
# migration 002_bom_tables.sql 실행 여부 확인
```

### 4. E2E 테스트 실행 (20분)

- 시나리오 A~D 수동 테스트
- 각 권한별 계정으로 확인
- 결과 문서화

### 5. 모니터링 설정 (선택)

- Sentry 에러 추적 활성화
- 로그 수집 (ELK/CloudWatch)
- 대시보드 구성

---

## 🎯 성공 기준

### Phase 2 배포 승인 조건

- ✅ 체크리스트 10항목 중 9항목 이상 완료
- ✅ E2E 시나리오 A~D 모두 통과
- ✅ 롤백 스크립트 작성 및 테스트 완료
- ✅ 운영 모니터링 대시보드 구성

### Phase 3 진행 조건

- ✅ Phase 2 운영 1주일 이상 안정화
- ✅ 주요 버그 리포트 0건
- ✅ 사용자 만족도 80% 이상
- ✅ p95 응답시간 < 300ms 달성

---

**문서 버전:** v1.0  
**최종 수정:** 2025-10-06  
**담당자:** Development Team  
**검토자:** Operations Team
