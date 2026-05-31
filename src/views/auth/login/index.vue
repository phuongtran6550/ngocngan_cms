<template>
  <div class="loginwrapper ngocchau-login">
    <div class="lg-inner-column ngocchau-login__layout">
      <div class="left-column ngocchau-login__left relative z-[1]">
        <div class="ngocchau-login__shine ngocchau-login__shine--top" aria-hidden="true"></div>
        <div class="ngocchau-login__shine ngocchau-login__shine--bottom" aria-hidden="true"></div>
        <div class="ngocchau-login__intro">
          <router-link to="/" class="ngocchau-login__brand">
            <img :src="logo" :alt="APP_NAME">
          </router-link>

          <h4>
            Quản lý bạn hàng
            <span class="text-slate-800 font-bold">nhanh và rõ</span>
          </h4>
        </div>
        <div class="ngocchau-login__art">
          <img :src="sideImg" alt="">
        </div>
        <div class="ngocchau-login__jewel" aria-hidden="true">
          <span></span>
        </div>
      </div>
      <div class="right-column ngocchau-login__right relative">
        <div class="inner-content ngocchau-login__content h-full flex flex-col bg-white">
          <div class="auth-box ngocchau-login__box h-full flex flex-col justify-center">
            <div class="mobile-logo text-center mb-6 lg:hidden block">
              <router-link to="/">
                <img :src="logo" :alt="APP_NAME" class="mx-auto">
              </router-link>
            </div>
            <div class="text-center 2xl:mb-10 mb-4">
              <h4 class="font-medium">Đăng nhập</h4>
              <div class="text-slate-500 text-base">
                Đăng nhập để sử dụng hệ thống {{ APP_NAME }}
              </div>
            </div>
            <Signin />
          </div>
          <div class="auth-footer text-center">
            Copyright 2026, {{ APP_NAME }}. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { APP_NAME } from '@/config/app';
import logo from '@/assets/images/logo/logo.svg';
import sideImg from '@/assets/images/auth/ils1.svg';
import Signin from '../common/Signin';

export default {
  components: {
    Signin
  },
  setup() {
    return {
      APP_NAME,
      logo,
      sideImg
    };
  }
};
</script>
