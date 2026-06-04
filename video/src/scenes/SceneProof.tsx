import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { EXPO_OUT } from "../lib/easings";
import { PROOF_DUR, TR } from "../lib/beats";
import { ProofFleet } from "./proof/ProofFleet";
import { ProofHash } from "./proof/ProofHash";
import { ProofHold } from "./proof/ProofHold";
import { ProofReport } from "./proof/ProofReport";
import { ProofTraces } from "./proof/ProofTraces";

const timing = linearTiming({ durationInFrames: TR, easing: EXPO_OUT });

// S5 · Proof montage — fluid whoosh transitions, each cut on the beat.
export const SceneProof: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={PROOF_DUR.traces}>
      <ProofTraces />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition timing={timing} presentation={slide({ direction: "from-right" })} />

    <TransitionSeries.Sequence durationInFrames={PROOF_DUR.hold}>
      <ProofHold />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition timing={timing} presentation={slide({ direction: "from-right" })} />

    <TransitionSeries.Sequence durationInFrames={PROOF_DUR.hash}>
      <ProofHash />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition timing={timing} presentation={wipe({ direction: "from-left" })} />

    <TransitionSeries.Sequence durationInFrames={PROOF_DUR.fleet}>
      <ProofFleet />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition timing={timing} presentation={slide({ direction: "from-bottom" })} />

    <TransitionSeries.Sequence durationInFrames={PROOF_DUR.report}>
      <ProofReport />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
