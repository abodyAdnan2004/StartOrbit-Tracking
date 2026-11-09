<script setup lang="ts">
import { appName } from '~/app.config'
import AppLogo from '~/common/components/global/AppLogo.vue'
import LoginForm from '~/features/auth/components/LoginForm.vue'

// Page meta definition
definePageMeta({
  layout: 'empty',
  title: 'تسجيل الدخول',
  preview: {
    title: 'تسجيل الدخول',
    description: 'صفحة تسجيل الدخول للمستخدمين',
    categories: ['layouts', 'default'],
  },
  name: 'login',
})
useHead({
  title: 'تسجيل الدخول',
})
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center">
    <div class="border-1 h-[400px] max-w-xl overflow-hidden border p-5" dir="rtl">
      <div class="flex flex-col justify-between gap-4">
        <div class="flex items-center gap-4">
          <AppLogo :is-open="false" size="w-25 h-25" />
        </div>

        <div>
          <h1 class="w-4/4 text-xl font-normal">مرحبا بك في {{ appName }}</h1>

          <h5 class="my-5">
            نظام ذكي لإدارة شؤون الموظفين يوفّر أدوات دقيقة لتتبع الحضور والانصراف، مراجعة الطلبات،
            تنظيم الرواتب، ومراقبة الأداء العام للمؤسسة. تم تصميم هذه اللوحة لتسهيل المهام الإدارية
            وتحسين كفاءة العمل من خلال واجهة سهلة الاستخدام وتقارير شاملة تدعم اتخاذ القرار.
          </h5>
        </div>
      </div>
      <div
        class="md:rounded-lt-3xl md:rounded-lb-3xl flex flex-col justify-center gap-7 bg-[#EDF0F2]"
      >
        <div class="flex flex-col gap-5 rounded-3xl bg-white p-6 md:p-10">
          <span class="l text-center text-2xl font-bold text-black">
            <p>تسجيل الدخول</p>
          </span>
          <p class="l text-center text-sm text-muted-500">
            قم بإدخال بريدك الإلكتروني أدناه لتسجيل الدخول إلى حسابك
          </p>
          <LoginForm />
          <div class="grow" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  height: 80vh;
  overflow: hidden;
  background-color: #010518;
}

.card {
  background: linear-gradient(90deg, #ffffff17 0%, #ffffff00 100%);
  border: 1px solid #ffffff42;
}

/* Transition classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transition classes for sliding */
.slide-x-enter-active,
.slide-x-leave-active {
  transition: transform 0.5s ease;
}

.slide-x-enter-from {
  transform: translateX(100%);
  overflow: hidden;
  max-width: 100%;
}

.slide-x-leave-to {
  transform: translateX(-100%);
  overflow: hidden;
  max-width: 100%;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
  transition-delay: 0.3s;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
