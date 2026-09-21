<template>
  <ProductBarcodeScanner
    :open="open"
    continuous
    title="Quét liên tục vào giỏ hàng"
    description="Quét từng tem. Mỗi mã hợp lệ được thêm ngay và camera tiếp tục chờ sản phẩm kế tiếp."
    :resolver="add"
    @close="$emit('close')"
  />
</template>

<script setup lang="ts">
import ProductBarcodeScanner from "@/views/Products/components/ProductBarcodeScanner.vue";
import { useSalesCartStore } from "@/views/Orders/cart";
import type { BarcodeResolutionFeedback, ProductSku } from "@/views/Products/types";

defineProps<{ open: boolean }>();
const emit = defineEmits<{
  close: [];
  feedback: [message: string, ok: boolean];
}>();
const cart = useSalesCartStore();

function add(sku: ProductSku): BarcodeResolutionFeedback {
  const result = cart.add(sku);
  const message = `${sku.name}: ${result.message}`;
  emit("feedback", message, result.ok);
  return {
    ok: result.ok,
    message,
    quantity: result.quantity,
    total: cart.total,
    itemQuantity: cart.itemQuantity,
    rawPrice: result.rawPrice ?? null,
  };
}
</script>
