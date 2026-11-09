<script setup lang="ts">
const app = useAppConfig()

const command = 'pnpm dev'

const nuxtConfig = [
  `export default defineNuxtConfig({`,
  `  extends: [`,
  `    '../layers/tairo-layout-sidebar',`,
  `    '../layers/tairo',`,
  `  ]`,
  `})`,
].join('\n')

const codeLayout = [
  `<template>`,
  `  <TairoSidebarLayout>`,
  `    <slot />`,
  `  </TairoSidebarLayout>`,
  `</template>`,
].join('\n')

const codePage = [
  `<script setup lang="ts">`,
  `definePageMeta({`,
  `  title: 'My page',`,
  `})`,
  `<` + `/script>`,
  ``,
  `<template>`,
  `  <div>Hello Tairo!</div>`,
  `</template>`,
].join('\n')

const codeTailwind = [
  `import { withShurikenUI } from '@shuriken-ui/tailwind'`,
  `import colors from 'tailwindcss/colors'`,
  ``,
  `export default withShurikenUI({`,
  `  content: [],`,
  `  theme: {`,
  `    extend: {`,
  `      colors: {`,
  `        primary: colors.red,`,
  `        muted: colors.stone,`,
  `      }`,
  `    }`,
  `  }`,
  `})`,
].join('\n')
</script>

