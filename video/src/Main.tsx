import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrack } from "./components/AudioTrack";
import { Background } from "./components/Background";
import { Grain } from "./components/Grain";
import { Vignette } from "./components/Vignette";
import { SCENES } from "./lib/beats";
import { COLOR } from "./lib/theme";
import { SceneCursor } from "./scenes/SceneCursor";
import { SceneLogo } from "./scenes/SceneLogo";
import { SceneProof } from "./scenes/SceneProof";
import { SceneQuestion } from "./scenes/SceneQuestion";
import { SceneTagline } from "./scenes/SceneTagline";
import { ScenePayoff } from "./scenes/ScenePayoff";

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLOR.base }}>
    <Background />

    <Sequence from={SCENES.cursor.from} durationInFrames={SCENES.cursor.duration}>
      <SceneCursor />
    </Sequence>
    <Sequence from={SCENES.question.from} durationInFrames={SCENES.question.duration}>
      <SceneQuestion />
    </Sequence>
    <Sequence from={SCENES.logo.from} durationInFrames={SCENES.logo.duration}>
      <SceneLogo />
    </Sequence>
    <Sequence from={SCENES.tagline.from} durationInFrames={SCENES.tagline.duration}>
      <SceneTagline />
    </Sequence>
    <Sequence from={SCENES.proof.from} durationInFrames={SCENES.proof.duration}>
      <SceneProof />
    </Sequence>
    <Sequence from={SCENES.payoff.from} durationInFrames={SCENES.payoff.duration}>
      <ScenePayoff />
    </Sequence>

    {/* global film layers */}
    <Grain />
    <Vignette />
    <AudioTrack />
  </AbsoluteFill>
);
