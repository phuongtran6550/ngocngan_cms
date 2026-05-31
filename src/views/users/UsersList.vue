<template>
  <section class="page-shell users-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Quản lý nhân sự</h1>
        <p class="muted">Tài khoản và phân quyền truy cập</p>
      </div>
      <button class="btn btn-primary page-actions" type="button" @click="openCreate">
        <Icon icon="heroicons-outline:plus" />
        Thêm nhân sự
      </button>
    </div>

    <div v-if="error && !isModalOpen" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div class="table-card">
      <div class="panel-body table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Tên</th>
              <th>Vai trò</th>
              <th>Quyền hiệu lực</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.username }}</td>
              <td>{{ user.name }}</td>
              <td>{{ roleSummary(user) }}</td>
              <td>{{ rolePermissionSummary(user.assignedRole) }}</td>
              <td>
                <div class="card-actions">
                  <button class="btn btn-light" type="button" @click="openEdit(user)">Sửa</button>
                  <button class="btn btn-danger" type="button" @click="remove(user)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="isModalOpen" class="user-modal-backdrop" @click.self="closeModal">
      <form class="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title" @submit.prevent="save">
        <header class="user-modal__head">
          <div>
            <h2 id="user-modal-title">{{ editingId ? 'Cập nhật tài khoản' : 'Thêm nhân sự' }}</h2>
            <p class="muted">Thiết lập tài khoản và vai trò truy cập</p>
          </div>
          <button class="btn btn-light btn-icon" type="button" title="Đóng" aria-label="Đóng" @click="closeModal">
            <Icon icon="heroicons-outline:x-mark" />
          </button>
        </header>

        <div class="user-modal__body form-grid">
          <div v-if="error" class="alert alert-danger user-modal__full">{{ error }}</div>
          <div class="form-row">
            <label>Tài khoản</label>
            <input v-model.trim="form.username" class="field" :disabled="Boolean(editingId)" placeholder="VD: nhanvien01">
          </div>
          <div class="form-row">
            <label>Họ và tên</label>
            <input v-model.trim="form.name" class="field" placeholder="Tên hiển thị">
          </div>
          <div class="form-row">
            <label>Mật khẩu</label>
            <input
              v-model="form.password"
              class="field"
              type="password"
              :placeholder="editingId ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'"
            >
          </div>
          <div class="form-row user-modal__full">
            <label>Vai trò</label>
            <select v-model="form.roleId" class="select" required>
              <option value="">Chưa chọn vai trò</option>
              <option v-for="role in roleOptions" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
            <small v-if="selectedRole" class="muted">{{ rolePermissionSummary(selectedRole) }}</small>
          </div>
        </div>

        <footer class="user-modal__actions">
          <button class="btn btn-light" type="button" @click="closeModal">Đóng</button>
          <button class="btn btn-primary" type="submit">
            <Icon :icon="editingId ? 'heroicons-outline:pencil-square' : 'heroicons-outline:plus'" />
            {{ editingId ? 'Cập nhật' : 'Tạo mới' }}
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

const users = ref([]);
const roles = ref([]);
const editingId = ref('');
const isModalOpen = ref(false);
const error = ref('');
const success = ref('');
const form = reactive({ username: '', name: '', password: '', roleId: '' });

const roleOptions = computed(() => roles.value);
const selectedRole = computed(() => roleOptions.value.find((role) => role.id === form.roleId));

function resetForm() {
  editingId.value = '';
  form.username = '';
  form.name = '';
  form.password = '';
  form.roleId = '';
}

function openCreate() {
  error.value = '';
  success.value = '';
  resetForm();
  isModalOpen.value = true;
}

function openEdit(user) {
  error.value = '';
  success.value = '';
  editingId.value = user.id;
  form.username = user.username;
  form.name = user.name;
  form.password = '';
  form.roleId = user.roleId || user.assignedRole?.id || roleOptions.value.find((role) => role.systemRole === user.role)?.id || '';
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  error.value = '';
  resetForm();
}

async function load() {
  const [{ data: usersData }, { data: rolesData }] = await Promise.all([
    api.get('/users'),
    api.get('/roles')
  ]);
  users.value = usersData.items;
  roles.value = rolesData.items;
}

function roleSummary(user) {
  return user.assignedRole?.name || 'Chưa chọn vai trò';
}

function rolePermissionSummary(role) {
  const permissions = role?.permissions || [];
  if (!permissions.length) {
    return 'Không có quyền CMS';
  }
  return `${permissions.length} quyền`;
}

async function save() {
  error.value = '';
  success.value = '';
  const payload = { name: form.name, roleId: form.roleId };
  if (!editingId.value) {
    payload.username = form.username;
    payload.password = form.password;
  } else if (form.password) {
    payload.password = form.password;
  }

  try {
    if (editingId.value) {
      await api.patch(`/users/${editingId.value}`, payload);
      success.value = 'Cập nhật tài khoản thành công';
    } else {
      await api.post('/users', payload);
      success.value = 'Tạo tài khoản thành công';
    }
    closeModal();
    await load();
  } catch (err) {
    error.value = apiMessage(err);
  }
}

async function remove(user) {
  if (!window.confirm(`Xóa tài khoản ${user.username}?`)) return;
  await api.delete(`/users/${user.id}`);
  await load();
}

onMounted(() => load().catch((err) => { error.value = apiMessage(err); }));
</script>
