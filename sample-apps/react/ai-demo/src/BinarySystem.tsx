import {
  CSSProperties,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useState,
} from "react";

export type BinarySystemProps = {
  /* rotation: number -> defaultRotation?: number */
  [K in keyof BinarySystemTransitionableProps as `default${Capitalize<K>}`]?: BinarySystemTransitionableProps[K];
} & {
  alpha: ReactNode;
  beta: ReactNode;
};

export interface BinarySystemHandle {
  transition: (
    update:
      | Partial<BinarySystemTransitionableProps>
      | ((
          state: BinarySystemState
        ) => Partial<BinarySystemTransitionableProps>),
    durationMs: number
  ) => void;
}

export interface BinarySystemTransitionableProps {
  attack: number;
  offset: number;
  rotation: number;
}

interface BinarySystemState extends BinarySystemTransitionableProps {
  transitionDurationMs: number;
}

export const BinarySystem = forwardRef<BinarySystemHandle, BinarySystemProps>(
  function BinarySystem(props, ref) {
    const [state, setState] = useState<BinarySystemState>(() => ({
      attack: props.defaultAttack ?? 0,
      offset: props.defaultOffset ?? 0,
      rotation: props.defaultRotation ?? 0,
      transitionDurationMs: 0,
    }));

    useImperativeHandle(
      ref,
      () => ({
        transition: (update, durationMs) => {
          setState((state) => ({
            ...state,
            ...(typeof update === "function" ? update(state) : update),
            transitionDurationMs: durationMs,
          }));
        },
      }),
      []
    );

    return (
      <div
        className="binary-system"
        style={
          {
            "--binary-system-attack": `${state.attack}deg`,
            "--binary-system-offset": `${state.offset}px`,
            "--binary-system-rotation": `${state.rotation}deg`,
            "--binary-system-transition-duration": `${
              state.transitionDurationMs / 1000
            }s`,
          } as CSSProperties
        }
      >
        <div className="binary-system__alpha">{props.alpha}</div>
        <div className="binary-system__beta">{props.beta}</div>
      </div>
    );
  }
);
