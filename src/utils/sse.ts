/** 从 SSE 原始文本中提取所有 data: 行的内容（空 data 丢弃） */
export function parseSseData(raw: string): string[] {
  return raw
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trim())
    .filter((data) => data.length > 0)
}
