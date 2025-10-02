# Next Steps - ERP App

Phase 0 + Phase 1 (MVP) 완료! 🎉

다음 단계로 진행할 수 있는 옵션들입니다.

---

## Option 1: 백엔드 연동 (추천)

**목표**: Mock API를 실제 백엔드 API로 교체

### 작업 내용
1. FastAPI + Supabase 백엔드 구축
2. API 엔드포인트 구현
   - Items CRUD
   - Stocks 조회/업데이트
   - Inbounds CRUD + 승인 워크플로우
   - Outbounds CRUD + 승인/커밋 워크플로우
3. 프론트엔드 API 클라이언트 수정
   - `USE_MOCK` 플래그 제거
   - 실제 API 호출로 변경

**예상 시간**: 2-3일

---

## Option 2: 테스트 강화

**목표**: 단위 테스트 및 E2E 테스트 커버리지 확대

### 작업 내용
1. 주요 컴포넌트 단위 테스트 추가
   - `ItemsPage.test.tsx`
   - `OutboundCreatePage.test.tsx`
   - `OutboundDetailPage.test.tsx`
2. E2E 테스트 시나리오 추가
   - 로그인 → Outbound 생성 → 승인 → 커밋
   - Low Stock 알림 테스트
3. Test Coverage 80% 이상 달성

**예상 시간**: 1-2일

---

## Option 3: Dashboard 구현

**목표**: 데이터 시각화 및 실시간 모니터링

### 작업 내용
1. Chart.js 또는 Recharts 통합
2. Dashboard 위젯 구현
   - 재고 현황 차트
   - 입출고 추세 그래프
   - Low Stock 아이템 리스트
   - 최근 활동 타임라인
3. 실시간 업데이트 (WebSocket/Polling)

**예상 시간**: 2-3일

---

## Option 4: 사용자 관리 (Admin)

**목표**: 관리자용 사용자 관리 기능

### 작업 내용
1. Users CRUD 페이지
2. 역할 할당 UI
3. 사용자 활성화/비활성화
4. 감사 로그 (Audit Trail)

**예상 시간**: 1-2일

---

## Option 5: Excel 가져오기/내보내기

**목표**: 대량 데이터 처리

### 작업 내용
1. XLSX 라이브러리 통합 (SheetJS)
2. Items Excel 업로드
3. Outbounds Excel 내보내기
4. 템플릿 다운로드 기능

**예상 시간**: 1일

---

## Option 6: 알림 시스템

**목표**: 실시간 알림 및 이메일 알림

### 작업 내용
1. 알림 아이콘 (헤더)
2. 알림 목록 (드롭다운)
3. Low Stock 자동 알림
4. 승인 요청 알림
5. 이메일 알림 (선택)

**예상 시간**: 1-2일

---

## Option 7: 프로덕션 배포

**목표**: 실제 환경 배포

### 작업 내용
1. Docker 컨테이너화
2. GitHub Actions CI/CD
3. Vercel/Netlify 배포 (프론트엔드)
4. Supabase 프로젝트 생성 (백엔드)
5. 환경변수 설정
6. Sentry 모니터링 통합

**예상 시간**: 1-2일

---

## 권장 순서

```
1. 백엔드 연동 (Option 1)
   ↓
2. Dashboard 구현 (Option 3)
   ↓
3. 테스트 강화 (Option 2)
   ↓
4. 사용자 관리 (Option 4)
   ↓
5. Excel 기능 (Option 5)
   ↓
6. 알림 시스템 (Option 6)
   ↓
7. 프로덕션 배포 (Option 7)
```

---

## 빠른 개선 사항 (1시간 이내)

1. ✅ DashboardPage 플레이스홀더를 실제 위젯으로 교체
2. ✅ MainLayout에 사이드바 네비게이션 추가
3. ✅ 404/Unauthorized 페이지 디자인 개선
4. ✅ Loading Spinner 컴포넌트 통일
5. ✅ Error Message i18n 적용

---

## 질문?

어떤 옵션을 선택하시겠습니까?

또는 다른 기능이 필요하신가요?
