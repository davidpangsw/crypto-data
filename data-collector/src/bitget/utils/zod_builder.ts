import { z, ZodObject, ZodTypeAny } from "zod";

export class ZodBuilder {
  private schema: ZodObject<any>;
  private refinements: Array<(schema: ZodTypeAny) => ZodTypeAny> = []; // Store refinements

  constructor(schema = z.object({})) {
    this.schema = schema;
  }
  private extend(obj: any) {
    this.schema = this.schema.extend(obj);
    return this;
  }
  private arg(obj: Record<string, ZodTypeAny>) {
    let arg = this.schema.shape.arg;
    if (!(arg instanceof z.ZodObject)) {
      arg = z.object({});
    }
    arg = arg.extend(obj);
    return this.extend({arg});
  }

  action(s: string) {
    return this.extend({ action: z.literal(s) });
  }
  event(s: string) {
    return this.extend({ event: z.literal(s) });
  }

  undefined(key: string) {
    this.refinements.push( (schema) => 
      schema.refine(
        (data) => !(key in data), 
        { message: `${key} must not exist`, path: [key] }
      )
    );
    return this;
  }

  instType(s: string) { return this.arg({ instType: z.literal(s) }); }
  channel(values: string[]) { return this.arg({ channel: z.enum(values as [string, ...string[]]) }); }

  build() : ZodTypeAny { 
    return this.refinements.reduce(
      (prev, item) => item(prev),
      this.schema as ZodTypeAny
    );
  }
}

export function builder(): ZodBuilder {
  return new ZodBuilder();
}