import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Float } from "../../components/Float";
import { GlassPanel } from "../../components/GlassPanel";
import { PushIn } from "../../components/PushIn";
import { EXPO_OUT } from "../../lib/easings";
import { COLOR, FONT } from "../../lib/theme";

// S5b · Hold + Approve — the human-in-the-loop hook.
export const ProofHold: React.FC = () => {
  const frame = useCurrentFrame();

  // amber pulse border
  const pulse = 0.5 + 0.5 * Math.sin(frame / 7);
  // approve click ~ frame 200 (local); card slides out after
  const approve = interpolate(frame, [205, 235], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EXPO_OUT });
  const slide = approve * -700;
  const check = interpolate(frame, [200, 214], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = interpolate(frame, [196, 200, 206], [1, 0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <PushIn>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Float amount={0.6}>
        <GlassPanel
          style={{
            width: 760,
            padding: 40,
            transform: `translateX(${slide}px)`,
            opacity: 1 - approve,
            border: `1px solid rgba(240,180,41,${0.3 + 0.5 * pulse})`,
            boxShadow: `0 0 ${30 + pulse * 50}px rgba(240,180,41,${0.15 + pulse * 0.2})`,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
            <span style={{ color: COLOR.amber, fontSize: 22, fontFamily: FONT.mono }}>⚠ HOLD</span>
            <span style={{ color: COLOR.inkDim, fontSize: 18, fontFamily: FONT.mono }}>agent paused mid-decision</span>
          </div>
          <div style={{ color: COLOR.ink, fontSize: 30, fontWeight: 600, fontFamily: FONT.display, marginBottom: 8 }}>
            LARGE_TRANSFER · $1,000,000
          </div>
          <div style={{ color: COLOR.inkDim, fontSize: 20, fontFamily: FONT.display, marginBottom: 28 }}>
            Transfer above approval threshold · MiFID II
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <div
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                background: COLOR.cyan,
                color: "#04121a",
                fontWeight: 700,
                fontFamily: FONT.display,
                fontSize: 20,
                transform: `scale(${press})`,
              }}
            >
              Approve
            </div>
            <div style={{ padding: "14px 28px", borderRadius: 12, border: `1px solid ${COLOR.line}`, color: COLOR.inkDim, fontFamily: FONT.display, fontSize: 20 }}>
              Deny
            </div>
          </div>
        </GlassPanel>
        </Float>

        {/* cyan confirmation check */}
        <div
          style={{
            position: "absolute",
            opacity: check * (frame > 230 ? interpolate(frame, [230, 250], [1, 0]) : 1),
            transform: `scale(${0.6 + check * 0.6})`,
            color: COLOR.cyan,
            fontSize: 160,
            filter: `drop-shadow(0 0 30px ${COLOR.cyan})`,
          }}
        >
          ✓
        </div>
      </AbsoluteFill>
    </PushIn>
  );
};
