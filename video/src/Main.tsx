import { AbsoluteFill } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

import { AudioTrack } from "./components/AudioTrack";
import { Background } from "./components/Background";
import { Camera } from "./components/Camera";
import { Grain } from "./components/Grain";
import { Particles } from "./components/Particles";
import { Vignette } from "./components/Vignette";
import { CubeLayer } from "./three/CubeLayer";
import { EXPO_OUT } from "./lib/easings";
import { SCENE_DUR, TR } from "./lib/beats";
import { COLOR } from "./lib/theme";
import { SceneCursor } from "./scenes/SceneCursor";
import { SceneLogo } from "./scenes/SceneLogo";
import { ScenePayoff } from "./scenes/ScenePayoff";
import { SceneProof } from "./scenes/SceneProof";
import { SceneQuestion } from "./scenes/SceneQuestion";
import { SceneTagline } from "./scenes/SceneTagline";

const timing = linearTiming({ durationInFrames: TR, easing: EXPO_OUT });

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLOR.base }}>
    <Background glow={0.12} />
    <CubeLayer />

    <Camera>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.cursor}>
          <SceneCursor />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={timing} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.question}>
          <SceneQuestion />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={timing} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.logo}>
          <SceneLogo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={timing} presentation={slide({ direction: "from-right" })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.tagline}>
          <SceneTagline />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={timing} presentation={wipe({ direction: "from-bottom-right" })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.proof}>
          <SceneProof />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={timing} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.payoff}>
          <ScenePayoff />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </Camera>

    {/* ambient + film layers */}
    <Particles />
    <Grain />
    <Vignette />
    <AudioTrack />
  </AbsoluteFill>
);
