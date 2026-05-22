import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 8081);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

const viewportProjects = [
  { name: 'mobile-320', width: 320, height: 720 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['github']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run web:e2e',
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: {
      EXPO_NO_DEPENDENCY_VALIDATION: '1',
      EXPO_OFFLINE: '1',
      EXPO_PUBLIC_ENABLE_E2E_AUTH: '1',
    },
  },
  projects: viewportProjects.map(({ name, width, height }) => ({
    name,
    use: {
      viewport: { width, height },
      deviceScaleFactor: name.startsWith('mobile') ? 2 : 1,
      isMobile: name.startsWith('mobile'),
      hasTouch: name.startsWith('mobile'),
    },
  })),
});
