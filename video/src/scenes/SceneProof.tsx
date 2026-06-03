import { AbsoluteFill, Sequence } from "remotion";
import { PROOF } from "../lib/beats";
import { ProofFleet } from "./proof/ProofFleet";
import { ProofHash } from "./proof/ProofHash";
import { ProofHold } from "./proof/ProofHold";
import { ProofReport } from "./proof/ProofReport";
import { ProofTraces } from "./proof/ProofTraces";

// S5 · Proof montage — clean cuts on the downbeat (see STORYBOARD beat map).
// Whoosh-wipe transitions are a later polish; cutting on-beat reads premium.
export const SceneProof: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={PROOF.traces.from} durationInFrames={PROOF.traces.duration}>
      <ProofTraces />
    </Sequence>
    <Sequence from={PROOF.hold.from} durationInFrames={PROOF.hold.duration}>
      <ProofHold />
    </Sequence>
    <Sequence from={PROOF.hash.from} durationInFrames={PROOF.hash.duration}>
      <ProofHash />
    </Sequence>
    <Sequence from={PROOF.fleet.from} durationInFrames={PROOF.fleet.duration}>
      <ProofFleet />
    </Sequence>
    <Sequence from={PROOF.report.from} durationInFrames={PROOF.report.duration}>
      <ProofReport />
    </Sequence>
  </AbsoluteFill>
);
