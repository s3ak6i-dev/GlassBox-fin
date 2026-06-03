import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(null); // auto
// Motion blur is enabled per-element in components via <Freeze>/trail where needed.
