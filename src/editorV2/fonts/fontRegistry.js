// === DM EDITOR V2 - AUTO FONT REGISTRY ===

// Базовый URL для шрифтов (прямые ссылки, r2.dev)
// Пример рабочего URL: https://pub-cd4220c7fb604875a5686b61f0d13f02.r2.dev/fonts/0_BlackerSansProVariableGX.ttf
const FONTS_BASE_URL = "https://pub-cd4220c7fb604875a5686b61f0d13f02.r2.dev/fonts";

// Список файлов, который ты прислал
const FILES = [
"0_BlackerSansProVariableGX.ttf",
"1_BlackerSansProItVariableGX.ttf",
"Adventure_Indiana_Jones.ttf",
"amrys-black-italic.otf",
"amrys-black.otf",
"amrys-semi-bold-italic.otf",
"amrys-semi-bold.otf",
"Andy MT Cyrillic Bold_0.otf",
"Aquiline.ttf",
"ArchiveUkr.ttf",
"Arctika Script.otf",
"Arial Rounded MT + Helvetica.ttf",
"Arial Rounded MT_300 + Helvetica.ttf",
"Arial Rounded MT_700 + Helvetica.ttf",
"ArialBlackPrimer.ttf",
"AsiaAS-Normal.ttf",
"BASEBLOOM-Regular.ttf",
"Belepotan Rus Italic.otf",
"Belepotan Rus.otf",
"Berton-Roman-trial.ttf",
"berton-roman.ttf",
"Berton-Voyage-trial.ttf",
"berton-voyage.ttf",
"Betmo Regular Cyr.otf",
"Bistroc.otf",
"BulbasaurSP.otf",
"Candice Cyr Regular.ttf",
"CCSpellcaster Bold Italic.ttf",
"CCSpellcaster Bold.ttf",
"CCSpellcaster Italic.ttf",
"CCSpellcaster Regular.ttf",
"CCZoinks Inline.ttf",
"CCZoinks Outline.ttf",
"CCZoinks Regular.ttf",
"century_gothic__xara_edit__font_by_104godiego_djuj1h9.ttf",
"Christmas On Crack.otf",
"Coffee Bear.otf",
"Compacta LT Black P.otf",
"Compacta LT Light Compress.otf",
"Crackhouse Cyr (sherbackoffalex).otf",
"Crackhouse.ttf",
"Daneehand Regular Cyr.ttf",
"DearType - Lifehack Basic.otf",
"DearType - Lifehack Bold.otf",
"DearType - Lifehack Goodies.otf",
"DearType - Lifehack Italic Bold.otf",
"DearType - Lifehack Italic Medium.otf",
"DearType - Lifehack Italic.otf",
"DearType - Lifehack Medium.otf",
"DearType - Lifehack Sans Bold.otf",
"DearType - Lifehack Sans Medium.otf",
"DearType - Lifehack Sans.otf",
"DearType - Lifehack.otf",
"dehinted-DarumadropOne.ttf",
"dehinted-GillSansNova-ExtraCondBold.ttf",
"dehinted-HandveticaNeue-Regular.ttf",
"Derby Regular.otf",
"Derby Shadow.ttf",
"Deutsch Gothic Regular.otf",
"DIST Inking.ttf",
"DKCinnabarBrush-Regular.ttf",
"EternaBreaks-Regular_0.ttf",
"Etude Noire Bold.ttf",
"Etude Noire Light.ttf",
"Etude Noire Medium.ttf",
"Etude Noire Regular.ttf",
"FalknerPro.otf",
"farang_0.ttf",
"FasolSPDemo.otf",
"Forksa-Regular.ttf",
"Freestyle Script  (sherbackoffalex kerning).otf",
"Freestyle Script Bold  RUS.otf",
"Freestyle Script Bold.otf",
"Freestyle Script ITC Bold.otf",
"Freestyle Script ITC Regular.otf",
"Freestyle Script Plain.otf",
"fs-picto.ttf",
"Fyl-Regular.ttf",
"Fyl-Rotated.ttf",
"gergel_font.otf",
"gnyrwn971.ttf",
"gnyrwn977.otf",
"Guano Apes (Rus by sherbackoffalex).otf",
"Hamiltone1.otf",
"Hello_January_script_cyrillic_Script.otf",
"HelveticaInseratLTPro.otf",
"Hombre Bold Italic.otf",
"Hombre Bold.otf",
"Hombre Italic.otf",
"Hombre Regular.otf",
"Homer Simpson.ttf",
"HowToBasicDisplay-Bold.ttf",
"HowToBasicDisplay-BoldItalic.ttf",
"hummus.ttf",
"HUNoodles-Bold.otf",
"HYWenHei.ttf",
"Improv ICG.otf",
"InsurgentPro_0.ttf",
"Ithaka Bold_0.otf",
"ithaka-regular_0.otf",
"Izvod.otf",
"JacobyICGBlackCyrillic-Regular[1].otf",
"jaipur.ttf",
"jeM.otf",
"Jun_Italic.otf",
"Jun_Regular.otf",
"KaaosPro.ttf",
"Karlson Regular.ttf",
"Karton-Regular.ttf",
"Kids52-Regular.otf",
"Kontrabanda.ttf",
"kraM.ttf",
"KvitkaSPDemo.otf",
"LaborUnion-Regular.otf",
"Lady Marmalade.otf",
"LeOsler-RoughBorderRegular.ttf",
"LeOsler-RoughIconRegular.ttf",
"LeOsler-RoughShadowRegular.ttf",
"LeOsler-SharpRegular.ttf",
"LeOsler-StampLight.ttf",
"Letov.ttf",
"LincolnElectric-Over.ttf",
"LincolnElectric-Regular.ttf",
"LincolnElectric-Under.ttf",
"Loreley Antiqua.ttf",
"Lubalin Graph ITC Turner Bold.otf",
"MakanHatiCyrillic.otf",
"Manege-Light.ttf",
"MotivationOfHearts.ttf",
"Mr_Lonely.otf",
"MTSCompact-Bold-LBQB3WRX.ttf",
"MTSCompact-Medium-Y4SPBQKE.ttf",
"MTSCompact-Regular-7LG3MIHS.ttf",
"MTSWide-Bold-XQ34CV62.ttf",
"MTSWide-Medium-MH5A5AEJ.ttf",
"Neue Helvetica Pro 69 Compressed Medium.otf",
"ofont.ru_LeoHand.ttf",
"Ogonyok-Regular_bold_plus.ttf.otf",
"Onmark TRIAL Regular.otf",
"PaluiSPDemo-Bold.otf",
"Papyrus-02.otf",
"PassionsConflictRUS-Regular.otf",
"PLBehemoth-SemiCondensed.otf",
"podarok.ttf",
"PowerStationSolidRus-Regular.ttf",
"Renju.otf",
"Roadkill Heavy Regular.otf",
"Rookie Punk (Сorrected).otf",
"RookiePunk.ttf",
"Schist Black.ttf",
"Schist Bold.ttf",
"Schist Light.ttf",
"Schist Regular.ttf",
"Scrawl Regular_0.ttf",
"ShagCyrillic-Lounge.ttf",
"Slavic-Regular.ttf",
"ST-Warmovie-noncommercial.otf",
"ST-Warmovie-noncommercial.ttf",
"stencilbtrusbyme[1].otf",
"StieglitzSP-Bold 2.otf",
"TagesschriftCyrillic-Regular.ttf",
"tilda-script-bold.otf",
"tilda-script-non-connect-bold.otf",
"tilda-script-semi-bold.otf",
"tildascript-regular.otf",
"TsvikSPDemo.otf",
"UD Digi Kyokasho NP-B.ttf",
"UnifixSPDemo.otf",
"Veles Redone (sherbackoffalex).otf",
"Vertiger.otf",
"WaltoNeue-Italic.ttf",
"WaltoNeue-Regular.ttf",
"Waterway Display Font.ttf",
"Widock TRIAL Bold.otf",
"Wild-Rune.otf",
"xbox.otf",
"XPLOR_Bold-Regular.otf",
"YDKJ_The_Ride2_0.ttf",
"ZenterSPDemo-Black.otf",
"zh-cn.ttf",
"Пьяный Алфавит.ttf",
"шрифт 1_0.otf"
];

