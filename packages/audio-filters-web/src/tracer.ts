export interface Tracer {
  trace: Trace;
}

export type Trace = (
  tag: string,
  data: string | string[] | object | undefined,
) => void;
