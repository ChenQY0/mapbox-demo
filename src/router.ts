import Vue from 'vue';
import Router from 'vue-router';
import MapHome from '@/views/MapHome.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'MapHome',
      component: MapHome,
    },
  ],
});
