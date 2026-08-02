<template>
  <span class="cms-brand-identity" :class="`cms-brand-identity--${kind}`">
    <img
      data-testid="brand-logo"
      class="cms-brand-logo"
      :class="`cms-brand-logo--${kind}`"
      :src="src"
      :alt="alt"
    />
    <span
      v-if="showName"
      class="logo-text ms-2"
      :class="{ 'd-none d-sm-block': hideNameOnMobile }"
    >{{ brand.name }}</span>
  </span>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { brand, brandAsset, type BrandLogoKind, type BrandLogoTone } from "@/config/brand";

export default defineComponent({
  name: "BrandLogo",
  props: {
    kind: { type: String as PropType<BrandLogoKind>, default: "mark" },
    tone: { type: String as PropType<BrandLogoTone>, default: "gold" },
    alt: { type: String, default: brand.name },
    showName: { type: Boolean, default: false },
    hideNameOnMobile: { type: Boolean, default: false },
  },
  data() {
    return { brand };
  },
  computed: {
    src(): string {
      return brandAsset(this.kind, this.tone);
    },
  },
});
</script>
