import { defineConfig, devices } from '@playwright/test'

const isCI = Boolean(process.env.CI)

// E2E 테스트 타겟 환경
// - local: 로컬 개발 서버 (http://localhost:5173)
// - production: 운영 서버 (http://139.59.110.55)
const TARGET_ENV = process.env.E2E_TARGET || 'production'

const envConfig = {
  local: {
    baseURL: 'http://localhost:5173',
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
    },
  },
  production: {
    baseURL: 'http://139.59.110.55',
    webServer: undefined, // 이미 실행 중인 운영 서버 사용
  },
}

const config = envConfig[TARGET_ENV as keyof typeof envConfig] || envConfig.production

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: config.baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // 운영 서버 테스트 시 타임아웃 증가
    actionTimeout: TARGET_ENV === 'production' ? 15000 : 10000,
    navigationTimeout: TARGET_ENV === 'production' ? 30000 : 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: config.webServer,
})
