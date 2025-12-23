function fnv1a32(str) {
  // FNV-1a 32-bit
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // Convert to unsigned
  return h >>> 0
}

export function makeShuffleSeed() {
  try {
    const buf = new Uint32Array(2)
    crypto.getRandomValues(buf)
    return `${Date.now()}_${buf[0]}_${buf[1]}`
  } catch {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`
  }
}

export function stableShuffle(list, seed, keyOf) {
  if (!Array.isArray(list) || list.length <= 1) return list || []
  const s = String(seed ?? '')
  const getKey = typeof keyOf === 'function' ? keyOf : (x) => String(x?.key ?? x?.id ?? x?.url ?? '')

  return [...list]
    .map((item, idx) => {
      const k = getKey(item) || String(idx)
      const score = fnv1a32(`${s}|${k}`)
      return { item, score, idx }
    })
    .sort((a, b) => (a.score - b.score) || (a.idx - b.idx))
    .map((x) => x.item)
}


