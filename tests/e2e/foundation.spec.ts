import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
for (const [name, origin] of [
  ['web', 'http://127.0.0.1:3100'],
  ['admin', 'http://127.0.0.1:3101'],
] as const) {
  test(`${name} displays real readiness with accessible responsive controls`, async ({ page }) => {
    const response = await page.goto(origin);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      name === 'web' ? 'Dealith' : 'Dealith Admin',
    );
    await expect(page.getByRole('status')).toHaveText(
      'All displayed checks have confirmed readiness.',
    );
    await expect(page.locator('dd')).toHaveText(['READY', 'READY', 'READY', 'READY', 'READY']);
    expect(response?.headers()['content-security-policy']).toContain("'nonce-");
    expect(response?.headers()['content-security-policy']).not.toContain("'unsafe-eval'");
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.getByRole('button', { name: 'Refresh checks' }).click();
    await expect(page.getByRole('status')).toHaveText(
      'All displayed checks have confirmed readiness.',
    );
  });
}
test('keyboard users reach main content and refresh checks', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect(page.getByRole('button', { name: 'Refresh checks' })).toBeEnabled();
  await page.getByRole('button', { name: 'Refresh checks' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText(
    'All displayed checks have confirmed readiness.',
  );
});
test('API outage displays unavailable and unknown dependencies then recovers', async ({ page }) => {
  await page.route('**/api/v1/health/ready', (route) =>
    route.fulfill({ status: 503, body: '{"secret":"must-not-display"}' }),
  );
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('could not confirm readiness');
  await expect(page.locator('dd')).toHaveText([
    'READY',
    'UNAVAILABLE',
    'UNKNOWN',
    'UNKNOWN',
    'READY',
  ]);
  await expect(page.locator('body')).not.toContainText('must-not-display');
  await page.unroute('**/api/v1/health/ready');
  await page.getByRole('button', { name: 'Refresh checks' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'All displayed checks have confirmed readiness.',
  );
});
test('malformed success cannot certify dependency readiness', async ({ page }) => {
  await page.route('**/api/v1/health/ready', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { status: 'ok', service: 'worker' },
        meta: { requestId: 'not-a-uuid' },
      }),
    }),
  );
  await page.goto('/');
  await expect(page.locator('dd')).toHaveText([
    'READY',
    'UNAVAILABLE',
    'UNKNOWN',
    'UNKNOWN',
    'READY',
  ]);
});
test('unknown pages are safe and administration is not indexed', async ({ page }) => {
  const response = await page.goto('/missing-foundation-route');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('http://127.0.0.1:3101');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('button', { name: /sign in|approve|release/i })).toHaveCount(0);
});
