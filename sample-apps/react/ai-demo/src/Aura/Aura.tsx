import { CSSProperties, RefObject, useEffect, useMemo, useRef } from "react";
import {
  BinarySystem,
  BinarySystemHandle,
  BinarySystemTransitionableProps,
} from "../BinarySystem";
import { AuraVolumeter } from "./AuraVolumeter";

export function Aura(props: {
  height: number;
  persona: "ai" | "user";
  mediaStream: MediaStream;
}) {
  return (
    <div
      style={
        {
          height: `${props.height}px`,
          "--aura-container-factor": props.height / 100,
        } as CSSProperties
      }
      className="aura-container"
    >
      <AuraVolumeter mediaStream={props.mediaStream}>
        <div className="aura-container__scaler">
          <AuraOctoSystem persona={props.persona} />
        </div>
      </AuraVolumeter>
    </div>
  );
}

const AuraBinarySystem = function AuraBinarySystem(props: {
  persona: "ai" | "user";
}) {
  const ref = useRef<BinarySystemHandle | null>(null);
  const binarySystemProps = useBinarySystemAnimation(
    {
      offset: -8,
      attack: -12,
      rotation: -20,
    },
    ref
  );

  return (
    <BinarySystem
      ref={ref}
      alpha={<i className={`aura aura_${props.persona} aura_alpha`} />}
      beta={<i className={`aura aura_${props.persona} aura_beta`} />}
      {...binarySystemProps}
    />
  );
};

function AuraQuadSystem(props: { persona: "ai" | "user" }) {
  const ref = useRef<BinarySystemHandle | null>(null);
  const binarySystemProps = useBinarySystemAnimation(
    {
      offset: 8,
      attack: 0,
      rotation: 0,
    },
    ref
  );

  return (
    <BinarySystem
      ref={ref}
      alpha={<AuraBinarySystem {...props} />}
      beta={<AuraBinarySystem {...props} />}
      {...binarySystemProps}
    />
  );
}

function AuraOctoSystem(props: { persona: "ai" | "user" }) {
  const ref = useRef<BinarySystemHandle | null>(null);
  const binarySystemProps = useBinarySystemAnimation(
    {
      offset: 16,
      attack: -30,
      rotation: 0,
    },
    ref
  );

  return (
    <BinarySystem
      ref={ref}
      alpha={<AuraQuadSystem {...props} />}
      beta={<AuraQuadSystem {...props} />}
      {...binarySystemProps}
    />
  );
}

function useBinarySystemAnimation(
  defaultProps: BinarySystemTransitionableProps,
  ...refs: RefObject<BinarySystemHandle>[]
) {
  const attackSpeed = useMemo(() => 20 + Math.random() * 50, []);
  const rotationSpeed = useMemo(() => 5 + Math.random() * 5, []);
  const durationMs = 250;

  const tickCallback = useRef<() => void>();
  tickCallback.current = () =>
    refs.forEach((ref) =>
      ref.current?.transition(
        (state) => ({
          attack: state.attack + attackSpeed * (durationMs / 1000),
          rotation: state.rotation + rotationSpeed * (durationMs / 1000),
        }),
        durationMs
      )
    );

  useEffect(() => {
    const interval = setInterval(() => tickCallback.current?.(), durationMs);
    return () => clearInterval(interval);
  }, []);

  return {
    defaultOffset: defaultProps.offset,
    defaultAttack: defaultProps.attack,
    defaultRotation: defaultProps.rotation,
  };
}
