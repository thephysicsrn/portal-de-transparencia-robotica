const CDP_PORT = 9222
const BASE = 'https://portal-de-transparencia-robotica.vercel.app'
const sleep = ms => new Promise(r => setTimeout(r, ms))
let msgId = 0
function connect(u) { return new Promise((res, rej) => { const w = new WebSocket(u); w.onopen = () => res(w); w.onerror = () => rej(new Error('ws')) }) }
function send(ws, m, p = {}) {
  const id = ++msgId
  return new Promise((res, rej) => {
    const on = ev => { const d = JSON.parse(ev.data); if (d.id === id) { ws.removeEventListener('message', on); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result) } }
    ws.addEventListener('message', on); ws.send(JSON.stringify({ id, method: m, params: p }))
    setTimeout(() => { ws.removeEventListener('message', on); rej(new Error('timeout ' + m)) }, 30000)
  })
}
const target = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(BASE + '/')}`, { method: 'PUT' })).json()
const ws = await connect(target.webSocketDebuggerUrl)
const ev = async e => (await send(ws, 'Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value
const errs = []
ws.addEventListener('message', e => { const d = JSON.parse(e.data); if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text) })
await send(ws, 'Page.enable'); await send(ws, 'Runtime.enable')
await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send(ws, 'Page.navigate', { url: BASE + '/' }); await sleep(7000)

const login = async (email, pass) => ev(`
  (() => { const i=document.querySelectorAll('input'); if(i.length<2) return 'sem formulario';
    const set=(el,v)=>{const d=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value');d.set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};
    set(i[0],${JSON.stringify(email)}); set(i[1],${JSON.stringify(pass)});
    document.querySelector('form button[type=submit]').click(); return 'ok'; })()`)
const click = n => ev(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(n)}); if(b){b.click();return 'clicado'} return 'NAO EXISTE' })()`)
const btns = () => ev(`JSON.stringify([...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean))`)

console.log('login:', await login('responsavel@robotica.org', 'admin123')); await sleep(5000)
console.log('\n== menu ==')
console.log(await ev(`JSON.stringify([...document.querySelectorAll('.navbar button, .navbar a, nav button, nav a')].map(b=>b.textContent.trim()).filter(Boolean))`))

console.log('\n== aba Equipes ==')
console.log('click:', await click('Equipes')); await sleep(3000)
console.log('botoes:', await btns())

console.log('\n== aba Usuarios ==')
console.log('click:', await click('Usuários')); await sleep(3500)
console.log('botoes:', await btns())
console.log('texto:', await ev(`document.body.innerText.replace(/\\n{2,}/g,'\\n').slice(0,300)`))

console.log('\nerros de runtime:', errs.length ? errs.join(' | ') : 'nenhum')
ws.close(); process.exit(0)
