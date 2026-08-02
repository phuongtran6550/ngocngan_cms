import type {
  ResourceListInput,
  ResourceListResult,
  ResourceRowModel,
  ResourceTransport,
} from "@/components/resource/contracts";
import { resourceRequest } from "@/request/resource-client";

function resourceItem<Row>(payload: unknown): Row {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (record.item) return record.item as Row;
    if (record.data) return record.data as Row;
  }
  return payload as Row;
}

export function createJsonCrudTransport<
  Row extends ResourceRowModel,
  FormModel extends object,
  Filters extends object,
>(
  endpoint: string,
  listParams: (input: ResourceListInput<Filters>) => Record<string, unknown>,
): ResourceTransport<Row, FormModel, Filters> {
  return {
    async list(input, signal): Promise<ResourceListResult<Row>> {
      const result = await resourceRequest<ResourceListResult<Row>>({
        method: "get",
        url: endpoint,
        params: listParams(input),
        signal,
      });
      return result.response;
    },
    async create(input): Promise<Row> {
      const result = await resourceRequest<unknown>({
        method: "post",
        url: endpoint,
        data: input,
      });
      return resourceItem<Row>(result.response);
    },
    async update(id, input): Promise<Row> {
      const result = await resourceRequest<unknown>({
        method: "patch",
        url: `${endpoint}/${id}`,
        data: input,
      });
      return resourceItem<Row>(result.response);
    },
    async remove(id): Promise<void> {
      await resourceRequest({ method: "delete", url: `${endpoint}/${id}` });
    },
  };
}