// Авто генератор
const generateFontData = (file, index) => {
  const clean = file.replace(/\.(ttf|otf)$/i, "");
  // Генерируем уникальный id, добавляя расширение файла для различения одинаковых имен
  const extension = file.match(/\.(ttf|otf)$/i)?.[1] || '';
  const baseId = clean.replace(/[^a-zA-Z0-9_]/g, "_");
  // Добавляем расширение к id для уникальности (например, ST_Warmovie_noncommercial_otf и ST_Warmovie_noncommercial_ttf)
  const uniqueId = extension ? `${baseId}_${extension.toLowerCase()}` : `${baseId}_${index}`;
  // Корректно кодируем имя файла для URL (пробелы, скобки, плюс и т.д.)
  const encodedFile = encodeURIComponent(file);

  return {
    id: uniqueId,
    family: clean,
    weight: "400",
    style: "normal",
    file,
    url: `${FONTS_BASE_URL}/${encodedFile}` // Прямой URL до файла шрифта с URL-энкодингом
  };
};

export const DM_FONTS = FILES.map((file, index) => generateFontData(file, index));

export const getFontById = (id) => DM_FONTS.find(f => f.id === id);
// Дефолтный шрифт - MTSWide-Medium-MH5A5AEJ (если есть), иначе первый
export const getDefaultFont = () => {
  const preferred = DM_FONTS.find(f => f.family === 'MTSWide-Medium-MH5A5AEJ');
  return preferred || DM_FONTS[0];
};

