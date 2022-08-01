import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Vuetify from 'vuetify';

import * as turf from '@turf/turf'
Vue.prototype.$turf = turf

Vue.config.productionTip = false;
Vue.use(Vuetify);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
