import { z, ZodObject, ZodTypeAny } from "zod";
import { InstType } from "../model/instrument";

export class ZodBuilder {
  private schema; // do not set type to avoid typescript error
  public constructor(schema = z.object({})) {
    this.schema = schema;
  }
  private arg(obj: Record<string, ZodTypeAny>) {
    let arg = this.schema.shape.arg;
    if (!(arg instanceof z.ZodObject)) {
      arg = z.object({});
    }
    arg = arg.extend(obj);
    this.schema = this.schema.extend({ arg });
    return this;
  }

  public action(s: string) {
    this.schema = this.schema.extend({ action: z.literal(s) });
    return this;
  }
  public event(s: string) {
    this.schema = this.schema.extend({ event: z.literal(s) });
    return this;
  }

  public undefined(key: string) {
    this.schema = this.schema.refine((data) => !(key in data), { message: `${key} must not exist`, path: [key] });
    return this;
  }

  public instType(s: InstType) {
    return this.arg({
      instType: z.literal(s)
    });
  }
  public channel(values: string[]) {
    return this.arg({
      channel: z.enum(values as [string, ...string[]])
    });
  }

  public build() {
    return this.schema;
  }
}

export function builder(): ZodBuilder {
  return new ZodBuilder();
}