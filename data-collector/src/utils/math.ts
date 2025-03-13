import Decimal from "decimal.js";

export function decimal(x: string) {
  return new Decimal(x);
}