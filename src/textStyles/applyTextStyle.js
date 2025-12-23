// src/textStyles/applyTextStyle.js
// ПОЛНАЯ ЗАМЕНА (2-слойный рендер: stroke + fill)
// Гарантированно: stroke НЕ ломает gradient/background-clip

import { TEXT_STYLE_PRESETS, DEFAULT_TEXT_STYLE_ID } from "./textStylePresets";

function getPresetById(id) {
  if (id === 'no_style') {
    return {
      id: 'no_style',
      name: '',
      isPremium: false,
      sampleText: 'ТЕКСТ',
      config: {
        fontFamily: 'system-ui',
        fontSize: 64,
        fontWeight: 700,
        letterSpacing: 0,
        textTransform: 'none',
        baseColor: '#ffffff',
        stroke: { enabled: false },
        glow: { enabled: false },
        depth: { enabled: false },
        textShadow: 'none',
      },
    };
  }
  return TEXT_STYLE_PRESETS.find((p) => p.id === id) || TEXT_STYLE_PRESETS[0];
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function hexToRgba(hex, alpha = 1) {
  if (typeof hex !== "string") return null;
  const h = hex.trim();
  if (!h.startsWith("#")) return null;

  let r, g, b;

  if (h.length === 4) {
    r = parseInt(h[1] + h[1], 16);
    g = parseInt(h[2] + h[2], 16);
    b = parseInt(h[3] + h[3], 16);
  } else if (h.length === 7) {
    r = parseInt(h.slice(1, 3), 16);
    g = parseInt(h.slice(3, 5), 16);
    b = parseInt(h.slice(5, 7), 16);
  } else {
    return null;
  }

  const a = clamp(alpha, 0, 1);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function colorWithOpacity(color, opacity = 1) {
  if (!color) return `rgba(255,255,255,${clamp(opacity, 0, 1)})`;

  const c = String(color).trim();

  if (c.startsWith("rgba(")) return c;

  if (c.startsWith("rgb(")) {
    const inside = c.slice(4, -1).trim();
    return `rgba(${inside}, ${clamp(opacity, 0, 1)})`;
  }

  const hex = hexToRgba(c, opacity);
  if (hex) return hex;

  return c;
}

function buildGradientCSS(gradient) {
  if (!gradient || !gradient.enabled || !gradient.stops?.length) return null;

  const stops = gradient.stops
    .map((stop) => `${stop.color} ${stop.position * 100}%`)
    .join(", ");

  return `linear-gradient(${gradient.angle}deg, ${stops})`;
}

function buildOverlayCSS(overlays) {
  if (!overlays || overlays.length === 0) return null;

  const overlayUrls = overlays
    .filter((o) => o.enabled && o.url)
    .map((o) => `url(${o.url}) repeat`)
    .join(", ");

  return overlayUrls.length > 0 ? overlayUrls : null;
}

function buildTextShadow(cfg) {
  const parts = [];

  if (cfg.textShadow) {
    parts.push(cfg.textShadow);
  }

  // Depth
  if (cfg.depth?.enabled) {
    const { layers, xOffset, yOffset, color } = cfg.depth;
    const safeLayers = clamp(layers || 0, 1, 24);

    for (let i = 1; i <= safeLayers; i += 1) {
      parts.push(
        `${(xOffset || 0) * i}px ${(yOffset || 0) * i}px 0px ${
          color || "rgba(0,0,0,0.7)"
        }`
      );
    }
  }

  // Glow / particles
  if (cfg.glow?.enabled) {
    const { color, blur, opacity } = cfg.glow;
    const safeBlur = Math.max(0, blur ?? 10);
    const glowOpacity = opacity != null ? opacity : 1;

    if (safeBlur === 0) {
      parts.push(`0 0 0px ${colorWithOpacity(color || "#ffffff", glowOpacity)}`);
    } else if (safeBlur >= 5) {
      parts.push(`0 0 ${safeBlur * 1.5}px rgba(255, 255, 255, 0.2)`);
      parts.push(`0 0 ${safeBlur}px ${color || "#ffffff"}`);
      parts.push(`0 0 ${safeBlur / 3}px ${color || "#ffffff"}`);
    } else {
      parts.push(`0 0 ${safeBlur}px ${color || "#ffffff"}`);
    }
  }

  return parts.length > 0 ? parts.join(", ") : null;
}

// ==========================================================
// 2-слойный стиль: style (fill) + strokeStyle (обводка отдельно)
// ==========================================================
export function getTextStyleForRender(layerOrStyleId, options = {}) {
  const isId = typeof layerOrStyleId === "string";
  const layer = !isId && layerOrStyleId ? layerOrStyleId : null;

  // presetId
  const presetId = isId
    ? layerOrStyleId
    : layer?.textStyleEnabled
    ? layer?.textStyleId || DEFAULT_TEXT_STYLE_ID
    : DEFAULT_TEXT_STYLE_ID;

  const preset = getPresetById(presetId);

  // ВАЖНО: cfg — это пресет. Слой не должен перетирать эффектные поля.
  // Разрешаем только безопасные overrides (например fontSize).
  const cfg = {
    ...preset.config,
    ...(layer?.fontSize != null ? { fontSize: layer.fontSize } : null),
  };

  if (!cfg) return { style: {}, strokeStyle: null, textStyle: null, renderedText: "" };

  const renderedText = layer?.text || cfg.sampleText || "ТЕКСТ";
  const usePresetColor = layer?.overrideColor !== true;

  const gradientCss = buildGradientCSS(cfg.gradient);
  const overlayCss = buildOverlayCSS(cfg.overlays);
  const textShadow = buildTextShadow(cfg);

  // -------------------------
  // FILL LAYER (градиент/заливка)
  // -------------------------
  const style = {
    fontFamily: cfg.fontFamily,
    fontSize: `${cfg.fontSize || 48}px`,
    fontWeight: cfg.fontWeight || 400,
    letterSpacing: cfg.letterSpacing != null ? `${cfg.letterSpacing}em` : undefined,
    textTransform: cfg.textTransform || "none",
    position: "relative",
    display: "inline-block",
    whiteSpace: "nowrap",
    textShadow: textShadow || undefined,
    filter: "none",
  };

  // комбинируем overlays + gradient
  const combined = [];
  if (overlayCss) combined.push(overlayCss);
  if (gradientCss) combined.push(gradientCss);
  const finalBackground = combined.length > 0 ? combined.join(", ") : null;

  if (finalBackground && usePresetColor) {
    style.backgroundImage = finalBackground;
    style.backgroundRepeat = overlayCss ? "repeat" : "no-repeat";
    style.color = "transparent";
    style.WebkitBackgroundClip = "text";
    style.backgroundClip = "text";
    style.WebkitTextFillColor = "transparent";
  } else {
    if (usePresetColor) {
      if (cfg.baseColor) style.color = cfg.baseColor;
    } else {
      const userColor = layer?.userColor || layer?.baseColor || layer?.color || "#ffffff";
      style.color = userColor;
      // если был clip — выключаем на fill-слое при overrideColor
      style.backgroundImage = undefined;
      style.WebkitBackgroundClip = undefined;
      style.backgroundClip = undefined;
      style.WebkitTextFillColor = undefined;
    }
  }

  // preview size
  if (options.forPreview) {
    style.fontSize = `${cfg.baseFontSize ? cfg.baseFontSize * 0.5 : 30}px`;
  }

  // -------------------------
  // STROKE LAYER (обводка отдельным span)
  // НЕ используем background-clip тут вообще.
  // -------------------------
  let strokeStyle = null;

  if (cfg.stroke?.enabled) {
    strokeStyle = {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      letterSpacing: style.letterSpacing,
      textTransform: style.textTransform,
      whiteSpace: style.whiteSpace,

      position: "absolute",
      inset: 0,
      display: "inline-block",

      // запрещаем любые background-clip/gradient на stroke слое
      backgroundImage: "none",
      WebkitBackgroundClip: "initial",
      backgroundClip: "initial",

      // делаем заливку прозрачной, остаётся только stroke
      color: "transparent",
      WebkitTextFillColor: "transparent",

      WebkitTextStrokeWidth: `${cfg.stroke.width || 1}px`,
      WebkitTextStrokeColor: cfg.stroke.color || "rgba(0,0,0,0.8)",

      // stroke слой без теней, чтобы не удваивать depth
      textShadow: "none",
      pointerEvents: "none",
    };
  }

  return {
    style, // fill layer
    strokeStyle, // stroke layer
    textStyle: cfg,
    layerTextStyleId: preset?.id,
    renderedText,
    fill: cfg.baseColor,
    stroke: cfg.stroke,
    isGradient: cfg.gradient?.enabled,
    rotation: layer?.rotation,
    scaleX: layer?.scaleX,
    scaleY: layer?.scaleY,
  };
}
