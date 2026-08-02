import { patternDefinition, patternResource } from '@/views/Patterns/config';

describe('Pattern definition', () => {
  it('declares the name, SKU count, and creator list columns', () => {
    expect(patternDefinition.endpoint).toBe('/patterns');
    expect(patternDefinition.columns.map((column) => column.key)).toEqual([
      'name',
      'skuCount',
      'createdBy',
    ]);
    expect(patternDefinition.columns.find((column) => column.key === 'skuCount')).toEqual({
      key: 'skuCount',
      label: 'Số SKU',
      type: 'number',
    });
    expect(patternResource.selectedColumns).toEqual(['name', 'skuCount', 'createdBy']);
    expect(patternDefinition.filters).toBeUndefined();
  });

  it('declares only name and description without native browser required validation', () => {
    expect(patternDefinition.form?.fields.map((field) => ({
      key: field.key,
      required: Boolean(field.required),
      type: field.type,
    }))).toEqual([
      { key: 'name', required: false, type: 'text' },
      { key: 'description', required: false, type: 'textarea' },
    ]);
  });

  it('renders createdBy as a read-only creator profile column', () => {
    expect(patternDefinition.columns.find((column) => column.key === 'createdBy')).toEqual({
      key: 'createdBy',
      label: 'Người tạo',
      type: 'profile',
      display: { avatar: 'createdBy.avatar', title: 'createdBy.name' },
    });
  });

  it('keeps only the basic list, create, update, and delete capabilities', () => {
    expect(patternDefinition.description).not.toMatch(/kho|đơn hàng/i);
    expect(patternDefinition.actions).toEqual({
      create: true,
      update: true,
      delete: true,
    });
  });
});
