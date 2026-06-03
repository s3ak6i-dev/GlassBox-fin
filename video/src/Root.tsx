import { Composition } from "remotion";
import "./lib/fonts";
import { FPS, TOTAL_FRAMES } from "./lib/beats";
import { Main } from "./Main";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="GlassboxLaunch"
      component={Main}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    {/* Vertical cut for social — content is centered so it survives the reframe.
        Fine-tune per-scene layout later if needed. */}
    <Composition
      id="GlassboxLaunchVertical"
      component={Main}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
