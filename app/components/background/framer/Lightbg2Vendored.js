/**
 * Vendored from:
 * https://framerusercontent.com/modules/IcDD4nCnCPIBJHcS8cHx/F0ohASRCC9KSNnI5PTy7/ulf1rzLsH.js
 *
 * The upstream Framer module is a grain/noise component with multiple tiled variants.
 * We map its published texture URLs locally so the top layer can use the exact source assets.
 */
export const FRAMER_LIGHTBG2_SOURCE =
  "https://framerusercontent.com/modules/IcDD4nCnCPIBJHcS8cHx/F0ohASRCC9KSNnI5PTy7/ulf1rzLsH.js";

export const FRAMER_GRAIN_VARIANTS = {
  tactileNoiseDark:
    "https://framerusercontent.com/images/WtFD8ctIkVAEXFWcYLyiZuh1x6U.png?width=48&height=48",
  tactileNoiseLight:
    "https://framerusercontent.com/images/ZiGS8PQ5XRd2xr4zouP8iwQE21c.png?width=48&height=48",
  asfaltDark:
    "https://framerusercontent.com/images/Oy35s3U9eiFTYtEvnlh6UunIino.png?width=466&height=349",
  asfaltLight:
    "https://framerusercontent.com/images/DmB8dGswsnyrfJkAiT8NkPkjL0.png?width=466&height=349",
  diagonalNoise:
    "https://framerusercontent.com/images/ns71dIfyv9yhFPnv0Wol3PbLnm0.png?width=100&height=100",
  grilledNoise:
    "https://framerusercontent.com/images/ZsEokCVo7wQ0GfgF3kaDdT2GOY.png?width=170&height=180",
  dotNoiseLight:
    "https://framerusercontent.com/images/y83TIuhRJpWLR70p3Nn8v3VD9M.png?width=100&height=100",
};

/**
 * Selected top layer texture ("Lightbg 2" target) from the Framer source module.
 * You can switch to another `FRAMER_GRAIN_VARIANTS` entry if design direction changes.
 */
export const LIGHTBG2_TEXTURE = FRAMER_GRAIN_VARIANTS.tactileNoiseLight;
