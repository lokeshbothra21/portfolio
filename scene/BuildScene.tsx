"use client";

import { useMemo } from "react";
import { Baseplate, Brick } from "./bricks";
import type { Build } from "./builds";

/** Renders `build` as it looks after `step`, animating whatever changed. */
export function BuildScene({ build, step, instant }: { build: Build; step: number; instant: boolean }) {
  const bricks = useMemo(() => {
    const rejectedAt = new Map<string, number>();
    build.steps.forEach((s, i) => s.reject?.forEach((id) => rejectedAt.set(id, i)));
    return build.steps.flatMap((s, i) =>
      s.add.map((spec, order) => ({ spec, from: i, until: spec.id ? rejectedAt.get(spec.id) : undefined, order, key: `${i}-${order}` })),
    );
  }, [build]);

  return (
    <group position={[-build.base.w / 2, 0, -build.base.d / 2]}>
      <Baseplate w={build.base.w} d={build.base.d} c={build.base.c} />
      {bricks.map(({ spec, from, until, order, key }) => {
        const shown = step >= from && (until === undefined || step < until);
        return (
          <Brick
            key={key}
            spec={spec}
            shown={shown}
            instant={instant}
            delay={Math.min(order * 0.06, 1.2)}
            exit={until !== undefined && step >= until ? "fly" : "lift"}
          />
        );
      })}
    </group>
  );
}
