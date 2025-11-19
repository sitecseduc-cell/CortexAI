<script setup>
import PlatformView from '@/views/PlatformView.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';
</script>
<template>
  <div class="dark min-h-screen bg-slate-950 text-white">
    <ToastContainer />
    <PlatformView />
  </div>
</template>
<style>
body {
  @apply bg-slate-950 text-white;
  margin: 0;
}
</style>