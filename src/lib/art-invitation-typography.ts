const ART_DISPLAY_FONT_CLASS_BY_FAMILY: Readonly<Record<string, string>> = {
  "UNI Chu truyen thong": "font-art-uni",
  "SVN-HC Haydon Brush": "font-art-haydon",
  "DFVN New Eddy": "font-art-new-eddy",
  "Fz Qellia": "font-art-qellia",
  Pattaya: "font-art-pattaya",
  "1FTV VIP Signora": "font-art-signora",
  Lora: "font-art-lora",
  "Fz Aghita": "font-art-aghita",
  "The Nautigal": "font-art-nautigal",
  "SVN-HC Built Titling": "font-art-built",
  "Alex Brush": "font-art-alex",
  "SVN-HC Pacifico": "font-art-pacifico",
  HelveticaNeue: "font-art-helvetica",
  "SVN-HC Marvin Visions": "font-art-marvin",
};

function firstFontFamily(stack: string | null | undefined): string | null {
  if (!stack) return null;
  const match = stack.match(/^\s*"?([^",]+)"?/);
  return match ? match[1].trim() : null;
}

export function resolveArtDisplayFontClass(
  fontFamily: string | null | undefined,
  fallbackClass: string,
): string {
  const family = firstFontFamily(fontFamily);
  return family ? ART_DISPLAY_FONT_CLASS_BY_FAMILY[family] ?? fallbackClass : fallbackClass;
}
