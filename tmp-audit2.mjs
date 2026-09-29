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
const target = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(BASE + '/admin')}`, { method: 'PUT' })).json()
const ws = await connect(target.webSocketDebuggerUrl)
const ev = async e => (await send(ws, 'Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value
await send(ws, 'Page.enable')
await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send(ws, 'Page.navigate', { url: BASE + '/admin' })
for (let i = 0; i < 25; i++) { const ok = await ev(`document.querySelectorAll('input').length>=2`); if (ok) break; await sleep(1000) }
await sleep(1500)

// Compoe o fundo real subindo a arvore, em vez de assumir o fundo da pagina
const AUDIT = `(() => { try {
  const px = s => (s.match(/[\\d.]+px/g)||['16px']).map(v=>parseFloat(v))
  const lum = c => { const [r,g,b]=c.map(v=>{v/=255; return v<=0.03928? v/12.92 : ((v+0.055)/1.055)**2.4}); return 0.2126*r+0.7152*g+0.0722*b }
  const ratio = (f,b) => { const [x,y]=[lum(f),lum(b)].sort((m,n)=>n-m); return (x+0.05)/(y+0.05) }
  const col = s => { const m=s.match(/rgba?\\(([^)]+)\\)/); if(!m) return null; const p=m[1].split(',').map(parseFloat); return {c:[p[0],p[1],p[2]], a:p.length>3?p[3]:1} }
  const over = (fg,bg) => fg.c.map((v,i)=> v*fg.a + bg[i]*(1-fg.a))
  const effBg = el => {
    let acc = null
    for (let n=el; n && n.nodeType===1; n=n.parentElement) {
      const s = getComputedStyle(n)
      const c = col(s.backgroundColor)
      if (c && c.a > 0) acc = acc === null ? over(c, [2,6,23]) : over(c, acc)
    }
    return acc || [2,6,23]
  }
  const out = []
  const walk = document.querySelectorAll('body *')
  for (const el of walk) {
    const own = [...el.childNodes].some(n => n.nodeType===3 && n.textContent.trim())
    if (!own) continue
    const s = getComputedStyle(el)
    if (s.visibility==='hidden'||s.display==='none') continue
    const fg = col(s.color); if (!fg) continue
    const bg = effBg(el)
    const op = parseFloat(s.opacity)
    const fgE = over({c:fg.c, a: fg.a*op}, bg)
    const r = ratio(fgE, bg)
    const size = parseFloat(s.fontSize), w = parseInt(s.fontWeight)||400
    const large = size >= 24 || (size >= 18.66 && w >= 700)
    const need = large ? 3 : 4.5
    if (r < need) out.push({ t: el.textContent.trim().slice(0,26), cor: s.color, bg: 'rgb('+bg.map(Math.round).join(',')+')', r: +r.toFixed(2), min: need, px: size })
  }
  out.sort((a,b)=>a.r-b.r)
  return JSON.stringify(out.slice(0,18)) + ' TOTAL_FALHAS=' + out.length
} catch (e) { return 'ERRO: ' + e.message } })()`

const show = (label, raw) => {
  console.log(`\n### ${label}`)
  try {
    const m = raw.match(/^(\[.*\]) TOTAL_FALHAS=(\d+)$/s)
    if (!m) { console.log(raw); return }
    const list = JSON.parse(m[1])
    console.log('falhas:', m[2])
    for (const i of list) console.log(`  ${String(i.r).padStart(5)} (min ${i.min})  ${i.px}px  ${i.cor.padEnd(20)} sobre ${i.bg.padEnd(18)} "${i.t}"`)
    if (!list.length) console.log('  nenhum texto abaixo do minimo')
  } catch { console.log(raw) }
}

show('TELA DE LOGIN do /admin', await ev(AUDIT))

await ev(`(() => { const i=document.querySelectorAll('input');
  const set=(el,v)=>{const d=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value');d.set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};
  set(i[0],'ti@robotica.org'); set(i[1],'ti123');
  document.querySelector('form button[type=submit]').click(); return 'ok' })()`)
for (let i = 0; i < 20; i++) { const ok = await ev(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Usuários')`); if (ok) break; await sleep(1000) }
await sleep(2000)
for (const tab of ['Visão Geral', 'Equipes', 'Usuários']) {
  await ev(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(tab)}); if(b) b.click(); return !!b })()`)
  await sleep(2500)
  show('PAINEL /admin — aba ' + tab, await ev(AUDIT))
}
ws.close(); process.exit(0)
