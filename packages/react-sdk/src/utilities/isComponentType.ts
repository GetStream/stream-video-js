import { ComponentType, isValidElement, ReactElement } from 'react';

export const isComponentType = <T extends {}>(
  elementOrComponent?: ComponentType<T> | ReactElement | null,
): elementOrComponent is ComponentType<T> => {
  return elementOrComponent === null
    ? false
    : !isValidElement(elementOrComponent);
};
