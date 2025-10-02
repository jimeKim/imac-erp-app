import { test, expect } from '@playwright/test'

test.describe('ERP App', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/ERP/)

    // 메인 카드 확인
    const mainCard = page.getByText(/Phase 0 완료/i)
    await expect(mainCard).toBeVisible()
  })

  test('should change language', async ({ page }) => {
    await page.goto('/')

    // 한국어 버튼 클릭
    const koreanButton = page.getByRole('button', { name: /한국어/i })
    await koreanButton.click()

    // 언어 변경 확인 (localStorage 체크)
    const language = await page.evaluate(() => localStorage.getItem('i18nextLng'))
    expect(language).toBe('ko')

    // 중국어 버튼 클릭
    const chineseButton = page.getByRole('button', { name: /中文/i })
    await chineseButton.click()

    const languageZh = await page.evaluate(() => localStorage.getItem('i18nextLng'))
    expect(languageZh).toBe('zh')

    // 영어 버튼 클릭
    const englishButton = page.getByRole('button', { name: /English/i })
    await englishButton.click()

    const languageEn = await page.evaluate(() => localStorage.getItem('i18nextLng'))
    expect(languageEn).toBe('en')
  })

  test('should display error messages demo', async ({ page }) => {
    await page.goto('/')

    // 에러 메시지 버튼 확인
    const errorButton = page.locator('button').filter({ hasText: 'AUTH_INVALID_CREDENTIALS' })
    await expect(errorButton).toBeVisible()

    // 에러 버튼 클릭
    await errorButton.click()

    // 클릭 시 스타일 변경 확인
    await expect(errorButton).toHaveClass(/border-red-500/)
  })

  test('should display RBAC system info', async ({ page }) => {
    await page.goto('/')

    // RBAC 섹션 확인
    const rbacSection = page.getByText(/RBAC 권한 시스템/i)
    await expect(rbacSection).toBeVisible()

    // 권한 정보 확인 (실제 표시되는 텍스트 기반)
    await expect(page.getByText('Items:', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('View').first()).toBeVisible()
    await expect(page.getByText('Create').first()).toBeVisible()
    await expect(page.getByText('Approve').first()).toBeVisible()
  })

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/')

    // 진행률 확인 (구체적인 selector 사용)
    const progressText = page.locator('text=Phase 0 Complete').locator('..').getByText('50%')
    await expect(progressText).toBeVisible()

    // 완료된 작업 표시 확인
    const completedTask = page.getByText(/완료된 작업/i).first()
    await expect(completedTask).toBeVisible()
  })

  test('should display UI component demos', async ({ page }) => {
    await page.goto('/')

    // 버튼 variants 확인
    const defaultButton = page.getByRole('button', { name: /^Default$/ })
    await expect(defaultButton).toBeVisible()

    const secondaryButton = page.getByRole('button', { name: /^Secondary$/ })
    await expect(secondaryButton).toBeVisible()

    const destructiveButton = page.getByRole('button', { name: /^Destructive$/ })
    await expect(destructiveButton).toBeVisible()
  })
})