// Кэш загруженных шрифтов
const loadedFonts = new Set();

export const ensureFontFaceLoaded = async (fontId) => {
  const font = getFontById(fontId);
  if (!font) {
    console.warn(`Font not found: ${fontId}`);
    return;
  }

  // Если шрифт уже загружен, не загружаем снова
  if (loadedFonts.has(fontId)) {
    return;
  }

  // Используем прямой URL до файла шрифта (с энкодингом)
  const url = font.url || `${FONTS_BASE_URL}/${encodeURIComponent(font.file)}`;
  const lowerFile = font.file.toLowerCase();
  const format = lowerFile.endsWith('.otf') ? 'opentype' : 'truetype';
  
  // Используем CSS @font-face для подключения веб-шрифта
  const styleId = `font-face-${fontId}`;
  if (document.getElementById(styleId)) {
    loadedFonts.add(fontId);
    return;
  }

  try {
    // Создаем @font-face через CSS - стандартный способ подключения веб-шрифтов
    const style = document.createElement('style');
    style.id = styleId;
    
    // Экранируем имя шрифта для CSS (экранируем кавычки и специальные символы)
    const safeFamily = font.family
      .replace(/\\/g, '\\\\')  // Экранируем обратные слеши
      .replace(/'/g, "\\'")   // Экранируем одинарные кавычки
      .replace(/"/g, '\\"');  // Экранируем двойные кавычки
    
    console.log(`📝 Loading font: ${font.family} (${fontId}) from ${url}`);
    
    // Подключаем шрифт как веб-шрифт через @font-face
    style.textContent = `
      @font-face {
        font-family: '${safeFamily}';
        src: url('${url}') format('${format}');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
    
    document.head.appendChild(style);
    loadedFonts.add(fontId);
    
    console.log(`✅ Font loaded: ${font.family} (${fontId})`);
  } catch (error) {
    console.error(`❌ Failed to load font ${font.family} (${fontId}):`, error);
    // Не добавляем в loadedFonts, чтобы можно было попробовать снова
  }
};

export default DM_FONTS;
