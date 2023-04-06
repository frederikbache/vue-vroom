<template>
  <slot
    v-if="slots.all"
    v-bind="{ ...attrs, isLoading, isFailed, error }"
    name="all"
  />
  <slot name="loading" v-else-if="isLoading" />
  <slot name="failed" v-else-if="isFailed" :error="error" />
  <slot name="default" v-else v-bind="attrs" />
</template>

<script lang="ts" setup>
import { useSlots } from 'vue';

const props = defineProps<{
  isLoading: boolean;
  isFailed: boolean;
  error?: string;
  attrs: object;
}>();

const slots = useSlots();
</script>
