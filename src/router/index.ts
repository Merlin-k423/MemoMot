import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/learn' },
    {
      path: '/learn',
      name: 'learn',
      component: () => import('@/views/LearnView.vue'),
    },
    {
      path: '/words',
      name: 'words',
      component: () => import('@/views/WordsView.vue'),
    },
    {
      path: '/review',
      name: 'review',
      component: () => import('@/views/ReviewView.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

export default router
