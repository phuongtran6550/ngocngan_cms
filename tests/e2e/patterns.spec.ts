import {
  ensureTableView,
  expect,
  patternApiPattern,
  test,
} from './fixtures';

test('Patterns lists the name and creator profile only', async ({ authenticatedPage: page }) => {
  await page.goto('/patterns');

  const table = await ensureTableView(page);
  await expect(page.getByRole('heading', { name: 'Quản lý mẫu', exact: true })).toBeVisible();
  await expect(table.getByText('Bông mai', { exact: true })).toBeVisible();
  await expect(table.getByText('Số SKU', { exact: true })).toBeVisible();
  await expect(table.getByText('3', { exact: true })).toBeVisible();
  await expect(table.getByText('Ngọc Châu', { exact: true })).toBeVisible();
  await expect(table.getByText('Mô tả danh mục', { exact: true })).toHaveCount(0);
  await expect(table.getByTestId('default-avatar')).toBeVisible();
  await expect(table.getByText('Trạng thái', { exact: true })).toHaveCount(0);

  await page.getByTestId('list-create').click();
  const drawer = page.getByRole('dialog', { name: 'Thêm mới' });
  await expect(drawer.locator('input[name="name"]')).toBeVisible();
  await expect(drawer.locator('input[name="name"]')).not.toHaveAttribute('required', '');
  await expect(drawer.locator('textarea[name="description"]')).toBeVisible();
  await expect(drawer.locator('select, input[name="status"], input[name="sortOrder"]')).toHaveCount(0);

  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/patterns') && request.method() === 'POST') {
      requests.push(request.postData() || '');
    }
  });
  await drawer.getByRole('button', { name: 'Thêm mới', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(drawer.getByRole('alert')).toContainText('Tên mẫu là bắt buộc');

  await drawer.locator('input[name="name"]').fill('Lá mai');
  await drawer.getByRole('button', { name: 'Thêm mới', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(JSON.parse(requests[1])).toEqual({ name: 'Lá mai', description: '' });

  await page.unroute(patternApiPattern);
});
