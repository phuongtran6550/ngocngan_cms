<template>
  <section class="page-shell roles-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Vai trò</h1>
        <p class="muted">Tạo bộ quyền dùng lại cho nhân sự</p>
      </div>
      <button class="btn btn-primary page-actions" type="button" @click="openCreate">
        <Icon icon="heroicons-outline:plus" />
        Thêm vai trò
      </button>
    </div>

    <div v-if="error && !isModalOpen" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div class="table-card">
      <div class="panel-body table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Vai trò</th>
              <th>Mô tả</th>
              <th>Quyền</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in roles" :key="role.id">
              <td>{{ role.name }}</td>
              <td>{{ role.description || '-' }}</td>
              <td>{{ permissionSummary(role) }}</td>
              <td>
                <div class="card-actions">
                  <button class="btn btn-light" type="button" @click="openEdit(role)">Sửa</button>
                  <button class="btn btn-danger" type="button" @click="remove(role)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="isModalOpen" class="role-modal-backdrop" @click.self="closeModal">
      <form class="role-modal" role="dialog" aria-modal="true" aria-labelledby="role-modal-title" @submit.prevent="save">
        <header class="role-modal__head">
          <div>
            <h2 id="role-modal-title">{{ editingId ? 'Cập nhật vai trò' : 'Thêm vai trò' }}</h2>
            <p class="muted">Chọn bộ quyền thao tác cho nhân sự</p>
          </div>
          <button class="btn btn-light btn-icon" type="button" title="Đóng" aria-label="Đóng" @click="closeModal">
            <Icon icon="heroicons-outline:x-mark" />
          </button>
        </header>

        <div class="role-modal__body form-grid">
          <div v-if="error" class="alert alert-danger permission-row">{{ error }}</div>
          <div class="form-row">
            <label>Tên vai trò</label>
            <input v-model.trim="form.name" class="field" placeholder="VD: Nhân viên bán hàng">
          </div>
          <div class="form-row">
            <label>Mô tả</label>
            <input v-model.trim="form.description" class="field" placeholder="Ghi chú ngắn">
          </div>
          <div class="form-row permission-row">
            <label>Quyền thao tác</label>
            <div class="role-permission-groups">
              <details v-for="group in groupedPermissionCatalog" :key="group.name" class="role-permission-group">
                <summary>
                  <span>{{ group.name }}</span>
                  <span class="compact-chip">{{ selectedCount(group.items) }}/{{ group.items.length }}</span>
                </summary>
                <div class="role-permission-options">
                  <label v-for="permission in group.items" :key="permission.key" class="permission-option">
                    <input
                      type="checkbox"
                      :checked="form.permissions.includes(permission.key)"
                      @change="togglePermission(permission.key)"
                    >
                    <span>{{ permission.label }}</span>
                  </label>
                </div>
              </details>
            </div>
          </div>
        </div>

        <footer class="role-modal__actions">
          <button class="btn btn-light" type="button" @click="closeModal">Đóng</button>
          <button class="btn btn-primary" type="submit">
            <Icon :icon="editingId ? 'heroicons-outline:pencil-square' : 'heroicons-outline:plus'" />
            {{ editingId ? 'Cập nhật' : 'Tạo vai trò' }}
          </button>
        </footer>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import Icon from '@/components/Icon';
import { api, apiMessage } from '@/services/api';

const roles = ref([]);
const permissionCatalog = ref([]);
const editingId = ref('');
const isModalOpen = ref(false);
const error = ref('');
const success = ref('');
const form = reactive({ name: '', description: '', permissions: [] });

const groupedPermissionCatalog = computed(() => {
  const groups = new Map();
  permissionCatalog.value.forEach((permission) => {
    if (!groups.has(permission.group)) {
      groups.set(permission.group, []);
    }
    groups.get(permission.group).push(permission);
  });

  return Array.from(groups, ([name, items]) => ({ name, items }));
});

function resetForm() {
  editingId.value = '';
  form.name = '';
  form.description = '';
  form.permissions = [];
}

function openCreate() {
  error.value = '';
  success.value = '';
  resetForm();
  isModalOpen.value = true;
}

function openEdit(role) {
  error.value = '';
  success.value = '';
  editingId.value = role.id;
  form.name = role.name;
  form.description = role.description || '';
  form.permissions = [...(role.permissions || [])];
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  error.value = '';
  resetForm();
}

async function load() {
  const [{ data: rolesData }, { data: permissionsData }] = await Promise.all([
    api.get('/roles'),
    api.get('/users/permissions')
  ]);
  roles.value = rolesData.items;
  permissionCatalog.value = permissionsData.items;
}

function togglePermission(key) {
  if (form.permissions.includes(key)) {
    form.permissions = form.permissions.filter((item) => item !== key);
    return;
  }

  form.permissions = [...form.permissions, key];
}

function selectedCount(items) {
  return items.filter((permission) => form.permissions.includes(permission.key)).length;
}

function permissionSummary(role) {
  const selected = role.permissions || [];
  if (!selected.length) {
    return 'Chưa cấp quyền';
  }

  const labels = selected
    .map((key) => permissionCatalog.value.find((item) => item.key === key)?.label || key)
    .slice(0, 3);
  const suffix = selected.length > 3 ? ` +${selected.length - 3}` : '';
  return `${labels.join(', ')}${suffix}`;
}

async function save() {
  error.value = '';
  success.value = '';
  const payload = {
    name: form.name,
    description: form.description,
    permissions: form.permissions
  };

  try {
    if (editingId.value) {
      await api.patch(`/roles/${editingId.value}`, payload);
      success.value = 'Cập nhật vai trò thành công';
    } else {
      await api.post('/roles', payload);
      success.value = 'Tạo vai trò thành công';
    }
    closeModal();
    await load();
  } catch (err) {
    error.value = apiMessage(err);
  }
}

async function remove(role) {
  if (!window.confirm(`Xóa vai trò ${role.name}?`)) return;
  try {
    await api.delete(`/roles/${role.id}`);
    await load();
  } catch (err) {
    error.value = apiMessage(err);
  }
}

onMounted(() => load().catch((err) => { error.value = apiMessage(err); }));
</script>
