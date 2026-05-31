<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div v-if="error" class="rounded-md bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
      {{ error }}
    </div>

    <Textinput
      v-model="username"
      label="Tài khoản"
      type="text"
      placeholder="Nhập tài khoản"
      name="username"
      :error="usernameError"
      classInput="h-[48px]"
      autocomplete="username"
    />

    <Textinput
      v-model="password"
      label="Mật khẩu"
      type="password"
      placeholder="Nhập mật khẩu"
      name="password"
      :error="passwordError"
      hasicon
      classInput="h-[48px]"
      autocomplete="current-password"
    />

    <div class="flex justify-between">
      <label class="cursor-pointer flex items-start">
        <input type="checkbox" class="hidden" @change="checkbox = !checkbox">
        <span
          class="h-4 w-4 border rounded flex-none inline-flex mr-3 relative top-1 transition-all duration-150"
          :class="
            checkbox
              ? 'ring-2 ring-black-500 ring-offset-2 bg-slate-900'
              : 'bg-slate-100 border-slate-100'
          "
        >
          <img
            v-if="checkbox"
            src="@/assets/images/icon/ck-white.svg"
            alt=""
            class="h-[10px] w-[10px] block m-auto"
          >
        </span>
        <span class="text-slate-500 text-sm leading-6">Ghi nhớ đăng nhập</span>
      </label>
    </div>

    <button type="submit" class="btn btn-dark block w-full text-center" :disabled="loading">
      {{ loading ? 'Đang xử lý' : 'Đăng nhập' }}
    </button>
  </form>
</template>

<script>
import Textinput from '@/components/Textinput';
import { apiMessage } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';
import { ref } from 'vue';

export default {
  components: {
    Textinput
  },
  setup() {
    const auth = useAuthStore();
    const router = useRouter();
    const checkbox = ref(false);
    const error = ref('');
    const loading = ref(false);

    const schema = yup.object({
      username: yup.string().required('Vui lòng nhập tài khoản').min(3, 'Tài khoản phải chứa ít nhất 3 ký tự'),
      password: yup.string().required('Vui lòng nhập mật khẩu').min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
    });

    const { handleSubmit } = useForm({
      validationSchema: schema,
      initialValues: {
        username: '',
        password: ''
      }
    });

    const { value: username, errorMessage: usernameError } = useField('username');
    const { value: password, errorMessage: passwordError } = useField('password');

    const onSubmit = handleSubmit(async (values) => {
      error.value = '';
      loading.value = true;
      try {
        const user = await auth.login(values);
        router.push(user.role === 'ADMINISTRATOR' ? '/dashboard' : '/orders');
      } catch (err) {
        error.value = apiMessage(err);
      } finally {
        loading.value = false;
      }
    });

    return {
      checkbox,
      error,
      loading,
      username,
      usernameError,
      password,
      passwordError,
      onSubmit
    };
  }
};
</script>
