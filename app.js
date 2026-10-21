const STORAGE_KEY = "tv-home.apps"
const LONG_PRESS_MS = 700
const SCREENSAVER_MS = 5 * 60 * 1000
// Back/Return key codes across TV platforms: browser, Samsung Tizen, LG webOS, Android.
const BACK_KEYS = new Set(["Escape", "Backspace", "GoBack", "BrowserBack", "XF86Back"])
const BACK_CODES = new Set([10009, 461, 4])
const DIRECTIONS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }

const list = document.getElementById("apps")
const addDialog = document.getElementById("add")
const tileDialog = document.getElementById("tile")
const screensaver = document.getElementById("screensaver")
const isAndroid = /Android/i.test(navigator.userAgent)

const state = {
  apps: loadApps(),
  editing: false,
  moving: -1,
  focus: 0,
}

let pressTimer
// Only a keyup paired with a keydown on the home screen activates, so the Enter
// that closes a dialog or finishes a long press does not also launch a tile.
let enterDown = false
let idleTimer

render()
tickClock()
setInterval(tickClock, 1000)
resetIdle()

document.addEventListener("keydown", (event) => {
  if (wakeFromScreensaver()) return event.preventDefault()
  if (document.querySelector("dialog[open]")) return dialogKeys(event)

  const direction = DIRECTIONS[event.key]
  if (direction) {
    event.preventDefault()
    return move(direction)
  }
  if (event.key === "Enter") {
    event.preventDefault()
    if (event.repeat) return
    enterDown = true
    if (state.editing) return
    pressTimer = setTimeout(() => {
      pressTimer = undefined
      enterDown = false
      setEditing(true)
    }, LONG_PRESS_MS)
    return
  }
  if (event.key === "e" || event.key === "E") return setEditing(!state.editing)
  if (isBack(event) && state.editing) {
    event.preventDefault()
    if (state.moving >= 0) return dropTile()
    setEditing(false)
  }
})

document.addEventListener("keyup", (event) => {
  if (event.key !== "Enter" || !enterDown) return
  enterDown = false
  clearTimeout(pressTimer)
  pressTimer = undefined
  activate(state.focus)
})

document.addEventListener("pointerdown", resetIdle)

list.addEventListener("click", (event) => {
  const tile = event.target.closest(".tile")
  if (!tile) return
  state.focus = Number(tile.dataset.index)
  activate(state.focus)
})

tileDialog.addEventListener("close", () => {
  if (tileDialog.returnValue === "remove") {
    state.apps.splice(state.focus, 1)
    saveApps()
  }
  if (tileDialog.returnValue === "move") state.moving = state.focus
  render()
})

addDialog.addEventListener("close", () => {
  if (addDialog.returnValue !== "save") return
  const form = new FormData(addDialog.querySelector("form"))
  state.apps.push({
    name: form.get("name").trim(),
    url: form.get("url").trim(),
    android: form.get("android").trim() || undefined,
    color: form.get("color"),
  })
  state.focus = state.apps.length - 1
  saveApps()
  render()
})

function activate(index) {
  if (index === state.apps.length) return openAddDialog()
  if (!state.editing) return launch(state.apps[index])
  if (state.moving >= 0) return dropTile()
  tileDialog.querySelector("h2").textContent = state.apps[index].name
  tileDialog.showModal()
}

function launch(app) {
  if (isAndroid && app.android) {
    location.href = `intent://#Intent;package=${app.android};S.browser_fallback_url=${encodeURIComponent(app.url)};end`
    return
  }
  location.href = app.url
}

// Left/Right walk the list in order (wrapping across rows); Up/Down follow the
// on-screen layout so they land on the nearest tile in the neighboring row.
function move(direction) {
  const target = direction[0] ? state.focus + direction[0] : verticalTarget(direction[1])
  if (target === undefined || target < 0 || target > state.apps.length) return

  // The "+" tile always stays last, so moved apps cannot pass it.
  if (state.moving >= 0) {
    if (target === state.apps.length) return
    const [app] = state.apps.splice(state.moving, 1)
    state.apps.splice(target, 0, app)
    state.moving = target
    saveApps()
  }
  state.focus = target
  render()
}

function verticalTarget(step) {
  const from = list.children[state.focus].getBoundingClientRect()
  return [...list.children]
    .map((tile, index) => ({ index, rect: tile.getBoundingClientRect() }))
    .filter((item) => (item.rect.top - from.top) * step > 0)
    .map((item) => ({
      index: item.index,
      score: Math.abs(item.rect.top - from.top) * 10 + Math.abs(item.rect.left - from.left),
    }))
    .sort((a, b) => a.score - b.score)[0]?.index
}

function dropTile() {
  state.moving = -1
  render()
}

function setEditing(editing) {
  state.editing = editing
  state.moving = -1
  document.getElementById("mode").hidden = !editing
  render()
}

function openAddDialog() {
  addDialog.querySelector("form").reset()
  addDialog.showModal()
}

// Native dialogs only move focus with Tab, which most remotes lack.
function dialogKeys(event) {
  const dialog = document.querySelector("dialog[open]")
  const typing = event.target.tagName === "INPUT"
  const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: typing ? 0 : 1, ArrowLeft: typing ? 0 : -1 }[event.key]
  if (isBack(event) && !typing) return dialog.close("cancel")
  if (!step) return
  event.preventDefault()
  const focusable = [...dialog.querySelectorAll("input, button")]
  const next = focusable[(focusable.indexOf(document.activeElement) + step + focusable.length) % focusable.length]
  next.focus()
}

function render() {
  document.body.classList.toggle("editing", state.editing)
  const tiles = state.apps.map((app, index) => {
    const tile = document.createElement("li")
    tile.className = "tile"
    tile.textContent = app.name
    tile.style.background = app.color
    tile.dataset.index = index
    tile.tabIndex = -1
    tile.setAttribute("role", "option")
    if (index === state.moving) tile.style.boxShadow = "0 0 0 4px var(--focus), 0 12px 30px rgb(0 0 0 / 0.6)"
    return tile
  })
  const add = document.createElement("li")
  add.className = "tile add"
  add.textContent = "+ Add app"
  add.dataset.index = state.apps.length
  add.tabIndex = -1
  add.setAttribute("role", "option")
  list.replaceChildren(...tiles, add)
  state.focus = Math.min(state.focus, state.apps.length)
  list.children[state.focus].focus()
}

function tickClock() {
  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  document.getElementById("time").textContent = time
  document.getElementById("date").textContent = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  screensaver.textContent = time
}

function resetIdle() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => (screensaver.hidden = false), SCREENSAVER_MS)
}

function wakeFromScreensaver() {
  resetIdle()
  if (screensaver.hidden) return false
  screensaver.hidden = true
  return true
}

function isBack(event) {
  return BACK_KEYS.has(event.key) || BACK_CODES.has(event.keyCode)
}

// Storage can be unavailable on some TV browsers; fall back to the defaults.
function loadApps() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved)) return saved
  } catch {}
  return JSON.parse(JSON.stringify(window.DEFAULT_APPS))
}

function saveApps() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.apps))
  } catch {}
}