<template>
  <div class="mx-auto max-w-4xl pb-16">
    <div class="absolute right-6 top-3">
      <BaseThemeToggle />
    </div>
    <div class="flex flex-col gap-3 pb-16 pt-8 text-center">
      <BaseHeading size="md" weight="medium" class="uppercase">
        <span>Welcome to</span>
      </BaseHeading>
      <TairoLogoText class="mx-auto h-8 text-primary-500" />
    </div>
    <BaseCard rounded="lg" class="mb-4 p-8 dark:!bg-muted-900 sm:mb-6">
      <div
        class="nui-mask nui-mask-hexed absolute inset-x-0 -top-10 mx-auto mb-2 flex size-[84px] shrink-0 items-center justify-center"
      >
        <div
          class="absolute inset-0 flex size-full animate-spin-slow items-center justify-center bg-gradient-to-tr from-primary-100 to-primary-500 blur-sm transition-all duration-200 dark:from-primary-800"
        />
        <div
          class="nui-mask nui-mask-hexed flex size-[80px] items-center justify-center bg-white dark:bg-muted-800"
        >
          <Icon name="ph:sparkle-duotone" class="size-8 text-primary-500" />
        </div>
      </div>
      <div class="space-y-2 pt-6 text-center">
        <BaseHeading size="lg" weight="semibold">
          <span>Start your first page</span>
        </BaseHeading>
        <BaseParagraph size="sm" class="mx-auto max-w-2xl text-muted-500 dark:text-muted-400">
          Welcome to the Tairo app starter. You are here because you ran the
          <code class="rounded bg-muted-100 p-1 font-mono text-primary-500 dark:bg-muted-700/70">
            {{ command }}
          </code>
          command in your terminal. Follow the instructions below to configure the project and start
          building your first page.
        </BaseParagraph>
      </div>
    </BaseCard>

    <div class="mb-4 grid grid-cols-1 gap-4 sm:mb-6 sm:grid-cols-2 sm:gap-6">
      <div class="grid grid-cols-2 gap-4 sm:gap-6">
        <NuxtLink
          to="https://tairo.cssninja.io"
          taget="_blank"
          rel="noopener noreferrer"
          class="relative"
        >
          <BaseCard
            rounded="lg"
            elevated-hover
            class="relative z-10 h-full p-4 hover:!border-primary-500 dark:!bg-muted-900"
          >
            <div class="flex h-full flex-col items-center justify-center gap-2">
              <div
                class="nui-mask nui-mask-hexed relative flex size-16 shrink-0 items-center justify-center"
              >
                <div
                  class="absolute inset-0 flex size-full animate-spin-slow items-center justify-center bg-gradient-to-tr from-primary-100 to-primary-500 blur-sm transition-all duration-200 dark:from-primary-800"
                />
                <div
                  class="nui-mask nui-mask-hexed flex size-[60px] items-center justify-center bg-white dark:bg-muted-800"
                >
                  <Icon name="ph:sidebar-duotone" class="size-6 text-primary-500" />
                </div>
              </div>
              <BaseText size="sm" class="text-muted-500 dark:text-muted-300">
                Online demo
              </BaseText>
            </div>
          </BaseCard>
        </NuxtLink>
        <NuxtLink
          to="https://nuxt.com/docs"
          taget="_blank"
          rel="noopener noreferrer"
          class="relative"
        >
          <BaseCard
            rounded="lg"
            elevated-hover
            class="relative z-10 h-full p-4 hover:!border-success-500 dark:!bg-muted-900"
          >
            <div class="flex h-full flex-col items-center justify-center gap-2">
              <div
                class="nui-mask nui-mask-hexed relative flex size-16 shrink-0 items-center justify-center"
              >
                <div
                  class="absolute inset-0 flex size-full animate-spin-slow items-center justify-center bg-gradient-to-tr from-success-100 to-success-500 blur-sm transition-all duration-200 dark:from-success-800"
                />
                <div
                  class="nui-mask nui-mask-hexed flex size-[60px] items-center justify-center bg-white dark:bg-muted-800"
                >
                  <Icon
                    name="simple-icons:nuxtdotjs"
                    class="relative -top-0.5 size-5 text-success-500"
                  />
                </div>
              </div>
              <BaseText size="sm" class="text-muted-500 dark:text-muted-300">
                Nuxt documentation
              </BaseText>
            </div>
          </BaseCard>
        </NuxtLink>
        <NuxtLink
          to="https://cssninja.io/faq/github-access"
          taget="_blank"
          rel="noopener noreferrer"
          class="relative"
        >
          <BaseCard
            rounded="lg"
            elevated-hover
            class="relative z-10 h-full p-4 hover:!border-purple-500 dark:!bg-muted-900"
          >
            <div class="flex h-full flex-col items-center justify-center gap-2">
              <div
                class="nui-mask nui-mask-hexed relative flex size-16 shrink-0 items-center justify-center"
              >
                <div
                  class="absolute inset-0 flex size-full animate-spin-slow items-center justify-center bg-gradient-to-tr from-purple-100 to-purple-500 blur-sm transition-all duration-200 dark:from-purple-800"
                />
                <div
                  class="nui-mask nui-mask-hexed flex size-[60px] items-center justify-center bg-white dark:bg-muted-800"
                >
                  <Icon name="fa6-brands:github" class="relative -top-0.5 size-5 text-purple-500" />
                </div>
              </div>
              <BaseText size="sm" class="text-muted-500 dark:text-muted-300">
                Github Access
              </BaseText>
            </div>
          </BaseCard>
        </NuxtLink>
        <NuxtLink
          to="https://go.cssninja.io/discord"
          taget="_blank"
          rel="noopener noreferrer"
          class="relative"
        >
          <BaseCard
            rounded="lg"
            elevated-hover
            class="relative z-10 h-full p-4 hover:!border-blue-500 dark:!bg-muted-900"
          >
            <div class="flex h-full flex-col items-center justify-center gap-2">
              <div
                class="nui-mask nui-mask-hexed relative flex size-16 shrink-0 items-center justify-center"
              >
                <div
                  class="absolute inset-0 flex size-full animate-spin-slow items-center justify-center bg-gradient-to-tr from-blue-100 to-blue-500 blur-sm transition-all duration-200 dark:from-blue-800"
                />
                <div
                  class="nui-mask nui-mask-hexed flex size-[60px] items-center justify-center bg-white dark:bg-muted-800"
                >
                  <Icon name="fa6-brands:discord" class="relative -top-0.5 size-5 text-blue-500" />
                </div>
              </div>
              <BaseText size="sm" class="text-muted-500 dark:text-muted-300">
                Discord Server
              </BaseText>
            </div>
          </BaseCard>
        </NuxtLink>
      </div>
      <NuxtLink
        to="https://tairo.cssninja.io/documentation"
        taget="_blank"
        rel="noopener noreferrer"
        class="relative"
      >
        <BaseCard
          rounded="lg"
          elevated-hover
          class="relative z-10 p-5 hover:!border-primary-500 dark:!bg-muted-900"
        >
          <div
            class="gridlines relative mb-4 flex h-40 w-full items-center justify-center overflow-hidden"
          >
            <div
              class="nui-mask nui-mask-hexed relative mb-2 flex size-[84px] shrink-0 items-center justify-center"
            >
              <div
                class="absolute inset-0 flex size-full animate-spin-slow items-center justify-center bg-gradient-to-tr from-primary-100 to-primary-500 blur-sm transition-all duration-200 dark:from-primary-800"
              />
              <div
                class="nui-mask nui-mask-hexed flex size-[80px] items-center justify-center bg-white dark:bg-muted-800"
              >
                <Icon name="ph:book-open-duotone" class="size-7 text-primary-500" />
              </div>
            </div>
            <div
              class="absolute -right-4 bottom-0 h-full w-24 scale-105 bg-white blur-lg dark:bg-muted-900"
            />
          </div>
          <div>
            <BaseHeading
              as="h3"
              size="md"
              weight="light"
              lead="tight"
              class="mx-auto text-muted-800 dark:text-white"
            >
              Online documentation
            </BaseHeading>
            <BaseParagraph size="sm" class="mx-auto my-2 text-muted-500 dark:text-muted-100">
              Reviewing Tairo's documentation is essential to get a grasp on all basic concepts used
              in this project and to get some code examples that you can immediately paste in.
            </BaseParagraph>
          </div>
        </BaseCard>
      </NuxtLink>
    </div>

    <div class="flex items-center py-4">
      <div class="h-px grow bg-muted-200 dark:bg-muted-800" />
      <span
        class="text-semibold text-muted-800d shrink px-4 font-sans text-lg font-semibold dark:text-muted-100"
        >Getting started</span
      >
      <div class="h-px grow bg-muted-200 dark:bg-muted-800" />
    </div>

    <div class="flex flex-col gap-6">
      <BaseCard class="p-6 dark:!bg-muted-900" rounded="sm">
        <BaseProse class="max-w-full prose-p:my-0">
          <div>
            <div class="flex gap-2 sm:items-center">
              <Icon name="ph:number-circle-one-duotone" class="size-8 shrink-0 text-primary-500" />
              <p>
                Enable a layout in
                <code>.app/nuxt.config.ts</code>
              </p>
            </div>
            <pre><code>{{ nuxtConfig }}</code></pre>
          </div>
        </BaseProse>
      </BaseCard>
      <BaseCard class="p-6 dark:!bg-muted-900" rounded="sm">
        <BaseProse class="max-w-full prose-p:my-0">
          <div>
            <div class="flex gap-2 sm:items-center">
              <Icon name="ph:number-circle-two-duotone" class="size-8 shrink-0 text-primary-500" />
              <p>
                Set default layout in
                <code>.app/layouts/default.vue</code>
              </p>
            </div>
            <pre><code>{{ codeLayout }}</code></pre>
          </div>
        </BaseProse>
      </BaseCard>
      <BaseCard class="p-6 dark:!bg-muted-900" rounded="sm">
        <BaseProse class="max-w-full prose-p:my-0">
          <div>
            <div class="flex gap-2 sm:items-center">
              <Icon
                name="ph:number-circle-three-duotone"
                class="size-8 shrink-0 text-primary-500"
              />
              <p>
                Define your app settings in
                <code>.app/app.config.ts</code>
                <small>(logo, name, sidebars, panels, ...)</small>
              </p>
            </div>
            <pre><code>export default defineAppConfig({{ app.tairo }})</code></pre>
          </div>
        </BaseProse>
      </BaseCard>
      <BaseCard class="p-6 dark:!bg-muted-900" rounded="sm">
        <BaseProse class="max-w-full prose-p:my-0">
          <div>
            <div class="flex gap-2 sm:items-center">
              <Icon name="ph:number-circle-four-duotone" class="size-8 shrink-0 text-primary-500" />
              <p>
                Create your first page
                <code>.app/pages/index.vue</code>
              </p>
            </div>
            <pre><code>{{ codePage }}</code></pre>
          </div>
        </BaseProse>
      </BaseCard>
      <BaseCard class="p-6 dark:!bg-muted-900" rounded="sm">
        <BaseProse class="max-w-full prose-p:my-0">
          <div>
            <div class="flex gap-2 sm:items-center">
              <Icon name="ph:number-circle-five-duotone" class="size-8 shrink-0 text-primary-500" />
              <p>
                Customize tailwind settings in
                <code>.app/tailwind.config.ts</code>
                <small>(colors, fonts, ...)</small>
              </p>
            </div>
            <pre><code>{{ codeTailwind }}</code></pre>
          </div>
        </BaseProse>
      </BaseCard>
      <BaseCard class="p-6 dark:!bg-muted-900" rounded="sm">
        <BaseProse class="max-w-full prose-p:my-0">
          <div>
            <div class="flex gap-2 sm:items-center">
              <Icon name="ph:number-circle-six-duotone" class="size-8 shrink-0 text-primary-500" />
              <p>
                Continue learning with the
                <a href="https://tairo.cssninja.io/documentation" target="_blank"
                  >Online documentation</a
                >
              </p>
            </div>
          </div>
        </BaseProse>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.gridlines {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGcgZmlsbC1ydWxlPSJldmVub2RkIj48ZyBmaWxsPSIjZWJlYmViIj48cGF0aCBvcGFjaXR5PSIuNSIgZD0iTTk2IDk1aDR2MWgtNHY0aC0xdi00aC05djRoLTF2LTRoLTl2NGgtMXYtNGgtOXY0aC0xdi00aC05djRoLTF2LTRoLTl2NGgtMXYtNGgtOXY0aC0xdi00aC05djRoLTF2LTRoLTl2NGgtMXYtNEgwdi0xaDE1di05SDB2LTFoMTV2LTlIMHYtMWgxNXYtOUgwdi0xaDE1di05SDB2LTFoMTV2LTlIMHYtMWgxNXYtOUgwdi0xaDE1di05SDB2LTFoMTV2LTlIMHYtMWgxNVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djl6bS0xIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS05LTEwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTktMTB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS05LTEwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTktMTB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS05LTEwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTktMTB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS05LTEwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6IiAvPjxwYXRoIGQ9Ik02IDVWMEg1djVIMHYxaDV2OTRoMVY2aDk0VjVINnoiIC8+PC9nPjwvZz48L3N2Zz4K');
}

