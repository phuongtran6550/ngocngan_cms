<template>
  <svg
    class="cms-icon"
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    :viewBox="viewBox"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-for="(shape, index) in shapes" :key="index">
      <path
        v-if="shape.type === 'filled-path'"
        :d="shape.value"
        fill="currentColor"
        stroke="none"
      />
      <path v-else-if="shape.type === 'path'" :d="shape.value" />
      <circle
        v-else-if="shape.type === 'circle'"
        :cx="shape.cx"
        :cy="shape.cy"
        :r="shape.r"
      />
      <line
        v-else-if="shape.type === 'line'"
        :x1="shape.x1"
        :y1="shape.y1"
        :x2="shape.x2"
        :y2="shape.y2"
      />
      <polyline v-else :points="shape.value" />
    </template>
  </svg>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

type IconShape =
  | { type: "path" | "polyline"; value: string }
  | { type: "filled-path"; value: string }
  | { type: "circle"; cx: number; cy: number; r: number }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number };

const viewBoxes: Record<string, string> = {
  user: "0 0 448 512",
  key: "0 0 512 512",
};

const icons: Record<string, IconShape[]> = {
  "pie-chart": [
    { type: "path", value: "M21.21 15.89A10 10 0 1 1 8.11 2.79" },
    { type: "path", value: "M22 12A10 10 0 0 0 12 2v10z" },
  ],
  "shopping-cart": [
    { type: "circle", cx: 9, cy: 20, r: 1 },
    { type: "circle", cx: 20, cy: 20, r: 1 },
    { type: "path", value: "M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 6H6" },
  ],
  grid: [
    { type: "path", value: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  ],
  table: [
    { type: "path", value: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18" },
  ],
  tag: [
    { type: "path", value: "M20.59 13.41 11 23l-9.59-9.59A2 2 0 0 1 .83 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 1.41.59l8.35 8.35a1.99 1.99 0 0 1 0 2.47z" },
    { type: "circle", cx: 7, cy: 7, r: 1 },
  ],
  gem: [
    { type: "path", value: "M6 3h12l4 6-10 13L2 9Z" },
    { type: "path", value: "m12 22 4-13-3-6" },
    { type: "path", value: "M12 22 8 9l3-6" },
    { type: "path", value: "M2 9h20" },
  ],
  archive: [
    { type: "path", value: "M21 8v13H3V8M1 3h22v5H1zM10 12h4" },
  ],
  truck: [
    { type: "path", value: "M1 3h15v13H1zM16 8h4l3 3v5h-7z" },
    { type: "circle", cx: 5.5, cy: 18.5, r: 2.5 },
    { type: "circle", cx: 18.5, cy: 18.5, r: 2.5 },
  ],
  users: [
    { type: "path", value: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
    { type: "circle", cx: 9, cy: 7, r: 4 },
    { type: "path", value: "M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  ],
  shield: [
    { type: "path", value: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  ],
  "user-check": [
    { type: "path", value: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
    { type: "circle", cx: 8.5, cy: 7, r: 4 },
    { type: "polyline", value: "17 11 19 13 23 9" },
  ],
  "message-circle": [
    { type: "path", value: "M21 11.5a8.4 8.4 0 0 1-9 8.4 9.5 9.5 0 0 1-4.1-1L3 21l1.8-4.8A8.4 8.4 0 1 1 21 11.5z" },
  ],
  settings: [
    { type: "circle", cx: 12, cy: 12, r: 3 },
    { type: "path", value: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.38.37.72.66 1 .3.26.69.4 1.09.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15z" },
  ],
  menu: [{ type: "path", value: "M3 12h18M3 6h18M3 18h18" }],
  moon: [{ type: "path", value: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" }],
  sun: [
    { type: "circle", cx: 12, cy: 12, r: 4 },
    { type: "path", value: "M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" },
  ],
  user: [
    {
      type: "filled-path",
      value: "M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z",
    },
  ],
  key: [
    {
      type: "filled-path",
      value: "M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17l0 80c0 13.3 10.7 24 24 24l80 0c13.3 0 24-10.7 24-24l0-40 40 0c13.3 0 24-10.7 24-24l0-40 40 0c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z",
    },
  ],
  eye: [
    {
      type: "filled-path",
      value: "M21.92,11.6C19.9,6.91,16.1,4,12,4S4.1,6.91,2.08,11.6a1,1,0,0,0,0,.8C4.1,17.09,7.9,20,12,20s7.9-2.91,9.92-7.6A1,1,0,0,0,21.92,11.6ZM12,18c-3.17,0-6.17-2.29-7.9-6C5.83,8.29,8.83,6,12,6s6.17,2.29,7.9,6C18.17,15.71,15.17,18,12,18ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z",
    },
  ],
  "eye-off": [
    {
      type: "filled-path",
      value: "M10.94,6.08A6.93,6.93,0,0,1,12,6c3.18,0,6.17,2.29,7.91,6a15.23,15.23,0,0,1-.9,1.64,1,1,0,0,0-.16.55,1,1,0,0,0,1.86.5,15.77,15.77,0,0,0,1.21-2.3,1,1,0,0,0,0-.79C19.9,6.91,16.1,4,12,4a7.77,7.77,0,0,0-1.4.12,1,1,0,1,0,.34,2ZM3.71,2.29A1,1,0,0,0,2.29,3.71L5.39,6.8a14.62,14.62,0,0,0-3.31,4.8,1,1,0,0,0,0,.8C4.1,17.09,7.9,20,12,20a9.26,9.26,0,0,0,5.05-1.54l3.24,3.25a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Zm6.36,9.19,2.45,2.45A1.81,1.81,0,0,1,12,14a2,2,0,0,1-2-2A1.81,1.81,0,0,1,10.07,11.48ZM12,18c-3.18,0-6.17-2.29-7.9-6A12.09,12.09,0,0,1,6.8,8.21L8.57,10A4,4,0,0,0,14,15.43L15.59,17A7.24,7.24,0,0,1,12,18Z",
    },
  ],
  lock: [
    { type: "path", value: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" },
  ],
  logout: [{ type: "path", value: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" }],
  search: [
    { type: "circle", cx: 11, cy: 11, r: 8 },
    { type: "line", x1: 21, y1: 21, x2: 16.65, y2: 16.65 },
  ],
  "scan-line": [
    { type: "path", value: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" },
  ],
  image: [
    { type: "path", value: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 16l5-5 4 4 2-2 7 7" },
    { type: "circle", cx: 16, cy: 8, r: 1.5 },
  ],
  zap: [
    { type: "path", value: "M13 2 3 14h9l-1 8 10-12h-9z" },
  ],
  chevron: [{ type: "polyline", value: "9 18 15 12 9 6" }],
  "chevron-left": [{ type: "polyline", value: "15 18 9 12 15 6" }],
  "chevron-right": [{ type: "polyline", value: "9 18 15 12 9 6" }],
  "chevrons-left": [{ type: "path", value: "M11 17l-5-5 5-5M18 17l-5-5 5-5" }],
  "chevrons-right": [{ type: "path", value: "M6 17l5-5-5-5M13 17l5-5-5-5" }],
  "chevron-up": [{ type: "polyline", value: "18 15 12 9 6 15" }],
  "chevron-down": [{ type: "polyline", value: "6 9 12 15 18 9" }],
  "chevrons-up-down": [
    { type: "polyline", value: "7 15 12 20 17 15" },
    { type: "polyline", value: "7 9 12 4 17 9" },
  ],
  plus: [{ type: "path", value: "M12 5v14M5 12h14" }],
  filter: [{ type: "polyline", value: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }],
  "arrow-left": [
    { type: "line", x1: 19, y1: 12, x2: 5, y2: 12 },
    { type: "polyline", value: "12 19 5 12 12 5" },
  ],
  edit: [
    { type: "path", value: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" },
    { type: "path", value: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" }
  ],
  "trash-2": [
    { type: "polyline", value: "3 6 5 6 21 6" },
    { type: "path", value: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" },
    { type: "line", x1: 10, y1: 11, x2: 10, y2: 17 },
    { type: "line", x1: 14, y1: 11, x2: 14, y2: 17 }
  ],
  refresh: [{ type: "path", value: "M20 11a8 8 0 1 0 2 5.3M20 4v7h-7" }],
  download: [
    { type: "path", value: "M12 3v12M7 10l5 5 5-5M5 21h14" },
  ],
  "help-circle": [
    { type: "circle", cx: 12, cy: 12, r: 10 },
    { type: "path", value: "M9.1 9a3 3 0 1 1 5.3 1.9c-.9.8-2.4 1.4-2.4 3.1M12 18h.01" },
  ],
  history: [
    { type: "path", value: "M3 12a9 9 0 1 0 3-6.7L3 8" },
    { type: "path", value: "M3 3v5h5M12 7v5l3 2" },
  ],
  copy: [
    { type: "path", value: "M8 8h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" },
    { type: "path", value: "M4 16H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" },
  ],
  "external-link": [
    { type: "path", value: "M14 3h7v7M10 14 21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" },
  ],
  printer: [
    { type: "polyline", value: "6 9 6 2 18 2 18 9" },
    { type: "path", value: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" },
    { type: "path", value: "M6 14h12v8H6z" },
  ],
  phone: [
    { type: "path", value: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" },
  ],
  "more-vertical": [
    { type: "circle", cx: 12, cy: 5, r: 1 },
    { type: "circle", cx: 12, cy: 12, r: 1 },
    { type: "circle", cx: 12, cy: 19, r: 1 },
  ],
  "more-horizontal": [
    { type: "circle", cx: 5, cy: 12, r: 1 },
    { type: "circle", cx: 12, cy: 12, r: 1 },
    { type: "circle", cx: 19, cy: 12, r: 1 },
  ],
  close: [{ type: "path", value: "M18 6 6 18M6 6l12 12" }],
  collapse: [{ type: "path", value: "M11 17l-5-5 5-5M18 17l-5-5 5-5" }],
  expand: [{ type: "path", value: "M13 17l5-5-5-5M6 17l5-5-5-5" }],
  check: [{ type: "polyline", value: "20 6 9 17 4 12" }],
  "check-circle": [
    { type: "path", value: "M22 11.08V12a10 10 0 1 1-5.93-9.14" },
    { type: "polyline", value: "22 4 12 14.01 9 11.01" },
  ],
  "alert-circle": [
    { type: "circle", cx: 12, cy: 12, r: 10 },
    { type: "line", x1: 12, y1: 8, x2: 12, y2: 12 },
    { type: "line", x1: 12, y1: 16, x2: 12.01, y2: 16 },
  ],
};

export default defineComponent({
  name: "AppIcon",
  props: {
    name: { type: String as PropType<string>, required: true },
  },
  computed: {
    viewBox(): string {
      return viewBoxes[this.name] || "0 0 24 24";
    },
    shapes(): IconShape[] {
      return icons[this.name] || icons.grid;
    },
  },
});
</script>
