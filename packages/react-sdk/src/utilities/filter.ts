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
  | T;

export type ArrayOperator<T> = ContainsOperator<T>;

export type EqOperator<T> = { $eq: T };
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

function checkConditions<T>(obj: T, conditions: Conditions<T>): boolean {
  let match = true;

  for (const key of Object.keys(conditions) as Array<keyof T>) {
    const operator = conditions[key];
    const maybeOperator = operator && typeof operator === 'object';
    const value = obj[key];

    if (maybeOperator && '$eq' in operator) {
      const eqOperator = operator as EqOperator<typeof value>;
      match &&= eqOperator.$eq === value;
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
