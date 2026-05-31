import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { APP_NAME } from './config/app';
import router from './router';
import './assets/scss/tailwind.scss';
import './assets/scss/auth.scss';
import './assets/ngocchau.css';

document.title = APP_NAME;

createApp(App).use(createPinia()).use(router).mount('#app');

function removeInitialLoader() {
  const loader = document.getElementById('loading-bg');
  if (loader) {
    loader.remove();
  }
}

removeInitialLoader();