.dark .gridlines {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGcgZmlsbC1ydWxlPSJldmVub2RkIj48ZyBmaWxsPSIjMjcyZTNlIj48cGF0aCBvcGFjaXR5PSIuNSIgZD0iTTk2IDk1aDR2MWgtNHY0aC0xdi00aC05djRoLTF2LTRoLTl2NGgtMXYtNGgtOXY0aC0xdi00aC05djRoLTF2LTRoLTl2NGgtMXYtNGgtOXY0aC0xdi00aC05djRoLTF2LTRoLTl2NGgtMXYtNEgwdi0xaDE1di05SDB2LTFoMTV2LTlIMHYtMWgxNXYtOUgwdi0xaDE1di05SDB2LTFoMTV2LTlIMHYtMWgxNXYtOUgwdi0xaDE1di05SDB2LTFoMTV2LTlIMHYtMWgxNVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoOVYwaDF2MTVoNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djloNHYxaC00djl6bS0xIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS05LTEwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTktMTB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS05LTEwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTktMTB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS05LTEwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTktMTB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS0xMCAwdi05aC05djloOXptLTEwIDB2LTloLTl2OWg5em0tMTAgMHYtOWgtOXY5aDl6bS05LTEwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6bTEwIDBoOXYtOWgtOXY5em0xMCAwaDl2LTloLTl2OXptMTAgMGg5di05aC05djl6IiBmaWxsPSIjMjcyZTNlIi8+PHBhdGggZD0iTTYgNVYwSDV2NUgwdjFoNXY5NGgxVjZoOTRWNUg2eiIgZmlsbD0iIzI3MmUzZSIvPjwvZz48L2c+PC9zdmc+');
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
