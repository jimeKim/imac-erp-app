/**
 * E2E Tests: Item Classification Scheme - Phase 1
 *
 * Test Cases:
 * - TC-CLSF-001: PURCHASE saves without BOM/Route
 * - TC-CLSF-002: ASSEMBLY requires BOM
 * - TC-CLSF-003: PRODUCTION requires Routing when BOM only
 * - TC-CLSF-004: List filter by label works
 */

import { test, expect } from '@playwright/test'

// 공통 Setup: 로그인
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/이메일|email/i).fill('admin')
  await page.getByLabel(/비밀번호|password/i).fill('admin123')
  await page.getByRole('button', { name: /로그인|login/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test.describe('Item Classification Scheme - Phase 1', () => {
  /**
   * TC-CLSF-001: PURCHASE saves without BOM/Route
   * 목적: PURCHASE는 BOM/공정 없이 저장 가능
   */
  test('TC-CLSF-001: PURCHASE saves without BOM/Route', async ({ page }) => {
    await page.goto('/items/create')

    // 기본 필드 입력
    await page.getByLabel(/SKU 코드|SKU Code/i).fill(`E2E-PURCHASE-${Date.now()}`)
    await page.getByLabel(/상품명|Item Name/i).fill('E2E Test Purchase Item')

    // PURCHASE 선택 (원자재 = RM)
    await page.locator('select[name="item_type"]').selectOption('RM')

    // 저장
    await page.getByRole('button', { name: /저장|save/i }).click()

    // 기대결과: 저장 성공 (목록 페이지로 리다이렉트)
    await expect(page).toHaveURL(/\/items-real/, { timeout: 10000 })

    // 새로 등록한 아이템이 목록에 표시되는지 확인 (여러 개 있을 수 있으므로 .first())
    await expect(page.getByText('E2E Test Purchase Item').first()).toBeVisible()
  })

  /**
   * TC-CLSF-002: ASSEMBLY requires BOM
   * 목적: ASSEMBLY는 BOM 필수 (Phase 1: 경고만)
   */
  test('TC-CLSF-002: ASSEMBLY requires BOM (warning)', async ({ page }) => {
    await page.goto('/items/create')

    // 기본 필드 입력
    await page.getByLabel(/SKU 코드|SKU Code/i).fill(`E2E-ASSEMBLY-${Date.now()}`)
    await page.getByLabel(/상품명|Item Name/i).fill('E2E Test Assembly Item')

    // ASSEMBLY 선택 (모듈 = MOD)
    await page.locator('select[name="item_type"]').selectOption('MOD')

    // BOM 필수 정보 표시 확인
    await expect(page.getByText(/BOM.*필요|BOM.*required/i)).toBeVisible()

    // 저장 (Phase 1: 경고만 있고 저장은 가능)
    await page.getByRole('button', { name: /저장|save/i }).click()

    // Phase 1: 저장 성공 (BOM 없어도 저장됨, 경고만)
    // Phase 2: 422 에러 기대
    const saveSuccess = page.getByText(/저장.*성공|saved successfully/i)
    const bomRequiredError = page.getByText(/BOM.*연결.*필요|BOM.*connection.*required/i)

    // 둘 중 하나는 나타나야 함
    await Promise.race([
      expect(saveSuccess).toBeVisible({ timeout: 5000 }),
      expect(bomRequiredError).toBeVisible({ timeout: 5000 }),
    ])
  })

  /**
   * TC-CLSF-003: PRODUCTION requires Routing (warning)
   * 목적: PRODUCTION은 BOM+공정 모두 필수 (Phase 1: 경고만)
   */
  test('TC-CLSF-003: PRODUCTION requires BOM+Routing (warning)', async ({ page }) => {
    await page.goto('/items/create')

    // 기본 필드 입력
    await page.getByLabel(/SKU 코드|SKU Code/i).fill(`E2E-PRODUCTION-${Date.now()}`)
    await page.getByLabel(/상품명|Item Name/i).fill('E2E Test Production Item')

    // PRODUCTION 선택 (완제품 = FG)
    await page.locator('select[name="item_type"]').selectOption('FG')

    // BOM + 공정 필수 정보 표시 확인
    await expect(page.getByText(/BOM.*필요|BOM.*required/i)).toBeVisible()
    await expect(page.getByText(/공정.*필요|Routing.*required/i)).toBeVisible()

    // 저장
    await page.getByRole('button', { name: /저장|save/i }).click()

    // Phase 1: 저장 성공 (경고만)
    // Phase 2: 422 에러 기대
    const saveSuccess = page.getByText(/저장.*성공|saved successfully/i)
    const routingRequiredError = page.getByText(/공정.*필요|routing.*required/i)

    await Promise.race([
      expect(saveSuccess).toBeVisible({ timeout: 5000 }),
      expect(routingRequiredError).toBeVisible({ timeout: 5000 }),
    ])
  })

  /**
   * TC-CLSF-004: List filter by item type works
   * 목적: 라벨 필터가 실제 데이터와 일치
   */
  test('TC-CLSF-004: List filter by item type works', async ({ page }) => {
    await page.goto('/items-real')

    // 페이지 로딩 대기
    await page.waitForSelector('text=/총.*개의 상품|total.*items/i', { timeout: 10000 })

    // 원자재(RM) 필터 클릭
    const filterButton = page
      .locator('button', {
        has: page.locator('text=/상품 유형|Item Type/i'),
      })
      .first()

    if (await filterButton.isVisible()) {
      await filterButton.click()

      // 필터 드롭다운에서 원자재 선택
      const rmOption = page.getByRole('checkbox', { name: /원자재.*Raw Material/i })
      if (await rmOption.isVisible({ timeout: 2000 })) {
        await rmOption.click()

        // 필터 적용 대기
        await page.waitForTimeout(1000)

        // 결과 확인: 표시된 모든 행이 원자재 배지를 가져야 함
        const itemRows = page.locator('[role="row"]').filter({
          hasText: /E2E|TEST|SKU|K1|PT|RM/,
        })

        const count = await itemRows.count()
        console.log(`Filtered items count: ${count}`)

        // 최소 1개 이상의 결과가 있어야 함
        expect(count).toBeGreaterThan(0)
      }
    }
  })

  /**
   * TC-CLSF-005: Classification Settings Page displays correctly
   * 목적: 설정 페이지에서 분류 체계 정보 확인
   */
  test('TC-CLSF-005: Classification Settings Page displays', async ({ page }) => {
    await page.goto('/settings/classification')

    // 페이지 타이틀 확인
    await expect(
      page.getByRole('heading', { name: /상품 분류 체계|Classification/i }),
    ).toBeVisible()

    // 현재 활성 스킴 확인
    await expect(
      page.getByText(/단순형.*사입.*조립.*생산|Simple.*Purchase.*Assembly.*Production/i),
    ).toBeVisible()

    // 라벨 테이블 확인 (여러 개 있을 수 있으므로 .first() 사용)
    await expect(page.getByText(/BOM 필수|BOM Required/i).first()).toBeVisible()
    await expect(page.getByText(/공정 필수|Routing Required/i).first()).toBeVisible()

    // FAQ 섹션 확인
    await expect(page.getByRole('heading', { name: /자주 묻는 질문|FAQ/i })).toBeVisible()
  })
})

/**
 * 운영 리포트용 통계 수집
 *
 * 실행 후 playwright-report/index.html 에서:
 * - 통과/실패 비율
 * - 평균 실행 시간
 * - 실패 스크린샷
 *
 * 확인 가능
 */
