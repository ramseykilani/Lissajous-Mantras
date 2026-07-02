declare module "gifenc" {
  export type GifPalette = number[][];

  export interface GifEncoder {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: { palette?: GifPalette; delay?: number; repeat?: number },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  /** Factory; also works with `new`. */
  export const GIFEncoder: {
    (): GifEncoder;
    new (): GifEncoder;
  };

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: { format?: "rgb565" | "rgb444" | "rgba4444" },
  ): GifPalette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: "rgb565" | "rgb444" | "rgba4444",
  ): Uint8Array;
}
