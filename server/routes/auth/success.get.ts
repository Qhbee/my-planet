const AUTH_SUCCESS_I18N: Record<string, { title: string, message: string }> = {
  zh: { title: '认证成功', message: '窗口即将关闭…' },
  en: { title: 'Authentication successful', message: 'Window will close shortly…' }
}

function getLocale(event: import('h3').H3Event): string {
  const cookie = getCookie(event, 'i18n_redirected')
  if (cookie && (cookie === 'zh' || cookie === 'en')) return cookie
  const acceptLang = getHeader(event, 'accept-language') || ''
  if (acceptLang.toLowerCase().includes('zh')) return 'zh'
  return 'en'
}

/**
 * OAuth 成功后弹出窗口加载此页，显示认证成功并自动关闭。
 * 关闭前移除 localStorage 的 temp-nuxt-auth-utils-popup，触发 opener 的 storage 事件以刷新 session。
 */
export default defineEventHandler((event) => {
  const locale = getLocale(event)
  const { title, message } = AUTH_SUCCESS_I18N[locale] ?? AUTH_SUCCESS_I18N.en

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #fafafa;
    }
    .box {
      text-align: center;
      padding: 2rem;
    }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; color: #333; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">✓</div>
    <h1>${title}</h1>
    <p style="margin-top: 0.5rem; color: #666; font-size: 0.875rem;">${message}</p>
  </div>
  <script>
    (function() {
      try {
        if (localStorage.getItem("temp-nuxt-auth-utils-popup")) {
          localStorage.removeItem("temp-nuxt-auth-utils-popup");
        }
      } catch (e) {}
      setTimeout(function() {
        window.close();
      }, 1500);
    })();
  </script>
</body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return html
})
