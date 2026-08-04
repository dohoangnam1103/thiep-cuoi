"use client";

import { useLoader, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, type ReactNode } from "react";
import {
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from "three";

import {
  FOREST_PHOTOREAL_ASSETS,
  type ForestPhotorealAsset,
} from "./forest-asset-manifest";
import { getForestTextureColorSpacePolicy } from "./forest-material-policy";

export type ForestPhotorealTexturePack = {
  readonly backdrop: Texture;
  readonly coniferArm: Texture;
  readonly coniferColor: Texture;
  readonly coniferNormal: Texture;
  readonly groundArm: Texture;
  readonly groundColor: Texture;
  readonly groundNormal: Texture;
};

const PHOTOREAL_ASSET_ERROR_MARKER = "forest-photoreal-asset-load";

const COLOR_ASSET_IDS = new Set([
  "backdrop",
  "coniferColor",
  "groundColor",
  "wildlife",
]);
const TILED_ASSET_IDS = new Set(["groundArm", "groundColor", "groundNormal"]);

/**
 * Horizontal tiling applied at load time so consumers never have to mutate a
 * shared texture during render. The backdrop panorama wraps three times around
 * the sky cylinder.
 */
const HORIZONTAL_REPEAT_BY_ASSET_ID: Readonly<Record<string, number>> = {
  backdrop: 3,
};

function assetsForGroup(group: ForestPhotorealAsset["group"]) {
  return FOREST_PHOTOREAL_ASSETS.filter((asset) => asset.group === group);
}

const ENTRY_ASSETS = assetsForGroup("entry");
const ENTRY_ASSET_PATHS = ENTRY_ASSETS.map(({ src }) => src);
const WILDLIFE_ASSET = FOREST_PHOTOREAL_ASSETS.find(
  ({ group }) => group === "wildlife",
);

class ForestPhotorealAssetError extends Error {
  constructor(url: string, error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    super(`[${PHOTOREAL_ASSET_ERROR_MARKER}] ${url}: ${detail}`);
    this.name = "ForestPhotorealAssetError";
  }
}

class ForestPhotorealTextureLoader extends TextureLoader {
  override load(
    url: string,
    onLoad?: (texture: Texture<HTMLImageElement>) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): Texture<HTMLImageElement> {
    const asset = FOREST_PHOTOREAL_ASSETS.find((entry) => entry.src === url);

    return super.load(url, (texture) => {
      const kind = asset && COLOR_ASSET_IDS.has(asset.id) ? "color" : "normal";
      texture.colorSpace = getForestTextureColorSpacePolicy(kind) === "srgb"
        ? SRGBColorSpace
        : NoColorSpace;

      if (asset && TILED_ASSET_IDS.has(asset.id)) {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
      }

      const horizontalRepeat = asset
        ? HORIZONTAL_REPEAT_BY_ASSET_ID[asset.id]
        : undefined;
      if (horizontalRepeat !== undefined) {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(horizontalRepeat, 1);
      }

      texture.anisotropy = 4;
      onLoad?.(texture);
    }, onProgress, (error) => {
      onError?.(new ForestPhotorealAssetError(url, error));
    });
  }
}

export function isForestPhotorealAssetError(error: unknown): boolean {
  return error instanceof ForestPhotorealAssetError
    || (error instanceof Error
      && error.message.includes(`[${PHOTOREAL_ASSET_ERROR_MARKER}]`));
}

type PhotorealAssetBoundaryProps = {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
};

type PhotorealAssetBoundaryState = {
  readonly assetFailed: boolean;
  readonly errorToPropagate: unknown;
  readonly shouldPropagate: boolean;
};

export class ForestPhotorealAssetBoundary extends Component<
  PhotorealAssetBoundaryProps,
  PhotorealAssetBoundaryState
> {
  state: PhotorealAssetBoundaryState = {
    assetFailed: false,
    errorToPropagate: null,
    shouldPropagate: false,
  };

  static getDerivedStateFromError(
    error: unknown,
  ): PhotorealAssetBoundaryState {
    if (isForestPhotorealAssetError(error)) {
      return {
        assetFailed: true,
        errorToPropagate: null,
        shouldPropagate: false,
      };
    }

    return {
      assetFailed: false,
      errorToPropagate: error,
      shouldPropagate: true,
    };
  }

  render() {
    if (this.state.shouldPropagate) {
      throw this.state.errorToPropagate;
    }

    return this.state.assetFailed ? this.props.fallback : this.props.children;
  }
}

export function useForestPhotorealTextures(): ForestPhotorealTexturePack {
  const textures = useLoader(
    ForestPhotorealTextureLoader,
    ENTRY_ASSET_PATHS,
  ) as Texture[];
  const renderer = useThree(({ gl }) => gl);

  useEffect(() => {
    textures.forEach((texture) => renderer.initTexture(texture));
  }, [renderer, textures]);

  return useMemo(() => {
    const byId = new Map(
      ENTRY_ASSETS.map((asset, index) => [asset.id, textures[index]!]),
    );

    const require = (id: string) => {
      const texture = byId.get(id);
      if (!texture) {
        throw new Error(`Forest photoreal texture "${id}" is unavailable`);
      }
      return texture;
    };

    return {
      backdrop: require("backdrop"),
      coniferArm: require("coniferArm"),
      coniferColor: require("coniferColor"),
      coniferNormal: require("coniferNormal"),
      groundArm: require("groundArm"),
      groundColor: require("groundColor"),
      groundNormal: require("groundNormal"),
    };
  }, [textures]);
}

export function useForestWildlifeTexture(): Texture {
  if (!WILDLIFE_ASSET) {
    throw new Error("Forest wildlife atlas is missing from the manifest");
  }

  const texture = useLoader(
    ForestPhotorealTextureLoader,
    WILDLIFE_ASSET.src,
  ) as Texture;
  const renderer = useThree(({ gl }) => gl);

  useEffect(() => {
    renderer.initTexture(texture);
  }, [renderer, texture]);

  return texture;
}
