import { Audio, Sequence, staticFile } from "remotion";
import { AUDIO_ENABLED, CUES } from "../lib/audio";

/** Places every SFX/music cue on its exact frame. Off until files exist. */
export const AudioTrack: React.FC = () => {
  if (!AUDIO_ENABLED) return null;
  return (
    <>
      {CUES.map((c, i) => (
        <Sequence key={i} from={c.frame}>
          <Audio src={staticFile(c.file)} volume={c.volume ?? 1} loop={c.loop} />
        </Sequence>
      ))}
    </>
  );
};
