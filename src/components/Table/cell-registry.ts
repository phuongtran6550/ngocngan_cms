import type { Component } from "vue";
import type { TableCellType } from "@/config/resource";
import AuthenCell from "@/components/Table/cells/AuthenCell.vue";
import ActionCell from "@/components/Table/cells/ActionCell.vue";
import BarChartCell from "@/components/Table/cells/BarChartCell.vue";
import BadgeCell from "@/components/Table/cells/BadgeCell.vue";
import DateTimeCell from "@/components/Table/cells/DateTimeCell.vue";
import DefaultCell from "@/components/Table/cells/DefaultCell.vue";
import DollarCell from "@/components/Table/cells/DollarCell.vue";
import DurationCell from "@/components/Table/cells/DurationCell.vue";
import GroupTextCell from "@/components/Table/cells/GroupTextCell.vue";
import HyperlinkCell from "@/components/Table/cells/HyperlinkCell.vue";
import IconCell from "@/components/Table/cells/IconCell.vue";
import IconsCell from "@/components/Table/cells/IconsCell.vue";
import ImageCell from "@/components/Table/cells/ImageCell.vue";
import NumberCell from "@/components/Table/cells/NumberCell.vue";
import ProfileCell from "@/components/Table/cells/ProfileCell.vue";
import ProductCell from "@/components/Table/cells/ProductCell.vue";
import STTCell from "@/components/Table/cells/STTCell.vue";
import StatusCell from "@/components/Table/cells/StatusCell.vue";
import SwitchCell from "@/components/Table/cells/SwitchCell.vue";
import TagsCell from "@/components/Table/cells/TagsCell.vue";
import TextCell from "@/components/Table/cells/TextCell.vue";
import TextIsReadCell from "@/components/Table/cells/TextIsReadCell.vue";
import TextsCell from "@/components/Table/cells/TextsCell.vue";
import VideoCell from "@/components/Table/cells/VideoCell.vue";
import CopyCell from "@/components/Table/cells/CopyCell.vue";

const cells: Partial<Record<TableCellType, Component>> = {
  action: ActionCell,
  authen: AuthenCell,
  badge: BadgeCell,
  barChart: BarChartCell,
  boolean: SwitchCell,
  copy: CopyCell,
  date: DateTimeCell,
  datetime: DateTimeCell,
  default: DefaultCell,
  dollar: DollarCell,
  duration: DurationCell,
  group_text: GroupTextCell,
  hyperlink: HyperlinkCell,
  icon: IconCell,
  icons: IconsCell,
  image: ImageCell,
  money: NumberCell,
  number: NumberCell,
  profile: ProfileCell,
  product: ProductCell,
  status: StatusCell,
  stt: STTCell,
  switch: SwitchCell,
  tags: TagsCell,
  text: TextCell,
  textIsRead: TextIsReadCell,
  texts: TextsCell,
  time: DateTimeCell,
  video: VideoCell,
};

export function resolveTableCell(type: TableCellType): Component {
  return cells[type] || DefaultCell;
}
