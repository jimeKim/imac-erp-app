# 다국어(i18n) 가이드

## 현재 지원 언어

- 🇰🇷 한국어 (ko)
- 🇨🇳 中文 (zh)
- 🇺🇸 English (en)

## 새로운 언어 추가하기

### 1. 번역 파일 생성

```bash
mkdir -p public/locales/{언어코드}
```

예시: 일본어 추가

```bash
mkdir -p public/locales/ja
```

### 2. JSON 파일 작성

`public/locales/ja/common.json`:

```json
{
  "app": {
    "name": "ERPシステム",
    "title": "企業資源管理"
  },
  "common": {
    "save": "保存",
    "cancel": "キャンセル"
  }
}
```

`public/locales/ja/modules.json`:

```json
{
  "items": {
    "title": "商品管理"
  }
}
```

### 3. i18n 설정 업데이트

`src/shared/services/i18n.ts`:

```typescript
export const SUPPORTED_LANGUAGES = ['ko', 'zh', 'en', 'ja'] as const
```

### 4. 언어 메타데이터 추가

`src/shared/hooks/useLanguage.ts`:

```typescript
const LANGUAGE_METADATA = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' }, // 새로 추가
]
```

## 사용법

### 컴포넌트에서 사용

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('app.name')}</h1>
      <p>{t('common.save')}</p>
      <p>{t('modules:items.title')}</p>
    </div>
  )
}
```

### 언어 전환

```tsx
import { useLanguage } from '@/shared/hooks/useLanguage'

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, languages } = useLanguage()

  return (
    <div>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={currentLanguage === lang.code ? 'active' : ''}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  )
}
```

### 변수 보간

```tsx
t('validation.minLength', { min: 5 })
// 한국어: "최소 5자 이상 입력해주세요"
// English: "Minimum 5 characters required"
```

## 네임스페이스

- `common`: 공통 문구 (버튼, 검증 메시지 등)
- `modules`: 모듈별 문구 (items, stocks, inbounds, outbounds)

새로운 네임스페이스 추가:

```typescript
// i18n.ts
ns: ['common', 'modules', 'errors'], // 'errors' 추가
```

## 언어 파일 구조

```
public/locales/
├── ko/
│   ├── common.json     # 공통 번역
│   └── modules.json    # 모듈별 번역
├── zh/
│   ├── common.json
│   └── modules.json
└── en/
    ├── common.json
    └── modules.json
```

## 베스트 프랙티스

1. **키 네이밍**: 계층 구조 사용

   ```json
   {
     "module": {
       "feature": {
         "action": "텍스트"
       }
     }
   }
   ```

2. **변수 사용**: 동적 값은 변수로 처리

   ```json
   {
     "welcome": "환영합니다, {{name}}님"
   }
   ```

3. **복수형 처리**:

   ```json
   {
     "items": "상품",
     "items_one": "상품 {{count}}개",
     "items_other": "상품 {{count}}개"
   }
   ```

4. **폴백**: 항상 영어(en)를 폴백으로 설정
   ```typescript
   fallbackLng: 'en'
   ```

## 문제 해결

### 번역이 표시되지 않을 때

1. JSON 파일 경로 확인
2. 브라우저 개발자 도구 콘솔 확인
3. 네트워크 탭에서 JSON 로딩 확인

### 언어 전환이 안될 때

1. localStorage의 `i18nextLng` 키 확인
2. `SUPPORTED_LANGUAGES`에 언어 코드 포함 여부 확인
3. 브라우저 캐시 삭제
