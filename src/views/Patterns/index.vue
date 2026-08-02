<template>
  <ListLayout :resource="resource" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ListLayout from "@/components/ListLayout/index.vue";
import { patternResource } from "@/views/Patterns/config";

export default defineComponent({
  name: "PatternListPage",
  components: { ListLayout },
  data() {
    return { resource: patternResource };
  },
});
</script>
