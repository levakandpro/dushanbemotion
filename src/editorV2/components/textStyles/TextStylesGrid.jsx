import React, { useMemo, useRef } from "react";
import { useNavigate } from 'react-router-dom'
import { useTextStyleStore } from "../../store/useTextStyleStore";
import { useAuth } from "../../../lib/useAuth";
import { useIsMobile } from "../../../hooks/useMobileGestures";
import TextStylePreview from "./TextStylePreview";

import crownIcon from '../bazar/assets/prof/crown.png'

export default function TextStylesGrid({ currentLayer, onChangeLayer }) {
  const presets = useTextStyleStore((s) => s.presets);
  const activeTextStyleId = useTextStyleStore((s) => s.activeTextStyleId);
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const gridRef1 = useRef(null);
  const gridRef2 = useRef(null);

  const navigate = useNavigate()
  
  // Проверяем есть ли у пользователя активный PREMIUM
  const userHasPremium = useMemo(() => {
    if (!profile) return false;
    if (profile.is_lifetime) return true;
    if (!profile.current_plan || profile.current_plan === 'free') return false;
    if (!profile.plan_expires_at) return false;
    return new Date(profile.plan_expires_at) > new Date();
  }, [profile]);

  // универсальный setter (под разные названия в store)
  const setActiveTextStyle =
    useTextStyleStore((s) => s.setActiveTextStyleId || s.setActiveTextStyle);

  const layerTextStyleId = currentLayer?.textStyleEnabled
    ? currentLayer?.textStyleId || activeTextStyleId
    : null;

  const isLayerStyleEnabled = currentLayer?.textStyleEnabled === true;

  const handleSelectNone = () => {
    if (onChangeLayer && currentLayer) {
      onChangeLayer({
        ...currentLayer,
        textStyleEnabled: false,
        textStyleId: null,
      });
    }
    if (typeof setActiveTextStyle === "function") setActiveTextStyle(null);
  };

  const handleSelectPreset = (presetId) => {
    if (onChangeLayer && currentLayer) {
      onChangeLayer({
        ...currentLayer,
        textStyleEnabled: true,
        textStyleId: presetId,
        // overrideColor не трогаем
      });
    }
    if (typeof setActiveTextStyle === "function") setActiveTextStyle(presetId);
  };

  if (!presets?.length) {
    return (
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", padding: "6px 4px" }}>
        Нет доступных стилей.
      </div>
    );
  }

  const regularPresets = presets.filter((p) => !p.isPremium);
  const premiumPresets = presets.filter((p) => p.isPremium);

  // Стили для сетки: на мобильных - 2 колонки, на веб - auto-fill
  const gridStyle = isMobile 
    ? { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }
    : { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 8 };

  const renderPreset = (preset) => {
    const isNoStyle = preset.id === "no_style";
    const isActive = isNoStyle
      ? !isLayerStyleEnabled
      : isLayerStyleEnabled && preset.id === layerTextStyleId;

    const handleSelect = () => {
      if (preset.isPremium && !userHasPremium) {
        navigate('/pricing')
        return
      }
      return isNoStyle ? handleSelectNone() : handleSelectPreset(preset.id)
    }

    return (
      <TextStylePreview
        key={preset.id}
        preset={preset}
        isActive={isActive}
        onSelect={handleSelect}
      />
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div 
        ref={gridRef1}
        style={gridStyle} 
        className="dm-text-styles-grid"
      >
        {regularPresets.map(renderPreset)}
      </div>

      {premiumPresets.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "none",
              color: "rgba(255, 215, 140, 0.9)",
              fontWeight: 600,
              paddingBottom: 4,
              borderBottom: "1px solid rgba(255, 215, 140, 0.2)",
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>PREMIUM</span>
            <img src={crownIcon} alt="" style={{ width: 14, height: 14, display: 'block' }} />
          </div>

          <div 
            ref={gridRef2}
            style={gridStyle} 
            className="dm-text-styles-grid"
          >
            {premiumPresets.map(renderPreset)}
          </div>
        </>
      )}
    </div>
  );
}
