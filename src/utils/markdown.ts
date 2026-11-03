/**
 * 极简 Markdown 渲染（安全版）
 *
 * 更新说明 / 发布说明的内容来自远端（GitHub Release 等），一律视为不可信：
 * 先整体做 HTML 转义、再按行产出受控标签；链接只允许 http(s)，
 * 因此 v-html 拿到的永远是本函数构造的标签，不会被注入任意 HTML / 事件属性。
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 行内语法：链接（仅 http/https）、粗体、行内代码 */
function inline(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, txt: string, url: string) => {
      // 仅允许 http(s) 链接，挡掉 javascript: / data: 等伪协议
      if (!/^https?:\/\//i.test(url)) return txt
      return `<a href="${url}" data-url="${url}">${txt}</a>`
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

/**
 * Markdown → 安全 HTML
 *
 * 支持：标题（# ~ ####）、无序/有序列表、分隔线、段落、行内链接/粗体/代码。
 * 不支持的语法原样以纯文本显示（因为已转义，不会产生标签）。
 */
export function renderMarkdownSafe(md: string): string {
  const text = (md || '').replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  const out: string[] = []
  let inList = false

  for (const line of lines) {
    const esc = escapeHtml(line)

    const li = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/.exec(esc)
    if (li) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(li[1])}</li>`)
      continue
    }

    if (inList) {
      out.push('</ul>')
      inList = false
    }

    const h = /^(#{1,4})\s+(.*)$/.exec(esc)
    if (h) {
      const level = Math.min(h[1].length + 2, 6)
      out.push(`<h${level}>${inline(h[2])}</h${level}>`)
    } else if (/^\s*(?:---|\*\*\*)\s*$/.test(esc)) {
      out.push('<hr />')
    } else if (esc.trim() === '') {
      out.push('<div class="md-gap"></div>')
    } else {
      out.push(`<p>${inline(esc)}</p>`)
    }
  }

  if (inList) out.push('</ul>')
  return out.join('')
}
