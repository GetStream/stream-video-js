export type Filter<T> =
  | { $and: Array<Filter<T>> }
  | { $or: Array<Filter<T>> }
  | { $not: Filter<T> }
  | Conditions<T>;

type Conditions<T> = {
  [K in keyof T]?: T[K] extends Array<infer E>
    ? ArrayOperator<E>
    : ScalarOperator<T[K]>;
};

export type ScalarOperator<T> =
  | EqOperator<T>
  | NeqOperator<T>
  | InOperator<T>
  | GtOperator<T>
  | GteOperator<T>
  | LtOperator<T>
  | LteOperator<T>
  | T;

export type ArrayOperator<T> = ContainsOperator<T>;

export type AutocompleteOperator<T> = { $autocomplete: T };
export type EqOperator<T> = { $eq: T };
export type GtOperator<T> = { $gt: T };
export type GteOperator<T> = { $gte: T };
export type LtOperator<T> = { $lt: T };
export type LteOperator<T> = { $lte: T };
export type NeqOperator<T> = { $neq: T };
export type InOperator<T> = { $in: Array<T> };
export type ContainsOperator<T> = { $contains: T };

export function applyFilter<T>(obj: T, filter: Filter<T>): boolean {
  if ('$and' in filter) {
    return filter.$and.every((f) => applyFilter(obj, f));
  }

  if ('$or' in filter) {
    return filter.$or.some((f) => applyFilter(obj, f));
  }

  if ('$not' in filter) {
    return !applyFilter(obj, filter.$not);
  }

  return checkConditions(obj, filter);
}

type DateString = string;
const isDateString = (value: unknown): value is DateString =>
  typeof value === 'string' &&
  /^((?:(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}(?:\.\d+)?))(Z|[+-]\d{2}:\d{2})?)$/.test(
    value,
  );

function checkConditions<T>(obj: T, conditions: Conditions<T>): boolean {
  let match = true;

  for (const key of Object.keys(conditions) as Array<keyof T>) {
    const operator = conditions[key];
    const maybeOperator = operator && typeof operator === 'object';
    let value: T[keyof T] | number = obj[key];

    if (value instanceof Date) {
      value = value.getTime();
    } else if (isDateString(value)) {
      value = new Date(value).getTime();
    }

    if (maybeOperator && '$eq' in operator) {
      const eqOperator = operator as EqOperator<typeof value>;
      const eqOperatorValue = isDateString(eqOperator.$eq)
        ? new Date(eqOperator.$eq).getTime()
        : eqOperator.$eq;
      match &&= eqOperatorValue === value;
    } else if (maybeOperator && '$neq' in operator) {
      const neqOperator = operator as NeqOperator<typeof value>;
      match &&= neqOperator.$neq !== value;
    } else if (maybeOperator && '$in' in operator) {
      const inOperator = operator as InOperator<typeof value>;
      match &&= inOperator.$in.includes(value);
    } else if (maybeOperator && '$contains' in operator) {
      if (Array.isArray(value)) {
        const containsOperator = operator as ContainsOperator<
          (typeof value)[number]
        >;
        match &&= value.includes(containsOperator.$contains);
      } else {
        match = false;
      }
    } else if (maybeOperator && '$gt' in operator) {
      const gtOperator = operator as GtOperator<typeof value>;
      const gtOperatorValue = isDateString(gtOperator.$gt)
        ? new Date(gtOperator.$gt).getTime()
        : gtOperator.$gt;
      match &&= value > gtOperatorValue;
    } else if (maybeOperator && '$gte' in operator) {
      const gteOperator = operator as GteOperator<typeof value>;
      const gteOperatorValue = isDateString(gteOperator.$gte)
        ? new Date(gteOperator.$gte).getTime()
        : gteOperator.$gte;
      match &&= value >= gteOperatorValue;
    } else if (maybeOperator && '$lt' in operator) {
      const ltOperator = operator as LtOperator<typeof value>;
      const ltOperatorValue = isDateString(ltOperator.$lt)
        ? new Date(ltOperator.$lt).getTime()
        : ltOperator.$lt;
      match &&= value < ltOperatorValue;
    } else if (maybeOperator && '$lte' in operator) {
      const lteOperator = operator as LteOperator<typeof value>;
      const lteOperatorValue = isDateString(lteOperator.$lte)
        ? new Date(lteOperator.$lte).getTime()
        : lteOperator.$lte;
      match &&= value <= lteOperatorValue;
      // } else if (maybeOperator && '$autocomplete' in operator) {
      // TODO: regexp solution maybe?
      // match &&= false;
    } else {
      const eqValue = operator as typeof value;
      match &&= eqValue === value;
    }

    if (!match) {
      return false;
    }
  }

  return true;
}
