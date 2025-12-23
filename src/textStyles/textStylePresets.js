export const TEXT_STYLE_PRESETS_2D = [

  // --- EXISTING UNIQUE PRESETS (170) ---
  // --- Bio Glow ---
  {
    id: "2d_news_ink_bleed",
    name: "Ink Bleed",
    isPremium: false,
    sampleText: "DAILY",
    config: {
      fontFamily: "serif",
      fontSize: 60,
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: "uppercase",
      baseColor: "#1a1a1a",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "0 0 2px rgba(0,0,0,0.3), 1px 1px 1px rgba(0,0,0,0.1)",
    },
  },
  {
    id: "2d_news_yellow_press",
    name: "Yellow Press",
    isPremium: false,
    sampleText: "SCANDAL",
    config: {
      fontFamily: "serif",
      fontSize: 64,
      fontWeight: 900,
      letterSpacing: -0.02,
      textTransform: "uppercase",
      baseColor: "#000",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "0.5px 0.5px 0 #fff, 2px 2px 0 #000",
    },
  },
  {
    id: "2d_news_hot_lead",
    name: "Hot Lead",
    isPremium: true,
    sampleText: "PRESS",
    config: {
      fontFamily: "serif",
      fontSize: 64,
      fontWeight: 800,
      letterSpacing: 0.05,
      textTransform: "uppercase",
      baseColor: "#333",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "-1px -1px 0 #000, 1px 1px 0 #555",
    },
  },
  {
    id: "2d_news_dusty_archive",
    name: "Archive",
    isPremium: false,
    sampleText: "REPORT",
    config: {
      fontFamily: "serif",
      fontSize: 60,
      fontWeight: 400,
      letterSpacing: 0.02,
      textTransform: "none",
      baseColor: "#4e342e",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "0 0 5px rgba(78,52,46,0.2)",
    },
  },
  {
    id: "2d_news_columnist",
    name: "Columnist",
    isPremium: false,
    sampleText: "OPINION",
    config: {
      fontFamily: "serif",
      fontSize: 58,
      fontWeight: 600,
      letterSpacing: -0.01,
      textTransform: "uppercase",
      baseColor: "#212121",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "1px 1px 0 rgba(255,255,255,0.5)",
    },
  },
  {
    id: "2d_news_classified",
    name: "Classified",
    isPremium: true,
    sampleText: "FOR SALE",
    config: {
      fontFamily: "monospace",
      fontSize: 50,
      fontWeight: 400,
      letterSpacing: 0,
      textTransform: "uppercase",
      baseColor: "#000",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "0.2px 0.2px 0 #444",
    },
  },
  {
    id: "2d_news_vintage_headline",
    name: "Big News",
    isPremium: true,
    sampleText: "TITANIC",
    config: {
      fontFamily: "serif",
      fontSize: 72,
      fontWeight: 900,
      letterSpacing: -0.05,
      textTransform: "uppercase",
      baseColor: "#1a1a1a",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "3px 3px 0 rgba(0,0,0,0.1)",
    },
  },
  {
    id: "2d_news_morning_edition",
    name: "Morning Post",
    isPremium: false,
    sampleText: "LATEST",
    config: {
      fontFamily: "serif",
      fontSize: 62,
      fontWeight: 700,
      letterSpacing: 0.05,
      textTransform: "uppercase",
      baseColor: "#2c3e50",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "0.5px 0.5px 2px rgba(0,0,0,0.2)",
    },
  },
  {
    id: "2d_news_ink_smudge",
    name: "Smudged Ink",
    isPremium: true,
    sampleText: "DIRTY",
    config: {
      fontFamily: "serif",
      fontSize: 64,
      fontWeight: 800,
      letterSpacing: 0,
      textTransform: "uppercase",
      baseColor: "#111",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "2px 0 10px rgba(0,0,0,0.4), -2px 0 5px rgba(0,0,0,0.2)",
    },
  },
  {
    id: "2d_news_editor_choice",
    name: "Editor Cut",
    isPremium: false,
    sampleText: "VERDICT",
    config: {
      fontFamily: "system-ui",
      fontSize: 64,
      fontWeight: 900,
      letterSpacing: 0.02,
      textTransform: "uppercase",
      baseColor: "#000",
      stroke: { enabled: false },
      glow: { enabled: false },
      depth: { enabled: false },
      textShadow: "1px 1px 0 #fff, 2px 2px 0 #333",
    },
  },
{
    id: "2d_alien_biolume",
    name: "Bio Glow",
    config: {
        baseColor: "#00ffcc",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #00ffcc, 0 0 30px #aa00ff, 0 0 50px rgba(170,0,255,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Rust Art ---
{
    id: "2d_industrial_rust",
    name: "Rust Art",
    config: {
        baseColor: "#3e2723",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #5d4037, 2px 2px 0 #d84315, 4px 4px 12px rgba(0,0,0,0.6)",
        textTransform: "uppercase"
    }
},
  // --- Oil Slick ---
{
    id: "2d_oil_slick",
    name: "Oil Slick",
    config: {
        baseColor: "#1a1a1a",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "2px -2px 0 rgba(255,0,255,0.5), -2px 2px 0 rgba(0,255,255,0.5), 0 5px 15px rgba(0,0,0,0.8)",
        textTransform: "uppercase"
    }
},
  // --- Thin Wire ---
{
    id: "2d_neon_wire",
    name: "Thin Wire",
    config: {
        baseColor: "#fff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 100,
        glow: {
            enabled: false
        },
        letterSpacing: 0.3,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #fff, 0 0 15px #00e5ff, 0 0 30px #00e5ff",
        textTransform: "uppercase"
    }
},
  // --- Soft Clay ---
{
    id: "2d_clay_molding",
    name: "Soft Clay",
    config: {
        baseColor: "#e0e0e0",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: -0.02,
        stroke: {
            enabled: false
        },
        textShadow: "inset 0 2px 4px rgba(0,0,0,0.3), 1px 1px 0 #fff",
        textTransform: "uppercase"
    }
},
  // --- Cyber Red ---
{
    id: "2d_cyber_blood",
    name: "Cyber Red",
    config: {
        baseColor: "#ff1744",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 60,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "3px 3px 0 #000, 0 0 15px rgba(255,23,68,0.6)",
        textTransform: "uppercase"
    }
},
  // --- Foggy Pine ---
{
    id: "2d_deep_forest_mist",
    name: "Foggy Pine",
    config: {
        baseColor: "#2e7d32",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.15,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 20px rgba(255,255,255,0.4), 0 10px 20px rgba(0,0,0,0.2)",
        textTransform: "uppercase"
    }
},
  // --- Obsidian ---
{
    id: "2d_luxury_obsidian",
    name: "Obsidian",
    config: {
        baseColor: "#000",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "0 -1px 1px rgba(255,255,255,0.5), 0 5px 15px rgba(0,0,0,0.9)",
        textTransform: "uppercase"
    }
},
  // --- Plasma ---
{
    id: "2d_plasma_burn",
    name: "Plasma",
    config: {
        baseColor: "#fff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #d500f9, 0 0 20px #d500f9, 0 0 40px #651fff",
        textTransform: "uppercase"
    }
},
  // --- Ink Draft ---
{
    id: "2d_blueprint_ink",
    name: "Ink Draft",
    config: {
        baseColor: "#0d47a1",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 54,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #fff, 2px 2px 0 #0d47a1",
        textTransform: "uppercase"
    }
},
  // --- Mosaic Edge ---
{
    id: "2d_persian_mosaic",
    name: "Mosaic Edge",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.15,
        stroke: {
            enabled: false
        },
        textShadow: "-2px -2px 0 #005662, 2px 2px 0 #b2ebf2, 5px 15px 25px rgba(0,0,0,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Ancient Sand ---
{
    id: "2d_ancient_sand",
    name: "Ancient Sand",
    config: {
        baseColor: "#ffe082",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: 0.2,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #fff, 2px 2px 0 #d4a017, 3px 3px 0 #b8860b, 4px 4px 0 #8b6508",
        textTransform: "uppercase"
    }
},
  // --- Sultan Night ---
{
    id: "2d_sultan_night",
    name: "Sultan Night",
    config: {
        baseColor: "#1a237e",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #7986cb, 0 0 20px #3949ab, 0 15px 35px rgba(0,0,0,0.6)",
        textTransform: "uppercase"
    }
},
  // --- Gold Offset ---
{
    id: "2d_gold_outline_offset",
    name: "Gold Offset",
    config: {
        baseColor: "transparent",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.25,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #ffd700, -1px -1px 0 #ffd700, 1px -1px 0 #ffd700, -1px 1px 0 #ffd700, 5px 5px 15px rgba(0,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Persian Pearl ---
{
    id: "2d_oriental_pearl",
    name: "Persian Pearl",
    config: {
        baseColor: "#f5f5f5",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.3,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 10px rgba(178,235,242,0.8), -2px -2px 10px rgba(248,187,208,0.8), 0 10px 20px rgba(0,0,0,0.1)",
        textTransform: "uppercase"
    }
},
  // --- Persian Gold ---
{
    id: "2d_persian_gold",
    name: "Persian Gold",
    config: {
        baseColor: "#ffecb3",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.15,
        stroke: {
            enabled: false
        },
        textShadow: "0 2px 0 #b8860b, 0 4px 0 #8b6508, 0 8px 20px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Royal Azure ---
{
    id: "2d_royal_azure",
    name: "Royal Azure",
    config: {
        baseColor: "#00e5ff",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "0 4px 0 #006064, 4px 4px 0 rgba(0,0,0,0.8), 0 0 15px rgba(0,229,255,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Desert Night ---
{
    id: "2d_desert_sunset",
    name: "Desert Night",
    config: {
        baseColor: "#ff7043",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "3px 3px 0 #3e2723, 6px 6px 20px rgba(255,112,67,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Emerald Palace ---
{
    id: "2d_emerald_palace",
    name: "Emerald Palace",
    config: {
        baseColor: "#aaffcc",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: 0.08,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #00c853, 0 4px 0 #1b5e20, 0 12px 25px rgba(0,0,0,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Mystic Silk ---
{
    id: "2d_mystic_silk",
    name: "Mystic Silk",
    config: {
        baseColor: "#f3e5f5",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.2,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 12px #9c27b0, 0 8px 24px rgba(156,39,176,0.3)",
        textTransform: "uppercase"
    }
},
  // --- Cyber Lime ---
{
    id: "2d_cyber_lime",
    name: "Cyber Lime",
    config: {
        baseColor: "#b2ff59",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px rgba(178,255,89,0.8), 4px 4px 0px #1b5e20",
        textTransform: "uppercase"
    }
},
  // --- Retro Sunset ---
{
    id: "2d_retro_sunset",
    name: "Retro Sunset",
    config: {
        baseColor: "#ff9100",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 4px 0 #ff3d00, 0 8px 0 #3e2723",
        textTransform: "uppercase"
    }
},
  // --- Polar Ice ---
{
    id: "2d_polar_ice",
    name: "Polar Ice",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 20px #80d8ff, -2px -2px 0 #00b0ff",
        textTransform: "uppercase"
    }
},
  // --- Batik Black ---
{
    id: "2d_dark_knight",
    name: "Batik Black",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #444, 3px 3px 0 #222, 0 10px 20px rgba(0,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Pink Doll ---
{
    id: "2d_barbie_vibe",
    name: "Pink Doll",
    config: {
        baseColor: "#ff4081",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: -0.01,
        stroke: {
            enabled: false
        },
        textShadow: "3px 3px 0px #ffffff, 6px 6px 0px #f50057",
        textTransform: "uppercase"
    }
},
  // --- Ultra Violet ---
{
    id: "2d_ultra_violet",
    name: "Ultra Violet",
    config: {
        baseColor: "#d1c4e9",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 15px #6200ea, 0 0 30px #6200ea",
        textTransform: "uppercase"
    }
},
  // --- Blue Glitch ---
{
    id: "2d_glitch_blue",
    name: "Blue Glitch",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 60,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 0 #00ffff, -2px -2px 0 #ff00ff",
        textTransform: "uppercase"
    }
},
  // --- Sahara ---
{
    id: "2d_sahara_gold",
    name: "Sahara",
    config: {
        baseColor: "#ffcc80",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 0 #ef6c00, 0 10px 20px rgba(0,0,0,0.3)",
        textTransform: "uppercase"
    }
},
  // --- Hazardous ---
{
    id: "2d_radioactive",
    name: "Hazardous",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 58,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #ffff00, 3px 3px 0 #ffff00",
        textTransform: "uppercase"
    }
},
  // --- Deep Ruby ---
{
    id: "2d_deep_ruby",
    name: "Deep Ruby",
    config: {
        baseColor: "#b71c1c",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 4px 12px rgba(255,0,0,0.4), 0 0 2px #ff5252",
        textTransform: "uppercase"
    }
},
  // --- Clean Bold ---
{
    id: "2d_clean_bold",
    name: "Clean Bold",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textTransform: "uppercase"
    }
},
  // --- Soft Shadow ---
{
    id: "2d_soft_shadow",
    name: "Soft Shadow",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: 0.01,
        stroke: {
            enabled: false
        },
        textShadow: "0 10px 30px rgba(0,0,0,0.45)",
        textTransform: "uppercase"
    }
},
  // --- Offset Print ---
{
    id: "2d_offset_print",
    name: "Offset Print",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.01,
        stroke: {
            enabled: false
        },
        textShadow: "-2px -2px 0 rgba(0,255,170,0.55), 2px 2px 0 rgba(255,0,120,0.55), 0 10px 24px rgba(0,0,0,0.35)",
        textTransform: "uppercase"
    }
},
  // --- Neon Lite ---
{
    id: "2d_neon_lite",
    name: "Neon Lite",
    config: {
        baseColor: "#eaffff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: 0.04,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 14px rgba(120,255,255,0.55), 0 0 34px rgba(120,255,255,0.25)",
        textTransform: "uppercase"
    }
},
  // --- Subtitle ---
{
    id: "2d_subtitle",
    name: "Subtitle",
    config: {
        baseColor: "rgba(255,255,255,0.92)",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 44,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.18,
        stroke: {
            enabled: false
        },
        textShadow: "0 6px 16px rgba(0,0,0,0.35)",
        textTransform: "uppercase"
    }
},
  // --- Fake Outline ---
{
    id: "2d_outline_fake",
    name: "Fake Outline",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.01,
        stroke: {
            enabled: false
        },
        textShadow: "2px 0 0 rgba(0,0,0,0.9), -2px 0 0 rgba(0,0,0,0.9), 0 2px 0 rgba(0,0,0,0.9), 0 -2px 0 rgba(0,0,0,0.9), 0 10px 22px rgba(0,0,0,0.35)",
        textTransform: "uppercase"
    }
},
  // --- Mono Tech ---
{
    id: "2d_mono_tech",
    name: "Mono Tech",
    config: {
        baseColor: "#d7ffe8",
        depth: {
            enabled: false
        },
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: 56,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: 0.08,
        stroke: {
            enabled: false
        },
        textShadow: "0 6px 18px rgba(0,0,0,0.35)",
        textTransform: "uppercase"
    }
},
  // --- Royal Gold ---
{
    id: "2d_royal_gold",
    name: "Royal Gold",
    config: {
        baseColor: "#ffd700",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 2px 0 #b8860b, 0 4px 0 #8b6508, 0 12px 20px rgba(0,0,0,0.6)",
        textTransform: "uppercase"
    }
},
  // --- 80s Wave ---
{
    id: "2d_retro_wave",
    name: "80s Wave",
    config: {
        baseColor: "#2de2e6",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 72,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "3px 3px 0 #f6019d, 6px 6px 0 #2e2157",
        textTransform: "uppercase"
    }
},
  // --- Comic Pop ---
{
    id: "2d_comic_book",
    name: "Comic Pop",
    config: {
        baseColor: "#ffff00",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 80,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: -0.05,
        stroke: {
            enabled: false
        },
        textShadow: "4px 4px 0 #000, 8px 8px 0 #ff4400",
        textTransform: "uppercase"
    }
},
  // --- Lava Flow ---
{
    id: "2d_lava_burn",
    name: "Lava Flow",
    config: {
        baseColor: "#ff5722",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: -0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #ff9800, 0 5px 0 #bf360c, 0 15px 30px rgba(191,54,12,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Candy Pink ---
{
    id: "2d_candy_pink",
    name: "Candy Pink",
    config: {
        baseColor: "#ff80ab",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0,
        stroke: {
            enabled: false
        },
        textShadow: "0 6px 0 #c2185b, 0 12px 25px rgba(194,24,91,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Ice Cold ---
{
    id: "2d_ice_cold",
    name: "Ice Cold",
    config: {
        baseColor: "#e3f2fd",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #90caf9, 0 0 30px #42a5f5",
        textTransform: "uppercase"
    }
},
  // --- The Matrix ---
{
    id: "2d_matrix_code",
    name: "The Matrix",
    config: {
        baseColor: "#00ff41",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 54,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 12px rgba(0,255,65,0.6)",
        textTransform: "uppercase"
    }
},
  // --- Blood Moon ---
{
    id: "2d_blood_moon",
    name: "Blood Moon",
    config: {
        baseColor: "#212121",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #ff1744, 0 0 20px #b71c1c",
        textTransform: "uppercase"
    }
},
  // --- Ghosty ---
{
    id: "2d_ghost_outline",
    name: "Ghosty",
    config: {
        baseColor: "rgba(255,255,255,0.1)",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 2px rgba(255,255,255,0.8), 0 0 15px rgba(255,255,255,0.3)",
        textTransform: "uppercase"
    }
},
  // --- Tactical ---
{
    id: "2d_military_bold",
    name: "Tactical",
    config: {
        baseColor: "#3e4e3a",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 60,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 0px #1b2419, 4px 4px 10px rgba(0,0,0,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Pure Luxury ---
{
    id: "2d_pure_luxury",
    name: "Pure Luxury",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 58,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.4,
        stroke: {
            enabled: false
        },
        textShadow: "0 15px 35px rgba(0,0,0,0.2)",
        textTransform: "uppercase"
    }
},
  // --- Marshmallow ---
{
    id: "2d_sweet_marshmallow",
    name: "Marshmallow",
    config: {
        baseColor: "#fce4ec",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: -0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 6px 0 #f8bbd0, 0 12px 20px rgba(0,0,0,0.1)",
        textTransform: "uppercase"
    }
},
  // --- Inked ---
{
    id: "2d_ink_bleach",
    name: "Inked",
    config: {
        baseColor: "#1a1a1a",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0px #fff, 2px 2px 0px #1a1a1a",
        textTransform: "uppercase"
    }
},
  // --- Neon Fire ---
{
    id: "2d_neon_fire",
    name: "Neon Fire",
    config: {
        baseColor: "#fff3e0",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #ff9800, 0 0 20px #ff5722, 0 0 40px #ff3d00",
        textTransform: "uppercase"
    }
},
  // --- Hyper Blue ---
{
    id: "2d_hyper_blue",
    name: "Hyper Blue",
    config: {
        baseColor: "#00ffff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: -0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 15px rgba(0,255,255,0.8), 5px 5px 0px #0056b3",
        textTransform: "uppercase"
    }
},
  // --- Crimson Edge ---
{
    id: "2d_crimson_edge",
    name: "Crimson Edge",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 0 #d32f2f, -2px -2px 0 #d32f2f, 2px -2px 0 #d32f2f, -2px 2px 0 #d32f2f",
        textTransform: "uppercase"
    }
},
  // --- Gold Sand ---
{
    id: "2d_gold_sand",
    name: "Gold Sand",
    config: {
        baseColor: "#ffe082",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: 0.2,
        stroke: {
            enabled: false
        },
        textShadow: "0 4px 0 #c6a700, 0 10px 20px rgba(0,0,0,0.2)",
        textTransform: "uppercase"
    }
},
  // --- Bubble Gum ---
{
    id: "2d_bubble_gum",
    name: "Bubble Gum",
    config: {
        baseColor: "#f48fb1",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 72,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: -0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 8px 0 #ad1457, 0 15px 25px rgba(173,20,87,0.3)",
        textTransform: "uppercase"
    }
},
  // --- Coffee ---
{
    id: "2d_coffee_cream",
    name: "Coffee",
    config: {
        baseColor: "#d7ccc8",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 800,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "4px 4px 0 #5d4037",
        textTransform: "uppercase"
    }
},
  // --- Acid Glow ---
{
    id: "2d_acid_green",
    name: "Acid Glow",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #ccff00, 0 0 20px #ccff00",
        textTransform: "uppercase"
    }
},
  // --- Afterglow ---
{
    id: "2d_sunset_burn",
    name: "Afterglow",
    config: {
        baseColor: "#ff5252",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 20px #ffeb3b, 0 5px 15px rgba(255,82,82,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Hazard ---
{
    id: "2d_warning_stripe",
    name: "Hazard",
    config: {
        baseColor: "#ffea00",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 54,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "4px 4px 0px #000, 6px 6px 0px #ffea00",
        textTransform: "uppercase"
    }
},
  // --- Soft Lilac ---
{
    id: "2d_soft_lilac",
    name: "Soft Lilac",
    config: {
        baseColor: "#e1bee7",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 8px 15px rgba(156,39,176,0.3)",
        textTransform: "uppercase"
    }
},
  // --- Retro Arcade ---
{
    id: "2d_manus_retro_arcade",
    name: "Retro Arcade",
    config: {
        baseColor: "#ff00ff",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 55,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: -0.04,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #00ffff, 0 0 10px #ff00ff, 0 0 15px #00ffff, 0 0 20px #ff00ff",
        textTransform: "lowercase"
    }
},
  // --- Glitch Effect ---
{
    id: "2d_manus_glitch_effect",
    name: "Glitch Effect",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 67,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.09,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #ff0000, -1px -1px 0 #00ff00, 0 0 10px rgba(0,0,0,0.8)",
        textTransform: "none"
    }
},
  // --- Frosted Glass ---
{
    id: "2d_manus_frosted_glass",
    name: "Frosted Glass",
    config: {
        baseColor: "#e0f7fa",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 61,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.19,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Lava Flow ---
{
    id: "2d_manus_lava_flow",
    name: "Lava Flow",
    config: {
        baseColor: "#ff5722",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 66,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.01,
        stroke: {
            enabled: false
        },
        textShadow: "0 2px 0 #d84315, 0 4px 0 #bf360c, 0 8px 15px rgba(0,0,0,0.7)",
        textTransform: "lowercase"
    }
},
  // --- Digital Matrix ---
{
    id: "2d_manus_digital_matrix",
    name: "Digital Matrix",
    config: {
        baseColor: "#00ff41",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 60,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.03,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 20px rgba(0,255,65,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Old Newspaper ---
{
    id: "2d_manus_old_newspaper",
    name: "Old Newspaper",
    config: {
        baseColor: "#4e342e",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 70,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.1,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #fff8e1, 2px 2px 0 #d7ccc8",
        textTransform: "none"
    }
},
  // --- Chrome Plated ---
{
    id: "2d_manus_chrome_plated",
    name: "Chrome Plated",
    config: {
        baseColor: "#eceff1",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 54,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 1px 0 #cfd8dc, 0 2px 0 #b0bec5, 0 3px 0 #90a4ae, 0 4px 0 #78909c",
        textTransform: "none"
    }
},
  // --- Water Reflection ---
{
    id: "2d_manus_water_reflection",
    name: "Water Reflection",
    config: {
        baseColor: "#00bcd4",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 56,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: -0.01,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 10px rgba(0,188,212,0.5), 0 10px 20px rgba(0,0,0,0.3)",
        textTransform: "uppercase"
    }
},
  // --- Candy Pop ---
{
    id: "2d_manus_candy_pop",
    name: "Candy Pop",
    config: {
        baseColor: "#ff4081",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 70,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.13,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 0 #f50057, 4px 4px 0 #c51162, 0 0 10px rgba(255,64,129,0.5)",
        textTransform: "none"
    }
},
  // --- Shadow Stamp ---
{
    id: "2d_manus_shadow_stamp",
    name: "Shadow Stamp",
    config: {
        baseColor: "#424242",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 65,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.16,
        stroke: {
            enabled: false
        },
        textShadow: "5px 5px 0 #bdbdbd, 10px 10px 0 #9e9e9e",
        textTransform: "uppercase"
    }
},
  // --- Paper Cutout ---
{
    id: "2d_manus_paper_cutout",
    name: "Paper Cutout",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 54,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.08,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 0 #e0e0e0, 0 10px 0 #bdbdbd, 0 15px 20px rgba(0,0,0,0.3)",
        textTransform: "none"
    }
},
  // --- Sun Bleached ---
{
    id: "2d_manus_sun_bleached",
    name: "Sun Bleached",
    config: {
        baseColor: "#ffeb3b",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 69,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px rgba(255,235,59,0.5), 0 0 20px rgba(255,235,59,0.2)",
        textTransform: "lowercase"
    }
},
  // --- Deep Sea ---
{
    id: "2d_manus_deep_sea",
    name: "Deep Sea",
    config: {
        baseColor: "#01579b",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 50,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: -0.04,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #4fc3f7, 0 0 20px #01579b, 0 0 30px rgba(0,0,0,0.8)",
        textTransform: "lowercase"
    }
},
  // --- Comic Book ---
{
    id: "2d_manus_comic_book",
    name: "Comic Book",
    config: {
        baseColor: "#ff1744",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 52,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.17,
        stroke: {
            enabled: false
        },
        textShadow: "3px 3px 0 #000, 6px 6px 0 #fff, 9px 9px 0 #000",
        textTransform: "lowercase"
    }
},
  // --- Ghostly Apparition ---
{
    id: "2d_manus_ghostly_apparition",
    name: "Ghostly Apparition",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 53,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.06,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #ffffff, 0 0 15px #ffffff, 0 0 30px rgba(255,255,255,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Wood Carving ---
{
    id: "2d_manus_wood_carving",
    name: "Wood Carving",
    config: {
        baseColor: "#795548",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 51,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.13,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #a1887f, 2px 2px 0 #6d4c41, 3px 3px 5px rgba(0,0,0,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Acid Wash ---
{
    id: "2d_manus_acid_wash",
    name: "Acid Wash",
    config: {
        baseColor: "#8bc34a",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 57,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.18,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #cddc39, 0 0 10px #8bc34a, 0 0 15px #cddc39",
        textTransform: "lowercase"
    }
},
  // --- Holographic ---
{
    id: "2d_manus_holographic",
    name: "Holographic",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 53,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #ff00ff, 0 0 10px #00ffff, 0 0 15px #ffff00",
        textTransform: "uppercase"
    }
},
  // --- Worn Leather ---
{
    id: "2d_manus_worn_leather",
    name: "Worn Leather",
    config: {
        baseColor: "#5d4037",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 64,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.14,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #8d6e63, 2px 2px 0 #4e342e, 0 5px 10px rgba(0,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Pixel Art ---
{
    id: "2d_manus_pixel_art",
    name: "Pixel Art",
    config: {
        baseColor: "#00e676",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 59,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.12,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 0 #00c853, 4px 4px 0 #00a03c",
        textTransform: "lowercase"
    }
},
  // --- Black Hole ---
{
    id: "2d_manus_black_hole",
    name: "Black Hole",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 68,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.17,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #424242, 0 0 20px #212121, 0 0 30px rgba(0,0,0,0.9)",
        textTransform: "none"
    }
},
  // --- Emerald Jewel ---
{
    id: "2d_manus_emerald_jewel",
    name: "Emerald Jewel",
    config: {
        baseColor: "#00c853",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 68,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.04,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #69f0ae, 0 0 10px #00c853, 0 0 20px rgba(0,200,83,0.5)",
        textTransform: "none"
    }
},
  // --- Firefly Glow ---
{
    id: "2d_manus_firefly_glow",
    name: "Firefly Glow",
    config: {
        baseColor: "#ffeb3b",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 70,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: -0.05,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #fff, 0 0 10px #ffeb3b, 0 0 20px #ff9800",
        textTransform: "lowercase"
    }
},
  // --- Subtle Emboss ---
{
    id: "2d_manus_subtle_emboss",
    name: "Subtle Emboss",
    config: {
        baseColor: "#e0e0e0",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 69,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.11,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #fff, -1px -1px 0 #9e9e9e",
        textTransform: "uppercase"
    }
},
  // --- Inked Outline ---
{
    id: "2d_manus_inked_outline",
    name: "Inked Outline",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 57,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.04,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #fff, -1px -1px 0 #fff",
        textTransform: "uppercase"
    }
},
  // --- Electric Blue ---
{
    id: "2d_manus_electric_blue",
    name: "Electric Blue",
    config: {
        baseColor: "#00e5ff",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 61,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.19,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #00e5ff, 0 0 20px #00b8d4, 0 0 30px #00e5ff",
        textTransform: "lowercase"
    }
},
  // --- Aged Parchment ---
{
    id: "2d_manus_aged_parchment",
    name: "Aged Parchment",
    config: {
        baseColor: "#fff8e1",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 66,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.19,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #d7ccc8, 2px 2px 0 #bcaaa4",
        textTransform: "lowercase"
    }
},
  // --- Soft Velvet ---
{
    id: "2d_manus_soft_velvet",
    name: "Soft Velvet",
    config: {
        baseColor: "#9c27b0",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 67,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.15,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 10px rgba(0,0,0,0.3), 0 0 10px rgba(156,39,176,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Chalkboard ---
{
    id: "2d_manus_chalkboard",
    name: "Chalkboard",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 58,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #000, 0 0 5px rgba(255,255,255,0.8)",
        textTransform: "none"
    }
},
  // --- Sunset Gradient ---
{
    id: "2d_manus_sunset_gradient",
    name: "Sunset Gradient",
    config: {
        baseColor: "#ff9800",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 69,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.07,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 0 #f44336, 0 10px 0 #e91e63",
        textTransform: "uppercase"
    }
},
  // --- Ice Crystal ---
{
    id: "2d_manus_ice_crystal",
    name: "Ice Crystal",
    config: {
        baseColor: "#e0f7fa",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 69,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: -0.03,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #80d8ff, 0 0 15px #e0f7fa, 0 0 30px rgba(128,216,255,0.5)",
        textTransform: "none"
    }
},
  // --- Rough Concrete ---
{
    id: "2d_manus_rough_concrete",
    name: "Rough Concrete",
    config: {
        baseColor: "#9e9e9e",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 68,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: -0.0,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #757575, 2px 2px 0 #616161, 0 5px 10px rgba(0,0,0,0.4)",
        textTransform: "lowercase"
    }
},
  // --- Bubble Gum ---
{
    id: "2d_manus_bubble_gum",
    name: "Bubble Gum",
    config: {
        baseColor: "#f48fb1",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 67,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.19,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 0 #e91e63, 4px 4px 0 #c2185b, 0 0 10px rgba(244,143,177,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Flat Design Shadow ---
{
    id: "2d_manus_flat_design_shadow",
    name: "Flat Design Shadow",
    config: {
        baseColor: "#4caf50",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 66,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.16,
        stroke: {
            enabled: false
        },
        textShadow: "5px 5px 0 #388e3c",
        textTransform: "none"
    }
},
  // --- Vaporwave ---
{
    id: "2d_manus_vaporwave",
    name: "Vaporwave",
    config: {
        baseColor: "#ff00ff",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 70,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.17,
        stroke: {
            enabled: false
        },
        textShadow: "5px 5px 0 #00ffff, 0 0 10px #ff00ff, 0 0 20px #00ffff",
        textTransform: "none"
    }
},
  // --- Golden Ratio ---
{
    id: "2d_manus_golden_ratio",
    name: "Golden Ratio",
    config: {
        baseColor: "#ffc107",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 62,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: -0.0,
        stroke: {
            enabled: false
        },
        textShadow: "0 2px 0 #ffb300, 0 4px 0 #ffa000, 0 8px 15px rgba(0,0,0,0.4)",
        textTransform: "none"
    }
},
  // --- Slime Green ---
{
    id: "2d_manus_slime_green",
    name: "Slime Green",
    config: {
        baseColor: "#c6ff00",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 68,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.15,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #c6ff00, 0 0 10px #76ff03, 0 0 20px rgba(198,255,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Hard Candy ---
{
    id: "2d_manus_hard_candy",
    name: "Hard Candy",
    config: {
        baseColor: "#ff5252",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 55,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.13,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #ff8a80, 2px 2px 0 #ff1744, 0 0 10px rgba(255,82,82,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Old Film Reel ---
{
    id: "2d_manus_old_film_reel",
    name: "Old Film Reel",
    config: {
        baseColor: "#212121",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 52,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: -0.01,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff",
        textTransform: "lowercase"
    }
},
  // --- Fire Brick ---
{
    id: "2d_manus_fire_brick",
    name: "Fire Brick",
    config: {
        baseColor: "#b71c1c",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 69,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: -0.02,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #e57373, 2px 2px 0 #880e4f, 0 5px 10px rgba(0,0,0,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Cosmic Dust ---
{
    id: "2d_manus_cosmic_dust",
    name: "Cosmic Dust",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 50,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.19,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #e0f7fa, 0 0 15px #b3e5fc, 0 0 30px #81d4fa",
        textTransform: "lowercase"
    }
},
  // --- Sharp Blade ---
{
    id: "2d_manus_sharp_blade",
    name: "Sharp Blade",
    config: {
        baseColor: "#9e9e9e",
        depth: {
            enabled: false
        },
        fontFamily: "system-ui",
        fontSize: 52,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.08,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #fff, -1px -1px 0 #fff, 0 0 5px rgba(0,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Deep Purple ---
{
    id: "2d_manus_deep_purple",
    name: "Deep Purple",
    config: {
        baseColor: "#673ab7",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 70,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.18,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #b39ddb, 0 0 20px #673ab7, 0 0 30px rgba(103,58,183,0.5)",
        textTransform: "none"
    }
},
  // --- Warm Copper ---
{
    id: "2d_manus_warm_copper",
    name: "Warm Copper",
    config: {
        baseColor: "#b7410e",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 67,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.0,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #d2794c, 2px 2px 0 #8c320b, 0 5px 10px rgba(0,0,0,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Digital Camo ---
{
    id: "2d_manus_digital_camo",
    name: "Digital Camo",
    config: {
        baseColor: "#4caf50",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 62,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "3px 3px 0 #8bc34a, 6px 6px 0 #388e3c",
        textTransform: "lowercase"
    }
},
  // --- Soft Pastel ---
{
    id: "2d_manus_soft_pastel",
    name: "Soft Pastel",
    config: {
        baseColor: "#ffccbc",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 56,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 10px rgba(255,204,188,0.5), 0 0 5px #ffccbc",
        textTransform: "uppercase"
    }
},
  // --- Neon Green Slant ---
{
    id: "2d_manus_neon_green_slant",
    name: "Neon Green Slant",
    config: {
        baseColor: "#00ff00",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 50,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.04,
        stroke: {
            enabled: false
        },
        textShadow: "5px 5px 0 #000, 0 0 10px #00ff00",
        textTransform: "lowercase"
    }
},
  // --- Crystal Clear ---
{
    id: "2d_manus_crystal_clear",
    name: "Crystal Clear",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 60,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: -0.04,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 1px #fff, 0 0 2px #fff, 0 0 5px rgba(0,0,0,0.2)",
        textTransform: "none"
    }
},
  // --- Bloody Drip ---
{
    id: "2d_manus_horror_bloody_drip",
    name: "Bloody Drip",
    config: {
        baseColor: "#880000",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 62,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.03,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 0 #440000, 4px 4px 0 #000000, 0 0 10px rgba(255,0,0,0.5)",
        textTransform: "none"
    }
},
  // --- Cursed Scroll ---
{
    id: "2d_manus_horror_cursed_scroll",
    name: "Cursed Scroll",
    config: {
        baseColor: "#5d4037",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 70,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.0,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #8d6e63, 2px 2px 0 #3e2723, 0 0 5px rgba(0,0,0,0.4)",
        textTransform: "none"
    }
},
  // --- Phantom Glitch ---
{
    id: "2d_manus_horror_phantom_glitch",
    name: "Phantom Glitch",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 53,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.07,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #9c27b0, -1px -1px 0 #00e5ff, 0 0 10px rgba(255,255,255,0.3)",
        textTransform: "lowercase"
    }
},
  // --- Grave Dust ---
{
    id: "2d_manus_horror_grave_dust",
    name: "Grave Dust",
    config: {
        baseColor: "#bdbdbd",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 70,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.17,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 10px rgba(0,0,0,0.7), 0 -1px 1px #ffffff",
        textTransform: "lowercase"
    }
},
  // --- Necropolis Neon ---
{
    id: "2d_manus_horror_necropolis_neon",
    name: "Necropolis Neon",
    config: {
        baseColor: "#4a148c",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 57,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.01,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #e040fb, 0 0 20px #7c4dff, 0 0 30px rgba(124,77,255,0.4)",
        textTransform: "lowercase"
    }
},
  // --- Silent Hill Fog ---
{
    id: "2d_manus_horror_silent_hill_fog",
    name: "Silent Hill Fog",
    config: {
        baseColor: "#e0e0e0",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 57,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.06,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 15px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.2)",
        textTransform: "lowercase"
    }
},
  // --- Vampire Bite ---
{
    id: "2d_manus_horror_vampire_bite",
    name: "Vampire Bite",
    config: {
        baseColor: "#d50000",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 54,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.16,
        stroke: {
            enabled: false
        },
        textShadow: "3px 3px 0 #000000, 0 0 15px rgba(213,0,0,0.7)",
        textTransform: "none"
    }
},
  // --- Black Magic ---
{
    id: "2d_manus_horror_black_magic",
    name: "Black Magic",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 50,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.15,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #673ab7, 0 0 20px #311b92, 0 0 30px rgba(0,0,0,0.9)",
        textTransform: "none"
    }
},
  // --- Rusted Chains ---
{
    id: "2d_manus_horror_rusted_chains",
    name: "Rusted Chains",
    config: {
        baseColor: "#795548",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 53,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.17,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #a1887f, 2px 2px 0 #5d4037, 0 5px 10px rgba(0,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Witchcraft Green ---
{
    id: "2d_manus_horror_witchcraft_green",
    name: "Witchcraft Green",
    config: {
        baseColor: "#00c853",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 56,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.19,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #69f0ae, 0 0 20px #004d40, 0 0 30px rgba(0,200,83,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Crypt Engraving ---
{
    id: "2d_manus_horror_crypt_engraving",
    name: "Crypt Engraving",
    config: {
        baseColor: "#455a64",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 51,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.16,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #78909c, -1px -1px 0 #263238",
        textTransform: "uppercase"
    }
},
  // --- Ectoplasm Slime ---
{
    id: "2d_manus_horror_ectoplasm_slime",
    name: "Ectoplasm Slime",
    config: {
        baseColor: "#c6ff00",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 67,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.06,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #76ff03, 0 0 15px #c6ff00, 0 0 25px rgba(198,255,0,0.6)",
        textTransform: "lowercase"
    }
},
  // --- Chainsaw Gore ---
{
    id: "2d_manus_horror_chainsaw_gore",
    name: "Chainsaw Gore",
    config: {
        baseColor: "#ff1744",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 55,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.11,
        stroke: {
            enabled: false
        },
        textShadow: "4px 4px 0 #000000, 0 0 10px #ff1744",
        textTransform: "none"
    }
},
  // --- Skeletal Bone ---
{
    id: "2d_manus_horror_skeletal_bone",
    name: "Skeletal Bone",
    config: {
        baseColor: "#f5f5f5",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 60,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.08,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #e0e0e0, 2px 2px 0 #bdbdbd, 0 5px 10px rgba(0,0,0,0.3)",
        textTransform: "lowercase"
    }
},
  // --- Deep Abyss ---
{
    id: "2d_manus_horror_deep_abyss",
    name: "Deep Abyss",
    config: {
        baseColor: "#0d47a1",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 69,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: -0.03,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #4fc3f7, 0 0 20px #0d47a1, 0 0 30px rgba(0,0,0,0.8)",
        textTransform: "none"
    }
},
  // --- Possessed Mirror ---
{
    id: "2d_manus_horror_possessed_mirror",
    name: "Possessed Mirror",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 67,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.07,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #ff0000, 0 0 15px #ff0000, 0 0 30px rgba(255,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Haunted Mansion ---
{
    id: "2d_manus_horror_haunted_mansion",
    name: "Haunted Mansion",
    config: {
        baseColor: "#3e2723",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 56,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.09,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #5d4037, 2px 2px 0 #211a17, 0 5px 10px rgba(0,0,0,0.6)",
        textTransform: "uppercase"
    }
},
  // --- Toxic Waste ---
{
    id: "2d_manus_horror_toxic_waste",
    name: "Toxic Waste",
    config: {
        baseColor: "#aeea00",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 66,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.08,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #c6ff00, 0 0 20px #aeea00, 0 0 30px rgba(174,234,0,0.5)",
        textTransform: "none"
    }
},
  // --- Cult Symbol ---
{
    id: "2d_manus_horror_cult_symbol",
    name: "Cult Symbol",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 64,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.15,
        stroke: {
            enabled: false
        },
        textShadow: "3px 3px 0 #ffeb3b, 0 0 10px rgba(255,235,59,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Web Covered ---
{
    id: "2d_manus_horror_web_covered",
    name: "Web Covered",
    config: {
        baseColor: "#e0e0e0",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 57,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #bdbdbd, 2px 2px 0 #9e9e9e, 0 0 5px rgba(0,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Damned Soul ---
{
    id: "2d_manus_horror_damned_soul",
    name: "Damned Soul",
    config: {
        baseColor: "#ff00ff",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 57,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #ff00ff, 0 0 15px #000000, 0 0 30px rgba(255,0,255,0.4)",
        textTransform: "uppercase"
    }
},
  // --- Rotten Flesh ---
{
    id: "2d_manus_horror_rotten_flesh",
    name: "Rotten Flesh",
    config: {
        baseColor: "#795548",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 59,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #a1887f, 2px 2px 0 #4e342e, 0 5px 10px rgba(0,0,0,0.7)",
        textTransform: "uppercase"
    }
},
  // --- Grim Reaper ---
{
    id: "2d_manus_horror_grim_reaper",
    name: "Grim Reaper",
    config: {
        baseColor: "#212121",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 51,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: -0.04,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 0 #424242, 0 10px 0 #000000",
        textTransform: "uppercase"
    }
},
  // --- Demonic Fire ---
{
    id: "2d_manus_horror_demonic_fire",
    name: "Demonic Fire",
    config: {
        baseColor: "#ff6d00",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 52,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.13,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #ff9800, 0 0 20px #ff3d00, 0 0 30px rgba(255,109,0,0.6)",
        textTransform: "none"
    }
},
  // --- Cold Marble ---
{
    id: "2d_manus_horror_cold_marble",
    name: "Cold Marble",
    config: {
        baseColor: "#eceff1",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 62,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.19,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #cfd8dc, -1px -1px 0 #b0bec5",
        textTransform: "lowercase"
    }
},
  // --- Insanity Scribble ---
{
    id: "2d_manus_horror_insanity_scribble",
    name: "Insanity Scribble",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 62,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: -0.05,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 0 #ff0000, 4px 4px 0 #0000ff, 0 0 5px rgba(255,255,255,0.8)",
        textTransform: "lowercase"
    }
},
  // --- Mummy Wrap ---
{
    id: "2d_manus_horror_mummy_wrap",
    name: "Mummy Wrap",
    config: {
        baseColor: "#fff8e1",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 69,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.09,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #d7ccc8, 2px 2px 0 #bcaaa4, 0 5px 10px rgba(0,0,0,0.3)",
        textTransform: "none"
    }
},
  // --- Biohazard Yellow ---
{
    id: "2d_manus_horror_biohazard_yellow",
    name: "Biohazard Yellow",
    config: {
        baseColor: "#ffeb3b",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 64,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: -0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #ffc107, 0 0 20px #ffeb3b, 0 0 30px rgba(255,235,59,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Worm Eaten ---
{
    id: "2d_manus_horror_worm_eaten",
    name: "Worm Eaten",
    config: {
        baseColor: "#4e342e",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 51,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #795548, 2px 2px 0 #3e2723, 0 5px 10px rgba(0,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Midnight Blue ---
{
    id: "2d_manus_horror_midnight_blue",
    name: "Midnight Blue",
    config: {
        baseColor: "#1a237e",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 66,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.09,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #7986cb, 0 0 20px #3949ab, 0 0 30px rgba(26,35,126,0.7)",
        textTransform: "none"
    }
},
  // --- Chilling Frost ---
{
    id: "2d_manus_horror_chilling_frost",
    name: "Chilling Frost",
    config: {
        baseColor: "#e0f7fa",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 51,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.07,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #80d8ff, 0 0 15px #e0f7fa, 0 0 25px rgba(128,216,255,0.4)",
        textTransform: "lowercase"
    }
},
  // --- Corrupted Data ---
{
    id: "2d_manus_horror_corrupted_data",
    name: "Corrupted Data",
    config: {
        baseColor: "#ff0000",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 63,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.01,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #00ff00, -1px -1px 0 #0000ff, 0 0 5px rgba(255,0,0,0.6)",
        textTransform: "none"
    }
},
  // --- Dark Ritual ---
{
    id: "2d_manus_horror_dark_ritual",
    name: "Dark Ritual",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 68,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.06,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 10px #ffc107, 0 0 20px #ff9800, 0 0 30px rgba(0,0,0,0.9)",
        textTransform: "none"
    }
},
  // --- Swamp Thing ---
{
    id: "2d_manus_horror_swamp_thing",
    name: "Swamp Thing",
    config: {
        baseColor: "#388e3c",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 56,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.06,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #66bb6a, 2px 2px 0 #1b5e20, 0 5px 10px rgba(0,0,0,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Screaming Banshee ---
{
    id: "2d_manus_horror_screaming_banshee",
    name: "Screaming Banshee",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 55,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.17,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 20px rgba(255,255,255,0.7)",
        textTransform: "uppercase"
    }
},
  // --- Black Plague ---
{
    id: "2d_manus_horror_black_plague",
    name: "Black Plague",
    config: {
        baseColor: "#212121",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 52,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.14,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #424242, 2px 2px 0 #000000, 0 5px 10px rgba(0,0,0,0.8)",
        textTransform: "lowercase"
    }
},
  // --- Unseen Horror ---
{
    id: "2d_manus_horror_unseen_horror",
    name: "Unseen Horror",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 65,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.08,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 1px #ffffff, 0 0 2px #ffffff, 0 0 5px rgba(0,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Grave Dirt ---
{
    id: "2d_manus_horror_grave_dirt",
    name: "Grave Dirt",
    config: {
        baseColor: "#6d4c41",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 62,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.2,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #8d6e63, 2px 2px 0 #4e342e, 0 5px 10px rgba(0,0,0,0.6)",
        textTransform: "uppercase"
    }
},
  // --- Flesh Wound ---
{
    id: "2d_manus_horror_flesh_wound",
    name: "Flesh Wound",
    config: {
        baseColor: "#ff8a80",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 51,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #d50000, 2px 2px 0 #b71c1c, 0 5px 10px rgba(0,0,0,0.5)",
        textTransform: "none"
    }
},
  // --- Haunted VHS ---
{
    id: "2d_manus_horror_haunted_vhs",
    name: "Haunted VHS",
    config: {
        baseColor: "#9c27b0",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 63,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: -0.05,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #000000, -1px -1px 0 #000000, 0 0 5px rgba(156,39,176,0.6)",
        textTransform: "uppercase"
    }
},
  // --- Shattered Glass ---
{
    id: "2d_manus_horror_shattered_glass",
    name: "Shattered Glass",
    config: {
        baseColor: "#ffffff",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 50,
        fontWeight: 700,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #bdbdbd, -1px -1px 0 #bdbdbd, 0 0 5px rgba(0,0,0,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Whispering Shadow ---
{
    id: "2d_manus_horror_whispering_shadow",
    name: "Whispering Shadow",
    config: {
        baseColor: "#424242",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 56,
        fontWeight: 400,
        glow: {
            enabled: false
        },
        letterSpacing: 0.05,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 10px rgba(0,0,0,0.9), 0 0 5px #ffffff",
        textTransform: "lowercase"
    }
},
  // --- Crimson Peak ---
{
    id: "2d_manus_horror_crimson_peak",
    name: "Crimson Peak",
    config: {
        baseColor: "#b71c1c",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 57,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 5px 0 #d50000, 0 10px 0 #880e4f, 0 0 10px rgba(183,28,28,0.5)",
        textTransform: "uppercase"
    }
},
  // --- Frozen Terror ---
{
    id: "2d_manus_horror_frozen_terror",
    name: "Frozen Terror",
    config: {
        baseColor: "#e0f7fa",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 62,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: -0.02,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #80d8ff, 0 0 15px #e0f7fa, 0 0 30px rgba(0,0,0,0.3)",
        textTransform: "uppercase"
    }
},
  // --- Gothic Lace ---
{
    id: "2d_manus_horror_gothic_lace",
    name: "Gothic Lace",
    config: {
        baseColor: "#000000",
        depth: {
            enabled: false
        },
        fontFamily: "monospace",
        fontSize: 57,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.14,
        stroke: {
            enabled: false
        },
        textShadow: "1px 1px 0 #ffffff, 2px 2px 0 #ffffff, 0 5px 10px rgba(0,0,0,0.7)",
        textTransform: "lowercase"
    }
},
  // --- Flickering Candle ---
{
    id: "2d_manus_horror_flickering_candle",
    name: "Flickering Candle",
    config: {
        baseColor: "#ffeb3b",
        depth: {
            enabled: false
        },
        fontFamily: "sans-serif",
        fontSize: 63,
        fontWeight: 600,
        glow: {
            enabled: false
        },
        letterSpacing: 0.13,
        stroke: {
            enabled: false
        },
        textShadow: "0 0 5px #ffc107, 0 0 10px #ff9800, 0 0 20px rgba(255,235,59,0.7)",
        textTransform: "uppercase"
    }
},
  // --- Warped Reality ---
{
    id: "2d_manus_horror_warped_reality",
    name: "Warped Reality",
    config: {
        baseColor: "#ff00ff",
        depth: {
            enabled: false
        },
        fontFamily: "serif",
        fontSize: 50,
        fontWeight: 900,
        glow: {
            enabled: false
        },
        letterSpacing: 0.2,
        stroke: {
            enabled: false
        },
        textShadow: "2px 2px 0 #00ff00, -2px -2px 0 #0000ff, 0 0 10px rgba(255,0,255,0.5)",
        textTransform: "lowercase"
    }
},
  // --- Ice Cube 01 ---
{
    id: "2d_manus_comic_01",
    name: "Ice Cube 01",
    config: {
        fontFamily: "system-ui",
        fontSize: 69,
        fontWeight: 800,
        letterSpacing: 0.02,
        textTransform: "uppercase",
        baseColor: "#FF0000",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "1px 1px 0 #FFFFFF, 2px 2px 0 #0000FF, 3px 3px 0 #FF0000"
    }
},
  // --- Metal Plate 02 ---
{
    id: "2d_manus_comic_02",
    name: "Metal Plate 02",
    config: {
        fontFamily: "system-ui",
        fontSize: 59,
        fontWeight: 800,
        letterSpacing: 0.1,
        textTransform: "uppercase",
        baseColor: "#FF00FF",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "0 0 5px #fff, 0 0 15px #FF00FF, 0 0 30px #FF00FF"
    }
},
  // --- Toon Shadow 04 ---
{
    id: "2d_manus_comic_04",
    name: "Toon Shadow 04",
    config: {
        fontFamily: "system-ui",
        fontSize: 60,
        fontWeight: 900,
        letterSpacing: 0.1,
        textTransform: "uppercase",
        baseColor: "#FF0000",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "2px -2px 0 #FFFF00, -2px 2px 0 #0000FF"
    }
},
  // --- Glow Pop 05 ---
{
    id: "2d_manus_comic_05",
    name: "Glow Pop 05",
    config: {
        fontFamily: "serif",
        fontSize: 50,
        fontWeight: 900,
        letterSpacing: 0.02,
        textTransform: "uppercase",
        baseColor: "#0000FF",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "inset 0 0 5px rgba(0,0,0,0.5), 1px 1px 0 #000000"
    }
},
  // --- Fire Burst 06 ---
{
    id: "2d_manus_comic_06",
    name: "Fire Burst 06",
    config: {
        fontFamily: "serif",
        fontSize: 62,
        fontWeight: 900,
        letterSpacing: 0.05,
        textTransform: "uppercase",
        baseColor: "#00FF00",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "0 5px 10px rgba(0,0,0,0.4), 0 0 20px #00FF00"
    }
},
  // --- Toon Shadow 07 ---
{
    id: "2d_manus_comic_07",
    name: "Toon Shadow 07",
    config: {
        fontFamily: "system-ui",
        fontSize: 65,
        fontWeight: 900,
        letterSpacing: 0.1,
        textTransform: "uppercase",
        baseColor: "#FF69B4",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "3px 3px 0 #00FFFF, 6px 6px 0 #0000FF"
    }
},
  // --- Comic Edge 08 ---
{
    id: "2d_manus_comic_08",
    name: "Comic Edge 08",
    config: {
        fontFamily: "serif",
        fontSize: 63,
        fontWeight: 900,
        letterSpacing: 0.05,
        textTransform: "uppercase",
        baseColor: "#00FFFF",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "0 0 5px #fff, 0 0 15px #00FFFF, 0 0 30px #00FFFF"
    }
},
  // --- Pop Blast 12 ---
{
    id: "2d_manus_comic_12",
    name: "Pop Blast 12",
    config: {
        fontFamily: "serif",
        fontSize: 53,
        fontWeight: 900,
        letterSpacing: 0.05,
        textTransform: "uppercase",
        baseColor: "#00FFFF",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "2px 2px 0 #0000FF, 4px 4px 0 #FFFFFF"
    }
},
  // --- Jelly Text 13 ---
{
    id: "2d_manus_comic_13",
    name: "Jelly Text 13",
    config: {
        fontFamily: "monospace",
        fontSize: 69,
        fontWeight: 800,
        letterSpacing: 0.1,
        textTransform: "uppercase",
        baseColor: "#FF00FF",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "2px 2px 0 #000000, 4px 4px 0 #000000"
    }
},
  // --- Pixel Punch 14 ---
{
    id: "2d_manus_comic_14",
    name: "Pixel Punch 14",
    config: {
        fontFamily: "monospace",
        fontSize: 70,
        fontWeight: 800,
        letterSpacing: 0.02,
        textTransform: "uppercase",
        baseColor: "#00FFFF",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "2px -2px 0 #FFA500, -2px 2px 0 #00FFFF"
    }
},
  // --- Slime Green 16 ---
{
    id: "2d_manus_comic_16",
    name: "Slime Green 16",
    config: {
        fontFamily: "serif",
        fontSize: 68,
        fontWeight: 900,
        letterSpacing: 0.05,
        textTransform: "uppercase",
        baseColor: "#FF69B4",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "1px 1px 0 #FFFFFF, 2px 2px 0 #FFFFFF, 3px 3px 0 #0000FF"
    }
},
  // --- Slime Green 19 ---
{
    id: "2d_manus_comic_19",
    name: "Slime Green 19",
    config: {
        fontFamily: "serif",
        fontSize: 51,
        fontWeight: 800,
        letterSpacing: 0.1,
        textTransform: "uppercase",
        baseColor: "#FFFF00",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "3px 3px 0 #0000FF, 6px 6px 0 #FF0000"
    }
},
  // --- Bubble Gum 25 ---
{
    id: "2d_manus_comic_25",
    name: "Bubble Gum 25",
    config: {
        fontFamily: "system-ui",
        fontSize: 50,
        fontWeight: 900,
        letterSpacing: 0.02,
        textTransform: "uppercase",
        baseColor: "#FF00FF",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "2px -2px 0 #FFA500, -2px 2px 0 #FF69B4"
    }
},
  // --- Bold Outline 41 ---
{
    id: "2d_manus_comic_41",
    name: "Bold Outline 41",
    config: {
        fontFamily: "monospace",
        fontSize: 54,
        fontWeight: 900,
        letterSpacing: 0.05,
        textTransform: "uppercase",
        baseColor: "#FF00FF",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "inset 0 0 5px rgba(0,0,0,0.5), 1px 1px 0 #FFFFFF"
    }
},
  // --- Ice Cube 44 ---
{
    id: "2d_manus_comic_44",
    name: "Ice Cube 44",
    config: {
        fontFamily: "monospace",
        fontSize: 59,
        fontWeight: 900,
        letterSpacing: 0.05,
        textTransform: "uppercase",
        baseColor: "#FFA500",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "0 0 5px #fff, 0 0 15px #FFA500, 0 0 30px #FFA500"
    }
},

  // --- NEW MANUS RADICAL PRESETS (29 total) ---
  // --- Heavy Duty 01 ---
{
    id: "2d_manus_radical_01",
    name: "Heavy Duty 01",
    config: {
        fontFamily: "monospace",
        fontSize: 58,
        fontWeight: 400,
        letterSpacing: 0.11461877434574917,
        textTransform: "uppercase",
        baseColor: "#FF6347",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: true,
            color: "#FFD700",
            radius: 10,
            intensity: 0.8
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Deep Glow 02 ---
{
    id: "2d_manus_radical_02",
    name: "Deep Glow 02",
    config: {
        fontFamily: "system-ui",
        fontSize: 53,
        fontWeight: 400,
        letterSpacing: 0.040777473687205724,
        textTransform: "lowercase",
        baseColor: "#000000",
        stroke: {
            enabled: true,
            color: "#FFFFFF",
            width: 4,
            type: "solid"
        },
        glow: {
            enabled: true,
            color: "#00FFFF",
            radius: 20,
            intensity: 1.2
        },
        depth: {
            enabled: false
        },
        textShadow: "0 0 5px rgba(0,0,0,0.2)"
    }
},
  // --- Double Stroke 03 ---
{
    id: "2d_manus_radical_03",
    name: "Double Stroke 03",
    config: {
        fontFamily: "system-ui",
        fontSize: 65,
        fontWeight: 900,
        letterSpacing: 0.005456042067377021,
        textTransform: "uppercase",
        baseColor: "#FFFFFF",
        stroke: {
            enabled: true,
            color: "#000000",
            width: 1,
            type: "double"
        },
        glow: {
            enabled: true,
            color: "#FF00FF",
            radius: 10,
            intensity: 0.8
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Ink Splash 04 ---
{
    id: "2d_manus_radical_04",
    name: "Ink Splash 04",
    config: {
        fontFamily: "monospace",
        fontSize: 50,
        fontWeight: 700,
        letterSpacing: 0.13786924581417173,
        textTransform: "capitalize",
        baseColor: "#FF6347",
        stroke: {
            enabled: true,
            color: "#000000",
            width: 2,
            type: "solid"
        },
        glow: {
            enabled: true,
            color: "#FFD700",
            radius: 10,
            intensity: 0.8
        },
        depth: {
            enabled: false
        },
        textShadow: "0 0 5px rgba(0,0,0,0.2)"
    }
},
  // --- Plasma Burst 05 ---
{
    id: "2d_manus_radical_05",
    name: "Plasma Burst 05",
    config: {
        fontFamily: "system-ui",
        fontSize: 68,
        fontWeight: 900,
        letterSpacing: 0.05946502782699077,
        textTransform: "lowercase",
        baseColor: "#FFFFFF",
        stroke: {
            enabled: true,
            color: "#000000",
            width: 1,
            type: "double"
        },
        glow: {
            enabled: true,
            color: "#FF00FF",
            radius: 20,
            intensity: 1.2
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Double Stroke 06 ---
{
    id: "2d_manus_radical_06",
    name: "Double Stroke 06",
    config: {
        fontFamily: "serif",
        fontSize: 64,
        fontWeight: 900,
        letterSpacing: 0.13659292360346287,
        textTransform: "capitalize",
        baseColor: "#000000",
        stroke: {
            enabled: true,
            color: "#FFFFFF",
            width: 4,
            type: "solid"
        },
        glow: {
            enabled: true,
            color: "#00FFFF",
            radius: 20,
            intensity: 1.2
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Vector Outline 07 ---
{
    id: "2d_manus_radical_07",
    name: "Vector Outline 07",
    config: {
        fontFamily: "serif",
        fontSize: 67,
        fontWeight: 400,
        letterSpacing: 0.0214889889387883,
        textTransform: "uppercase",
        baseColor: "#FF6347",
        stroke: {
            enabled: true,
            color: "#000000",
            width: 4,
            type: "solid"
        },
        glow: {
            enabled: true,
            color: "#FFD700",
            radius: 20,
            intensity: 1.2
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Double Stroke 08 ---
{
    id: "2d_manus_radical_08",
    name: "Double Stroke 08",
    config: {
        fontFamily: "monospace",
        fontSize: 67,
        fontWeight: 400,
        letterSpacing: 0.18116785162741778,
        textTransform: "uppercase",
        baseColor: "#FFD700",
        stroke: {
            enabled: false
        },
        glow: {
            enabled: true,
            color: "#FF4500",
            radius: 10,
            intensity: 0.8
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Ink Splash 10 ---
{
    id: "2d_manus_radical_10",
    name: "Ink Splash 10",
    config: {
        fontFamily: "system-ui",
        fontSize: 55,
        fontWeight: 700,
        letterSpacing: 0.07396247364179197,
        textTransform: "uppercase",
        baseColor: "#FFD700",
        stroke: {
            enabled: true,
            color: "#8B4513",
            width: 4,
            type: "solid"
        },
        glow: {
            enabled: true,
            color: "#FF4500",
            radius: 20,
            intensity: 1.2
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Soft Neon 11 ---
{
    id: "2d_manus_radical_11",
    name: "Soft Neon 11",
    config: {
        fontFamily: "system-ui",
        fontSize: 50,
        fontWeight: 900,
        letterSpacing: 0.0020358139610904048,
        textTransform: "capitalize",
        baseColor: "#1E90FF",
        stroke: {
            enabled: true,
            color: "#FFFFFF",
            width: 4,
            type: "solid"
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Frozen Edge 12 ---
{
    id: "2d_manus_radical_12",
    name: "Frozen Edge 12",
    config: {
        fontFamily: "serif",
        fontSize: 65,
        fontWeight: 400,
        letterSpacing: 0.10552698339787314,
        textTransform: "capitalize",
        baseColor: "#000000",
        stroke: {
            enabled: true,
            color: "#FFFFFF",
            width: 1,
            type: "double"
        },
        glow: {
            enabled: false
        },
        depth: {
            enabled: false
        },
        textShadow: "0 0 5px rgba(0,0,0,0.2)"
    }
},
  // --- Ink Splash 13 ---
{
    id: "2d_manus_radical_13",
    name: "Ink Splash 13",
    config: {
        fontFamily: "serif",
        fontSize: 67,
        fontWeight: 900,
        letterSpacing: 0.0193369064251665,
        textTransform: "lowercase",
        baseColor: "#1E90FF",
        stroke: {
            enabled: true,
            color: "#FFFFFF",
            width: 2,
            type: "solid"
        },
        glow: {
            enabled: true,
            color: "#00BFFF",
            radius: 20,
            intensity: 1.2
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Deep Glow 14 ---
{
    id: "2d_manus_radical_14",
    name: "Deep Glow 14",
    config: {
        fontFamily: "system-ui",
        fontSize: 57,
        fontWeight: 700,
        letterSpacing: 0.10236834294616748,
        textTransform: "capitalize",
        baseColor: "#FFFFFF",
        stroke: {
            enabled: true,
            color: "#000000",
            width: 1,
            type: "double"
        },
        glow: {
            enabled: true,
            color: "#FF00FF",
            radius: 10,
            intensity: 0.8
        },
        depth: {
            enabled: false
        },
        textShadow: ""
    }
},
  // --- Digital Glitch 15 ---
{
    id: "2d_manus_radical_15",
    name: "Digital Glitch 15",
    config: {
        fontFamily: "system-ui",
        fontSize: 69,
        fontWeight: 400,
        letterSpacing: 0.14809093341166266,
        textTransform: "capitalize",
        baseColor: "#1E90FF",
        stroke: {
            enabled: true,
            color: "#FFFFFF",
            width: 4,
            type: "solid"
        },
        glow: {
            enabled: true,
            color: "#00BFFF",
            radius: 10,
            intensity: 0.8
        },
        depth: {
            enabled: false
        },
        textShadow: "0 0 5px rgba(0,0,0,0.2)"
    }
},
  // --- Plasma Burst 16 ---
{
    id: "2d_manus_radical_16",
    name: "Plasma Burst 16",
    config: {
        fontFamily: "system-ui",
        fontSize: 64,
        fontWeight: 400,
        letterSpacing: 0.04144942797931228,
        textTransform: "uppercase",
        baseColor: "#FF6347",
        stroke: {
            enabled: true,
            color: "#000000",
            width: 4,
            type: "solid"
        },
        glow: {
            enabled: true,
            color: "#FFD700",
            radius: 10,
            intensity: 0.8
        },
        depth: {
            enabled: false
        },
        textShadow: "0 0 5px rgba(0,0,0,0.2)"
    }
},
  // --- Ink Splash 17 ---
{
    id: "2d_manus_radical_17",
    name: "Ink Splash 17",
    config: {
        fontFamily: "serif",
        fontSize: 54,
        fontWeight: 900,
        letterSpacing: 0.047741715183393055,
        textTransform: "uppercase",
        baseColor: "#1E90FF",
        stroke: {
            enabled: true,
            color: "#FFFFFF",
            width: 2,
            type: "solid"
        },
        glow: {
            enabled: true,
            color: "#00BFFF",
            radius: 10,
            intensity: 0.8
        },
        depth: {
            enabled: false
        },
        textShadow: "0 0 5px rgba(0,0,0,0.2)"
    }
}
];

 export const TEXT_STYLE_PRESETS = TEXT_STYLE_PRESETS_2D;
 export const DEFAULT_TEXT_STYLE_ID = TEXT_STYLE_PRESETS[0]?.id;
