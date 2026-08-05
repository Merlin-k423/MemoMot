/**
 * 浏览器 TTS 封装（法语发音）。
 * 注意：iOS Safari / Android Chrome / 微信内置浏览器支持情况不同，必要时可接入 TTS 服务兜底。
 */
export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  function speak(text: string, lang = 'fr-FR'): boolean {
    if (!supported) return false
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    return true
  }

  return { speak }
}
