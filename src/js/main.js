import {
  moneyUpgrades,
  esbirrosUpgrades,
  policeUpgrades,
  weaponsUpgrades
} from "./upgrades.js"
import {
  generateWelcomeMessage,
  generateMoneyNews,
  generateEsbirrosNews,
  generatePoliceNews
} from "./ia.js"
import {
  initializeAuth,
  logout,
  register,
  login
} from "./auth.js"
import { database, ref, set, get } from "./firebase-config.js"

const mapElement = document.getElementById("map")
const notificationContainer = document.getElementById("notificationContainer")
const statsBanner = document.getElementById("statsBanner")
const authContainer = document.getElementById("auth-container")
const registerFormContainer = document.getElementById("register-form-container")
const loginFormContainer = document.getElementById("login-form-container")
const bannerMoneyElement = document.getElementById("bannerMoney")
const bannerArrestedElement = document.getElementById("bannerArrested")
const bannerEsbirrosElement = document.getElementById("bannerEsbirros")
const moneyPerSecondElement = document.getElementById("moneyPerSecond")
const esbirrosPerSecondElement = document.getElementById("esbirrosPerSecond")
const arrestedPerSecondElement = document.getElementById("arrestedPerSecond")
const playerStarsProgress = document.querySelector("#playerStars .progress")
const playerStarsElements = document.querySelectorAll("#playerStars .star")
const bandInfoBandElement = document.getElementById("bandInfoBand")
const bandInfoLeaderElement = document.getElementById("bandInfoLeader")
const bandInfoCountryElement = document.getElementById("bandInfoCountry")
const leaderImgElement = document.getElementById("leaderImage")
const moneyUpgradesContainer = document.getElementById("moneyUpgrades")
const esbirrosUpgradesContainer = document.getElementById("esbirrosUpgrades")
const policeUpgradesContainer = document.getElementById("policeUpgrades")
const economicAbilitiesContainer = document.getElementById("economicAbilities")
const socialAbilitiesContainer = document.getElementById("socialAbilities")
const militaryAbilitiesContainer = document.getElementById("militaryAbilities")
const countryListElement = document.getElementById("country-list")
const detailCountryNameElement = document.getElementById("detailCountryName")
const detailPopulationElement = document.getElementById("detailPopulation")
const detailEsbirrosElement = document.getElementById("detailEsbirros")
const detailArrestedElement = document.getElementById("detailArrested")
const btnMoneyClickElement = document.getElementById("btnMoneyClick")
const registerEmailInput = document.getElementById("register-email")
const registerPasswordInput = document.getElementById("register-password")
const registerPasswordConfirmInput = document.getElementById("register-password-confirm")
const registerBandNameInput = document.getElementById("register-band-name")
const registerStartCountryInput = document.getElementById("register-start-country")
const registerLeaderNameInput = document.getElementById("register-leader-name")
const loginEmailInput = document.getElementById("login-email")
const loginPasswordInput = document.getElementById("login-password")
const showRegisterButton = document.getElementById("show-register")
const showLoginButton = document.getElementById("show-login")
const registerForm = document.getElementById("register-form")
const loginForm = document.getElementById("login-form")
const leaderCards = document.querySelectorAll(".leader-card")
const tabButtons = document.querySelectorAll(".tab-button")
const tabContents = document.querySelectorAll(".tab-content")
const gameTitles = document.querySelectorAll(".section h3.game-title")
const countryProgressModalCloseButton = document.querySelector("#country-progress-modal .close-modal-btn")
const countryProgressModal = document.getElementById("country-progress-modal")
const menuToggleButton = document.getElementById("menu-toggle-button")
const sidebar = document.getElementById("sidebar")
const newsPopupTitle = document.getElementById("popupNewsTitle")
const newsPopupDescription = document.getElementById("popupNewsDescription")
const newsPopupElement = document.getElementById("newsPopup")
const newsOverlay = document.getElementById("newsOverlay")
const closeNewsButton = document.querySelector(".close-news-btn")
const startCountrySelect = document.getElementById("register-start-country")
const iconMoneyInfo = document.getElementById("iconMoneyInfo")
const iconEsbirrosInfo = document.getElementById("iconEsbirrosInfo")
const iconPoliceInfo = document.getElementById("iconPoliceInfo")

const map = L.map(mapElement, { noWrap: true, minZoom: 2, maxZoom: 18 }).setView([40, -3], 5)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{noWrap:true}).addTo(map)

let geojsonLayer = null
let countriesData = null
let esbirroMarker = null
let newsInterval
let conqueredCountriesNotification = null
let activeIcons = []
let iconsEnabled = false
let moneyIconsEnabled = false
let esbirrosIconsEnabled = false
let policeIconsEnabled = false
let lastMoneySpawn = 0
let lastEsbirrosSpawn = 0
let lastPoliceSpawn = 0
const NOT_ENOUGH_MONEY_COOLDOWN = 10000
let BASE_EXPANSION_PROBABILITY = 0.005
const EXPANSION_DIFFICULTY_FACTOR = 0.1
const ARRESTS_COUNTRY_INCREASE = 0.002
const UPGRADE_COST_MULTIPLIER = 1.15
const NOTIFICATION_DURATION = 10000
const CENTER_POPUP_DURATION = 1500
const ANIMATION_DURATION = 500
const SLIDEOUT_ANIMATION_DURATION = 400
const ICON_ANIMATION_DURATION = 300
const MONEY_ICON_SPAWN_INTERVAL = 30000
const ESBIRROS_ICON_SPAWN_INTERVAL = 40000
const POLICE_ICON_SPAWN_INTERVAL = 45000
const POPULATION_CONTROL_GAME_OVER_THRESHOLD = 51
const EXPANSION_ANIMATION_CIRCLE_RADIUS_INCREMENT = 1
const EXPANSION_ANIMATION_CIRCLE_MAX_RADIUS = 100
const EXPANSION_ANIMATION_INTERVAL_MS = 10
const RECONQUIST_EVENT_DURATION = 60000
const BASE_TENSION_EXPANSION = 15
const BASE_TENSION_UPGRADE = 2

const defaultGameState = {
  playerMoney: 100,
  totalArrested: 0,
  policeStars: 0,
  baseMoneyClick: 100,
  totalMoneyUpgrades: 0,
  totalMoneyUpgradesSec: 0,
  totalEsbirrosUpgrades: 0,
  bandName: "",
  leaderName: "",
  leaderImage: "",
  startCountry: "",
  gameActive: false,
  countryStatus: {},
  clickMultiplierPercentage: 0,
  esbirrosMultiplierPercentage: 0,
  moneyPerSecond: 0,
  arrestedPerSecond: 0,
  lastArrestIncrement: 0,
  lastNotEnoughMoneyNotification: 0,
  currentUser: null,
  displayedArrested: 0,
  displayedEsbirros: 0,
  expansionProbabilityMultiplier: 1,
  policeResistance: 0,
  esbirrosPerTickMultiplier: 1,
  policeNotification: null,
  currentIso: null,
  moneyUpgrades: moneyUpgrades.map(u => ({ times: 0 })),
  esbirrosUpgrades: esbirrosUpgrades.map(u => ({ times: 0 })),
  policeUpgrades: policeUpgrades.map(u => ({ times: 0 })),
  weaponsUpgrades: weaponsUpgrades.map(u => ({ times: 0 })),
  firstSession: false,
  startingCountryExpansionMultiplier: 1,
  lastHeatDecrease: 0,
  reconquestEvent: null,
  lastPoliceEventCheck: 0,
  rescueMinionsActive: false,
  lastStarsValue: 0
}
let gameState = { ...defaultGameState }

const moneyIcon = L.icon({ iconUrl: "assets/images/iconodinero.png", iconSize: [48,48], iconAnchor: [24,48], popupAnchor: [0,-48] })
const esbirrosIcon = L.icon({ iconUrl: "assets/images/iconoesbirro.png", iconSize: [48,48], iconAnchor: [24,48], popupAnchor: [0,-48] })
const policeIcon = L.icon({ iconUrl: "assets/images/iconopolicia.png", iconSize: [48,48], iconAnchor: [24,48], popupAnchor: [0,-48] })
const welcomeIcon = L.icon({ iconUrl: "assets/images/iconoinfo.png", iconSize: [64,64], iconAnchor: [32,64], className: "esbirro-marker" })

function formatNumber(num) {
  if(isNaN(num)) return "NaN"
  const s = ["","K","M","B","T","P","E"]
  const d = 1000
  for(let i = s.length-1; i > 0; i--){
    if(num >= Math.pow(d, i)){
      const f = (num / Math.pow(d, i)).toFixed(2)
      return f + s[i]
    }
  }
  return num.toFixed(2)
}
function removeNotificationElement(nd, cont){
  nd.classList.add("slideOutNotification")
  setTimeout(() => {
    if(cont.contains(nd)){
      cont.removeChild(nd)
    }
  }, SLIDEOUT_ANIMATION_DURATION)
}
function createNotificationCloseButton(div, cont){
  const c = document.createElement("span")
  c.classList.add("close-btn")
  c.innerText = "X"
  c.onclick = () => removeNotificationElement(div, cont)
  return c
}
function createNotificationElement(msg, type, cont, countryName = null){
  const d = document.createElement("div")
  d.classList.add("notification", type)
  let icon = ""
  switch(type){
    case "searchStars": icon = '<i class="fas fa-shield-alt"></i> '; break
    case "gameResult": icon = '<i class="fas fa-trophy"></i> '; break
    case "expansion": icon = '<i class="fas fa-globe"></i> '; break
    case "notEnoughMoney": icon = '<i class="fas fa-exclamation-triangle"></i> '; break
    case "countryConquered": icon = '<i class="fas fa-flag-checkered"></i> '; break
    case "auth": icon = '<i class="fas fa-exclamation-circle"></i> '; break
    case "reconquest": icon = '<i class="fas fa-undo"></i> '; break
    case "policeControl": icon = '<i class="fas fa-handcuffs"></i> '; break
    case "economicBlockade": icon = '<i class="fas fa-ban"></i> '; break
    case "hideoutRaid": icon = '<i class="fas fa-house-damage"></i> '; break
    case "rescueSuccess": icon = '<i class="fas fa-user-friends"></i> '; break
    case "rescueFail": icon = '<i class="fas fa-user-slash"></i> '; break
  }
  const cl = createNotificationCloseButton(d, cont)
  d.appendChild(cl)
  const t = document.createElement("div")
  t.classList.add("notification-text")
  t.innerHTML = icon + msg + (countryName ? ` ${countryName}!` : "")
  d.appendChild(t)
  cont.appendChild(d)
  return d
}
function addNotification(msg, type="general", countryName=null){
  const now = Date.now()
  if(type === "notEnoughMoney" && now - gameState.lastNotEnoughMoneyNotification < NOT_ENOUGH_MONEY_COOLDOWN) return
  if(type === "notEnoughMoney") gameState.lastNotEnoughMoneyNotification = now
  const c = statsBanner.classList.contains("hidden") ? notificationContainer : notificationContainer
  if(type === "countryConquered"){
    if(conqueredCountriesNotification){
      conqueredCountriesNotification.querySelector(".notification-text").innerHTML += `<br>¡Has dominado ${countryName}!`
      return
    } else {
      const dv = createNotificationElement(msg, type, c, countryName)
      conqueredCountriesNotification = dv
      setTimeout(() => {
        removeNotificationElement(dv, c)
        conqueredCountriesNotification = null
      }, 15000)
      return
    }
  }
  const div = createNotificationElement(msg, type, c, countryName)
  setTimeout(() => removeNotificationElement(div, c), NOTIFICATION_DURATION)
}
function createAnimation(el, val, t){
  if(!el) return
  const r = el.getBoundingClientRect()
  const a = document.createElement("div")
  a.classList.add(`${t}-animation`)
  a.style.left = `${r.left + r.width/2}px`
  a.style.top = `${r.top + r.height/2}px`
  a.textContent = `${t === "arrested" ? "-" : "+"}${formatNumber(val)}`
  document.body.appendChild(a)
  requestAnimationFrame(() => {
    a.style.transform = "translateY(-20px)"
    a.style.opacity = 0
    a.style.fontFamily = "Pricedown"
    a.style.color = (t==="money"||t==="esbirros") ? "green" : "#ff0000"
  })
  el.classList.add(`${t}-flash`)
  setTimeout(() => {
    if(document.body.contains(a)){
      document.body.removeChild(a)
    }
    el.classList.remove(`${t}-flash`)
  }, ANIMATION_DURATION)
}
function createCenterPopupAnimation(txt, t){
  const c = document.createElement("div")
  c.classList.add("center-popup-animation")
  c.textContent = txt
  c.style.color = (t==="money"||t==="esbirros") ? "green" : "#ff0000"
  c.style.fontFamily = "Pricedown"
  c.style.fontSize = "2em"
  document.body.appendChild(c)
  requestAnimationFrame(() => {
    c.style.opacity = 1
    c.style.transform = "translateY(0)"
  })
  setTimeout(() => {
    if(document.body.contains(c)){
      c.style.opacity = 0
      c.style.transform = "translateY(-20px)"
      setTimeout(() => {
        document.body.removeChild(c)
      }, 300)
    }
  }, CENTER_POPUP_DURATION)
}
function updateHeatUI(){}
function recalcPoliceStarsFromValue(stars){
  gameState.policeStars = Math.min(5, Math.max(0, stars))
  updatePoliceNotification()
}
function updatePoliceNotification(){
  if(gameState.policeStars === gameState.lastStarsValue) return
  gameState.lastStarsValue = gameState.policeStars
  const msg = `Nivel de Alerta Policial: ${gameState.policeStars} <i class="fas fa-shield-alt"></i>`
  if(gameState.policeNotification && gameState.policeNotification.element){
    const text = gameState.policeNotification.element.querySelector(".notification-text")
    if(text) text.innerHTML = msg
    clearTimeout(gameState.policeNotification.timeout)
    gameState.policeNotification.timeout = setTimeout(() => {
      if(gameState.policeNotification?.element){
        removeNotificationElement(gameState.policeNotification.element, notificationContainer)
        gameState.policeNotification = null
      }
    }, NOTIFICATION_DURATION)
  } else {
    const div = createNotificationElement(msg, "searchStars", notificationContainer)
    gameState.policeNotification = { element: div }
    gameState.policeNotification.timeout = setTimeout(() => {
      if(gameState.policeNotification?.element){
        removeNotificationElement(gameState.policeNotification.element, notificationContainer)
        gameState.policeNotification = null
      }
    }, NOTIFICATION_DURATION)
  }
}
function handleAuthStateChanged(u){
  gameState.currentUser = u
  if(u){
    statsBanner.classList.remove("hidden")
    loadGame(u.uid)
  } else {
    statsBanner.classList.add("hidden")
    authContainer.classList.remove("hidden")
  }
}
initializeAuth(handleAuthStateChanged)
window.addEventListener("beforeunload", () => {
  if(gameState.currentUser){
    saveGame()
    logout().catch(() => {})
  }
})
registerForm.addEventListener("submit", e => {
  e.preventDefault()
  const email = registerEmailInput.value
  const pass = registerPasswordInput.value
  const conf = registerPasswordConfirmInput.value
  const bName = registerBandNameInput.value
  const sCountry = registerStartCountryInput.value
  const lName = registerLeaderNameInput.value
  const lImg = document.querySelector(".leader-card.selected .leader-card-image")?.getAttribute("src")
  if(pass !== conf) return addNotification("Las contraseñas no coinciden.","auth")
  if(!lImg) return addNotification("Selecciona un líder.","auth")
  if(!sCountry) return addNotification("Selecciona un país de inicio.","auth")
  gameState.bandName = bName
  gameState.startCountry = countriesData.features.find(f => f.id===sCountry)?.properties?.name || sCountry
  gameState.leaderName = lName
  gameState.leaderImage = lImg
  register(email, pass).then(u => {
    const initGame = { ...defaultGameState }
    Object.assign(initGame, {
      bandName: bName,
      startCountry: gameState.startCountry,
      leaderName: lName,
      leaderImage: lImg,
      currentIso: sCountry,
      gameActive: true,
      firstSession: true,
      countryStatus: {
        [sCountry]: {
          countryName: gameState.startCountry,
          popReal: getPopulationFromFeature(sCountry),
          control: 100,
          dominated: true,
          arrestedTotal: 0,
          esbirros: 1
        }
      }
    })
    set(ref(database, `users/${u.uid}/gameState`), initGame).then(() => {
      loadGame(u.uid)
      addNotification(`Registro exitoso para: ${email}`,"general")
      authContainer.classList.add("hidden")
      displayInitialMinion(sCountry)
    })
  }).catch(e => {
    addNotification(`Error de registro: ${e.message}`,"auth")
  })
})
loginForm.addEventListener("submit", e => {
  e.preventDefault()
  const email = loginEmailInput.value
  const pass = loginPasswordInput.value
  login(email, pass).then(u => {
    loadGame(u.uid)
    authContainer.classList.add("hidden")
    addNotification(`Inicio de sesión exitoso para: ${email}`,"general")
  }).catch(e => {
    addNotification(`Error de inicio de sesión: ${e.message}`,"auth")
  })
})
document.querySelectorAll("form").forEach(f => {
  f.addEventListener("keydown", e => {
    if(e.key === "Enter") e.preventDefault()
  })
})
showRegisterButton.addEventListener("click", () => {
  loginFormContainer.classList.add("hidden")
  registerFormContainer.classList.remove("hidden")
})
showLoginButton.addEventListener("click", () => {
  loginFormContainer.classList.remove("hidden")
  registerFormContainer.classList.add("hidden")
})
function renderStats(){
  let netEsb = 0
  if(gameState.totalEsbirrosUpgrades>0 || gameState.lastArrestIncrement>0){
    netEsb = (gameState.totalEsbirrosUpgrades * gameState.esbirrosPerTickMultiplier * (1 + gameState.esbirrosMultiplierPercentage)) - gameState.arrestedPerSecond
    netEsb = Math.max(0, netEsb)
  }
  moneyPerSecondElement.innerText = `${formatNumber(gameState.moneyPerSecond)}/seg`
  esbirrosPerSecondElement.innerText = `${formatNumber(netEsb)} esb/seg`
  arrestedPerSecondElement.innerText = `${formatNumber(gameState.arrestedPerSecond)} det/seg`
  playerStarsProgress.style.width = `${Math.min(Math.max((gameState.policeStars/5)*100,0),100)}%`
  playerStarsElements.forEach((s,i) => {
    s.style.opacity = i < gameState.policeStars ? 1 : 0
  })
  const totEsb = Object.values(gameState.countryStatus).reduce((a,c) => a + (c.esbirros || 0), 0)
  bannerMoneyElement.innerText = `$${formatNumber(gameState.playerMoney)}`
  bannerArrestedElement.innerText = formatNumber(Math.floor(gameState.totalArrested))
  bannerEsbirrosElement.innerText = formatNumber(Math.floor(totEsb))
  bandInfoBandElement.textContent = gameState.bandName
  bandInfoLeaderElement.textContent = gameState.leaderName
  bandInfoCountryElement.textContent = gameState.startCountry
  leaderImgElement.src = gameState.leaderImage || "images/placeholder.png"
  statsBanner.classList.toggle("active", !statsBanner.classList.contains("hidden"))
  statsBanner.classList.add("subtle-banner")
  updateHeatUI()
}
function updatePerSecondStats(){
  gameState.totalMoneyUpgradesSec = moneyUpgrades.reduce((acc,u) => acc + (u.effectMoneySec || 0)*u.times, 0)
  gameState.moneyPerSecond = Math.max(0, gameState.totalMoneyUpgradesSec)
  gameState.arrestedPerSecond = gameState.lastArrestIncrement / 5
  // Añade la línea para que el icono de esbirros obtenga un valor > 0
  gameState.esbirrosPerSecond = (gameState.totalEsbirrosUpgrades * gameState.esbirrosPerTickMultiplier * (1 + gameState.esbirrosMultiplierPercentage))
}
function displayInitialMinion(iso){
  if(!iso || !geojsonLayer){
    startNewsGeneration()
    return
  }
  let tLayer
  geojsonLayer.eachLayer(l => {
    if(l.feature?.id === iso) tLayer = l
  })
  if(!tLayer){
    startNewsGeneration()
    return
  }
  const b = tLayer.getBounds()
  map.fitBounds(b)
  const c = b.getCenter()
  esbirroMarker = L.marker(c, { icon: welcomeIcon }).addTo(map)
  esbirroMarker._icon.classList.add("marker-appear-animation")
  esbirroMarker.on("click", () => {
    if(esbirroMarker && esbirroMarker._icon){
      esbirroMarker._icon.classList.add("marker-disappear-animation")
      setTimeout(() => {
        if(map.hasLayer(esbirroMarker)){
          map.removeLayer(esbirroMarker)
          const w = generateWelcomeMessage(gameState)
          showNewsPopup(w.message, w.title, "welcome")
          gameState.firstSession = false
          iconsEnabled = true
          moneyIconsEnabled = true
          esbirrosIconsEnabled = true
          policeIconsEnabled = true
          iconMoneyInfo.classList.remove("hidden")
          iconEsbirrosInfo.classList.remove("hidden")
          iconPoliceInfo.classList.remove("hidden")
          saveGame()
          startNewsGeneration()
        }
      }, ICON_ANIMATION_DURATION)
    }
  })
}
function costOf(u){
  return Math.floor(u.baseCost * Math.pow(UPGRADE_COST_MULTIPLIER, u.times))
}
function getPurchasesRemainingForUnlock(up, arr){
  if(up.rank <= 1) return 0
  const prev = arr.filter(x => x.rank===up.rank - 1)
  if(prev.length === 0) return 10
  const sum = prev.reduce((a,g) => a + g.times,0)
  return Math.max(0, prev.length*10 - sum)
}
function isUnlocked(up, arr){
  if(up.rank === 1) return true
  return getPurchasesRemainingForUnlock(up, arr) <= 0
}
function createUpgradeElement(u, c, canBuy, bFunc, type, locked, pRem){
  const d = document.createElement("div")
  d.classList.add("upgrade-item")
  d.setAttribute("data-type", type)
  if(locked){
    d.classList.add("upgrade-locked")
  } else if(!canBuy){
    d.classList.add("upgrade-unavailable")
  }
  const lockedOverlay = locked ? `<div class="locked-overlay"><i class="fas fa-lock lock-icon"></i><div class="purchases-remaining">Compras de la mejora anterior restantes: <span class="remaining-count">${pRem}</span></div></div>` : ""
  let effTxt = ""
  if(type === "money"){
    effTxt = `<div class="effect"><span class="value green-value">+${formatNumber(u.effectMoneySec)}</span> <span class="unit">$/seg</span></div>`
  } else if(type === "esbirros"){
    effTxt = `<div class="effect">+<span class="value green-value">${formatNumber(u.effectEsb)}</span> esb/seg</div>`
  } else if(type === "police"){
    if(u.effectStarsReduction){
      effTxt += `<div class="effect">Reduce Estrellas: <span class="value">-${u.effectStarsReduction}</span></div>`
    }
    if(u.effectPoliceResistance){
      effTxt += `<div class="effect">Reduce prob. policía: <span class="value">${Math.floor(u.effectPoliceResistance*100)}%</span></div>`
    }
  } else if(type === "weapons"){
    effTxt = `<div class="effect">${u.desc}</div>`
  } else if(type === "heat_management"){
    effTxt = `<div class="effect">Reduce prob. de ganar estrellas policiales</div>`
  }
  const imgClass = `upgrade-image ${locked ? "upgrade-image-locked" : ""}`
  const iH = u.image ? `<img src="${u.image}" alt="${u.name}" class="${imgClass}">` : ""
  d.innerHTML = `${lockedOverlay}
<h5 class="upgrade-title"><span class="name">${u.name}</span></h5>
<div class="upgrade-row">
<div class="upgrade-image-container">
${iH}
${(!locked && u.times>0) ? `<span class="upgrade-times-overlay">x${u.times}</span>` : ""}
</div>
<div class="upgrade-info-container">
<p class="upgrade-description">${u.desc}</p>
${effTxt}
</div>
<div class="upgrade-buy-container">
<button class="upgrade-buy-button ${!canBuy ? "upgrade-buy-unavailable" : ""} ${locked ? "upgrade-buy-locked" : ""}">
${locked ? "BLOQUEADO" : `BUY ${formatNumber(c)}$`}
</button>
</div>
</div>`
  const bB = d.querySelector(".upgrade-buy-button")
  bB.addEventListener("click", e => {
    e.stopPropagation()
    bB.classList.add("active")
    setTimeout(() => bB.classList.remove("active"), 200)
    if(locked) return
    if(canBuy){
      bFunc(u)
    } else {
      addNotification("No tienes suficiente dinero.","notEnoughMoney")
    }
  })
  d.addEventListener("click", () => {
    bB.classList.add("active")
    setTimeout(() => bB.classList.remove("active"), 200)
    if(locked) return
    if(canBuy){
      bFunc(u)
    } else {
      addNotification("No tienes suficiente dinero.","notEnoughMoney")
    }
  })
  return d
}
function renderUpgradesList(cont, arr, bFunc, tp){
  if(!cont) return
  cont.innerHTML = ""
  arr.sort((a,b) => a.rank - b.rank)
  let lockedOnce = false
  for(const up of arr){
    if(tp==="weapons" && up.rank>5 && !Object.values(gameState.countryStatus).some(x => x.control>=50)){
      continue
    }
    const c = costOf(up)
    const canBuy = gameState.playerMoney>=c
    const locked = !isUnlocked(up, arr) && up.rank>1
    const pRem = getPurchasesRemainingForUnlock(up, arr)
    if(locked && lockedOnce) continue
    if(locked) lockedOnce = true
    const el = createUpgradeElement(up, c, canBuy, bFunc, tp, locked, pRem)
    cont.appendChild(el)
  }
}
function renderAbilityColumn(cont, arr, bFunc){
  if(!cont) return
  cont.innerHTML = ""
  arr.sort((a,b) => a.rank - b.rank)
  let once = false
  for(const ab of arr){
    if(ab.type==="military" && ab.rank>5 && !Object.values(gameState.countryStatus).some(st => st.control>=50)){
      continue
    }
    const c = costOf(ab)
    const canBuy = gameState.playerMoney >= c
    const locked = !isUnlocked(ab, arr) && ab.rank>1
    const pRem = getPurchasesRemainingForUnlock(ab, arr)
    if(locked && once) continue
    if(locked) once = true
    const upEl = createUpgradeElement(ab, c, canBuy, bFunc, ab.type, locked, pRem)
    const eDiv = upEl.querySelector(".effect")
    if(eDiv){
      if(ab.type==="economic"){
        eDiv.innerHTML = `+<span class="value green-value">${(ab.effect*100).toFixed(1)}</span>% esbirros/seg`
      } else if(ab.type==="social"){
        eDiv.innerHTML = `Reduce eventos policiales al comprar mejoras`
      } else if(ab.type==="heat_management"){
        eDiv.innerHTML = `Reduce prob. de ganar estrellas policiales`
      }
    }
    cont.appendChild(upEl)
  }
}
function renderAbilities(){
  renderAbilityColumn(economicAbilitiesContainer, weaponsUpgrades.filter(x=>x.type==="economic"), buyWeaponUpgrade)
  renderAbilityColumn(socialAbilitiesContainer, weaponsUpgrades.filter(x=>x.type==="social"), buyWeaponUpgrade)
  renderAbilityColumn(militaryAbilitiesContainer, weaponsUpgrades.filter(x=>x.type==="military"), buyWeaponUpgrade)
  renderAbilityColumn(socialAbilitiesContainer, weaponsUpgrades.filter(x=>x.type==="heat_management"), buyWeaponUpgrade)
}
function renderUpgrades(){
  renderUpgradesList(moneyUpgradesContainer, moneyUpgrades, buyMoneyUpgrade, "money")
  renderUpgradesList(esbirrosUpgradesContainer, esbirrosUpgrades, buyEsbirrosUpgrade, "esbirros")
  renderUpgradesList(policeUpgradesContainer, policeUpgrades, buyPoliceUpgrade, "police")
  renderAbilities()
}
async function buyMoneyUpgrade(u){
  const c = costOf(u)
  if(gameState.playerMoney < c) return addNotification("No tienes suficiente dinero.","notEnoughMoney")
  gameState.playerMoney -= c
  u.times++
  gameState.totalMoneyUpgradesSec += (u.effectMoneySec || 0)
  increaseStarsWithResistance(BASE_TENSION_UPGRADE, u.rank)
  updatePerSecondStats()
  renderStats()
  renderUpgrades()
  await saveGame()
}
async function buyEsbirrosUpgrade(u){
  const c = costOf(u)
  if(gameState.playerMoney < c) return addNotification("No tienes suficiente dinero.","notEnoughMoney")
  gameState.playerMoney -= c
  u.times++
  gameState.totalEsbirrosUpgrades += (u.effectEsb || 0)
  increaseStarsWithResistance(BASE_TENSION_UPGRADE, u.rank)
  createAnimation(document.getElementById("bannerEsbirros"), u.effectEsb, "esbirros")
  updatePerSecondStats()
  renderStats()
  renderUpgrades()
  await saveGame()
}
async function buyPoliceUpgrade(u){
  const c = costOf(u)
  if(gameState.playerMoney < c) return addNotification("No tienes suficiente dinero.","notEnoughMoney")
  gameState.playerMoney -= c
  u.times++
  if(u.effectStarsReduction){
    recalcPoliceStarsFromValue(gameState.policeStars - u.effectStarsReduction)
  }
  if(u.effectPoliceResistance){
    gameState.policeResistance += u.effectPoliceResistance
  }
  renderStats()
  renderUpgrades()
  await saveGame()
}
async function buyWeaponUpgrade(u){
  const c = costOf(u)
  if(gameState.playerMoney < c) return addNotification("No tienes suficiente dinero.","notEnoughMoney")
  gameState.playerMoney -= c
  u.times++
  if(u.type==="economic"){
    gameState.clickMultiplierPercentage += u.effect
    increaseStarsWithResistance(BASE_TENSION_UPGRADE, u.rank)
  } else if(u.type==="military"){
    gameState.esbirrosMultiplierPercentage += u.effect
    increaseStarsWithResistance(BASE_TENSION_UPGRADE, u.rank)
  } else if(u.type==="social"){
  } else if(u.type==="heat_management"){
    gameState.policeResistance += (u.effect * 0.01)
  }
  applyWeaponEffect(u)
  updatePerSecondStats()
  renderStats()
  renderAbilities()
  renderUpgrades()
  await saveGame()
}
function applyWeaponEffect(u){
  if(u.id.startsWith("probabilityBoost")){
    gameState.expansionProbabilityMultiplier *= u.effect
  }
  if(u.id.startsWith("policeResistance")){
    gameState.policeResistance += u.effect
  }
  if(u.id.startsWith("esbirrosPerTick")){
    gameState.esbirrosPerTickMultiplier *= u.effect
  }
  if(/^(weaponElite|weaponMastery|weaponLegendary)/.test(u.id)){
    gameState.expansionProbabilityMultiplier *= u.effect
    gameState.policeResistance += u.effect * 0.05
    gameState.esbirrosPerTickMultiplier *= u.effect
  }
}
function increaseStarsWithResistance(base, rank = 1){
  const effective = Math.max(0, base - (base * gameState.policeResistance))
  let starIncrease = 0
  if (effective >= 10) starIncrease = 2
  else if (effective >= 5) starIncrease = 1
  else starIncrease = 0
  if (rank >= 3 && starIncrease > 0) starIncrease += 1
  if (rank >= 5 && starIncrease > 0) starIncrease += 1
  const newStars = gameState.policeStars + starIncrease
  recalcPoliceStarsFromValue(newStars)
}
function startReconquestEvent(countryIso){
  if(gameState.reconquestEvent) return
  const st = gameState.countryStatus[countryIso]
  if(!st || !st.dominated) return
  gameState.reconquestEvent = {
    countryIso: countryIso,
    endTime: Date.now() + RECONQUIST_EVENT_DURATION
  }
  addNotification(`¡La policía reconquista ${st.countryName}!`, "reconquest", st.countryName)
}
function handleReconquestEvent(){
  if(!gameState.reconquestEvent) return
  const countryIso = gameState.reconquestEvent.countryIso
  const countryStatus = gameState.countryStatus[countryIso]
  if(!countryStatus || !countryStatus.dominated){
    endReconquestEvent()
    return
  }
  if(Date.now() > gameState.reconquestEvent.endTime){
    endReconquestEvent()
    return
  }
  if(gameState.policeStars === 5){
    const arrests = Math.floor((countryStatus.esbirros || 1) * 0.3)
    countryStatus.esbirros = Math.max(0, (countryStatus.esbirros || 0) - arrests)
    countryStatus.arrestedTotal = (countryStatus.arrestedTotal || 0) + arrests
    createAnimation(detailArrestedElement, arrests, "arrested")
    renderStats()
    renderWorldList()
    if((countryStatus.esbirros || 0) <= 0){
      countryStatus.dominated = false
      countryStatus.control = 99
      endReconquestEvent(`¡Has perdido ${countryStatus.countryName}!`)
      refreshGeoStyle()
      renderWorldList()
      return
    }
  } else {
    endReconquestEvent(`¡Has repelido la reconquista en ${countryStatus.countryName}!`)
  }
}
function endReconquestEvent(message){
  if(message){
    addNotification(message, "gameResult")
  } else if(gameState.reconquestEvent){
    addNotification(`¡Defendiste con éxito ${gameState.countryStatus[gameState.reconquestEvent.countryIso].countryName}!`, "gameResult")
  }
  gameState.reconquestEvent = null
}
function attemptRescueMinions(countryIso) {
  if (gameState.rescueMinionsActive) return
  gameState.rescueMinionsActive = true
  const upgrade = weaponsUpgrades.find(upg => upg.id === "military-boost-6")
  const baseProbability = upgrade ? upgrade.effect * upgrade.times : 0
  const arrestedCount = gameState.countryStatus[countryIso].arrestedTotal || 0
  const tensionFactor = gameState.policeStars / 5
  const successProbability = Math.max(0, baseProbability - tensionFactor * 0.1)
  if (Math.random() < successProbability) {
    const rescuedMinions = Math.ceil(arrestedCount * (0.1 + baseProbability))
    gameState.countryStatus[countryIso].arrestedTotal = Math.max(0, arrestedCount - rescuedMinions)
    addNotification(`¡Rescate exitoso en ${gameState.countryStatus[countryIso].countryName}! ${rescuedMinions} liberados.`, "rescueSuccess", gameState.countryStatus[countryIso].countryName)
    createAnimation(detailArrestedElement, -rescuedMinions, "arrested")
  } else {
    addNotification(`¡Fallo en el rescate de aliados en ${gameState.countryStatus[countryIso].countryName}!`, "rescueFail", gameState.countryStatus[countryIso].countryName)
  }
  gameState.rescueMinionsActive = false
  renderWorldList()
  renderStats()
  saveGame()
}
function triggerPoliceActions(){
  if (!gameState.gameActive || !countriesData || Date.now() - gameState.lastPoliceEventCheck < 5000) return
  gameState.lastPoliceEventCheck = Date.now()
  const baseEventProbability = gameState.policeStars * 0.05
  if(gameState.policeStars>=1){
    if(Math.random() < baseEventProbability){
      const controlledCountries = Object.keys(gameState.countryStatus).filter(i => gameState.countryStatus[i].control > 0)
      if(controlledCountries.length){
        triggerLocalPoliceControl(controlledCountries, 1+gameState.policeStars*0.2)
      }
    }
  }
  if(gameState.policeStars>=3){
    if(Math.random() < baseEventProbability*0.5){
      triggerEconomicBlockade(1)
    }
    if(Math.random() < baseEventProbability*0.4){
      const dominatedCountries = Object.keys(gameState.countryStatus).filter(i => gameState.countryStatus[i].dominated)
      if(dominatedCountries.length){
        triggerHideoutRaid(dominatedCountries, 1)
      }
    }
  }
  if(gameState.policeStars===5){
    const dominatedCountries = Object.keys(gameState.countryStatus).filter(i => {
      const st = gameState.countryStatus[i]
      return st.dominated && st.control>=100
    })
    if(dominatedCountries.length){
      const rIso = dominatedCountries[Math.floor(Math.random() * dominatedCountries.length)]
      if(!gameState.reconquestEvent) startReconquestEvent(rIso)
    }
  }
}
function triggerLocalPoliceControl(countries, intensity) {
  const countryIso = countries[Math.floor(Math.random() * countries.length)]
  if (!gameState.countryStatus[countryIso]) return
  const st = gameState.countryStatus[countryIso]
  const eventType = Math.random()
  let notification = ""
  if (eventType < 0.33) {
    st.esbirros = Math.max(0, (st.esbirros || 0) - Math.floor(5 * intensity))
    notification = `Reducen la actividad de esbirros en ${st.countryName}`
  } else if (eventType < 0.66) {
    st.control = Math.max(0, st.control - Math.floor(10 * intensity))
    notification = `Dificultan la expansión en ${st.countryName}`
  } else {
    recalcPoliceStarsFromValue(gameState.policeStars + 1)
    notification = `Aumenta la Tensión en ${st.countryName}`
  }
  addNotification(`Controles Policiales. ${notification}`, "policeControl", st.countryName)
  renderWorldList()
}
function triggerEconomicBlockade(intensity) {
  const moneyReduction = gameState.playerMoney * (0.05 * intensity)
  gameState.playerMoney = Math.max(0, gameState.playerMoney - moneyReduction)
  addNotification("La policía intensifica el control financiero. Fondos reducidos.", "economicBlockade")
  renderStats()
}
function triggerHideoutRaid(countries, intensity) {
  const countryIso = countries[Math.floor(Math.random() * countries.length)]
  const st = gameState.countryStatus[countryIso]
  if (!st) return
  const esbirrosLost = Math.floor(Math.max(1, (st.esbirros || 0) * (0.1 * intensity)))
  st.esbirros = Math.max(0, (st.esbirros || 0) - esbirrosLost)
  addNotification(`Redada policial en ${st.countryName}. Esbirros perdidos.`, "hideoutRaid", st.countryName)
  renderWorldList()
}
btnMoneyClickElement.addEventListener("click", async e => {
  if(!gameState.gameActive) return
  const earn = (gameState.baseMoneyClick + gameState.totalMoneyUpgrades) * (1 + gameState.clickMultiplierPercentage)
  gameState.playerMoney += earn
  createAnimation(bannerMoneyElement, earn, "money")
  renderStats()
  renderUpgrades()
  e.target.classList.add("clicked")
  setTimeout(() => e.target.classList.remove("clicked"), 200)
  await saveGame()
})
function onCountryClick(e){
  showCountryDetail(e.target.feature.id)
}
function onCountryMouseOver(e){
  let iso = e.target.feature.id
  let tip
  if(!gameState.countryStatus[iso]){
    const cName = countriesData.features.find(f => f.id===iso)?.properties?.name || iso
    tip = `${cName}\nEsbirros=0\nDetenidos=0\nControl=0%`
  } else {
    const st = gameState.countryStatus[iso]
    tip = `${st.countryName || iso}\nEsbirros: ${formatNumber(st.esbirros || 0)}\nDetenidos: ${formatNumber(st.arrestedTotal || 0)}\nControl: ${st.control || 0}%`
  }
  e.target.bindTooltip(tip).openTooltip()
}
function onCountryMouseOut(e){
  e.target.closeTooltip()
}
function refreshGeoStyle(){
  if(!geojsonLayer) return
  geojsonLayer.setStyle(f => {
    const i = f.id
    const st = gameState.countryStatus[i]
    if(!st) return { color: "#555", weight: 1, fillColor: "#f0f0f0", fillOpacity: 0.2 }
    if(st.dominated) return { color:"#555", weight:1, fillColor:"#008000", fillOpacity:0.7 }
    if((st.arrestedTotal||0) >= (st.popReal||1)) return { color:"#555", weight: 1, fillColor: "#000000", fillOpacity: 0.8 }
    if((st.arrestedTotal||0) > st.esbirros) return { color:"#555", weight:1, fillColor:"#0000FF", fillOpacity:0.4 }
    if(st.control >= 50 && st.control<100) return { color:"#555", weight:1, fillColor:"#800080", fillOpacity:0.5 }
    return { color:"#555", weight:1, fillColor:"#FF0000", fillOpacity:(st.control/100)*0.6 + 0.1 }
  })
}
function getPopulationFromFeature(iso){
  return countriesData?.features.find(f => f.id===iso)?.properties?.population || 0
}
async function saveGame(){
  if(!gameState.currentUser) return
  const toSave = { ...gameState }
  toSave.moneyUpgrades = moneyUpgrades.map(u => ({ times: u.times }))
  toSave.esbirrosUpgrades = esbirrosUpgrades.map(u => ({ times: u.times }))
  toSave.policeUpgrades = policeUpgrades.map(u => ({ times: u.times }))
  toSave.weaponsUpgrades = weaponsUpgrades.map(u => ({ times: u.times }))
  delete toSave.currentUser
  delete toSave.policeNotification
  delete toSave.activeIcons
  delete toSave.reconquestEvent
  delete toSave.lastHeatDecrease
  try {
    for(const k in toSave.countryStatus){
      const st = toSave.countryStatus[k]
      if(!isFinite(st.esbirros) || isNaN(st.esbirros)){
        st.esbirros = 0
      }
    }
    await set(ref(database, `users/${gameState.currentUser.uid}/gameState`), toSave)
  } catch(e){}
}
function loadGame(uid){
  if(!uid) return
  get(ref(database, `users/${uid}/gameState`)).then(s => {
    if(!s.exists()) return
    const saved = s.val()
    gameState = { ...defaultGameState, ...saved, currentUser: gameState.currentUser }
    gameState.policeNotification = null
    moneyUpgrades.forEach((u,i) => u.times = saved.moneyUpgrades?.[i]?.times || 0)
    esbirrosUpgrades.forEach((u,i) => u.times = saved.esbirrosUpgrades?.[i]?.times || 0)
    policeUpgrades.forEach((u,i) => u.times = saved.policeUpgrades?.[i]?.times || 0)
    weaponsUpgrades.forEach((u,i) => u.times = saved.weaponsUpgrades?.[i]?.times || 0)
    gameState.totalMoneyUpgrades = moneyUpgrades.reduce((acc,u) => acc + (u.effectMoney||0)*u.times,0)
    gameState.totalMoneyUpgradesSec = moneyUpgrades.reduce((acc,u) => acc + (u.effectMoneySec||0)*u.times,0)
    gameState.totalEsbirrosUpgrades = esbirrosUpgrades.reduce((acc,u) => acc + (u.effectEsb||0)*u.times,0)
    weaponsUpgrades.forEach(applyWeaponEffect)
    recalcPoliceStarsFromValue(gameState.policeStars)
    updatePerSecondStats()
    renderStats()
    renderUpgrades()
    refreshGeoStyle()
    startGame()
    if(gameState.firstSession && gameState.startCountry){
      displayInitialMinion(gameState.startCountry)
    }
    if(iconsEnabled){
      iconMoneyInfo.classList.remove("hidden")
      iconEsbirrosInfo.classList.remove("hidden")
      iconPoliceInfo.classList.remove("hidden")
    }
  })
}
function getNeighbors(i){
  const f = countriesData.features.find(o => o.id===i)
  if(!f) return []
  const arr = []
  countriesData.features.forEach(ff => {
    if(ff.id === i) return
    const b1 = L.geoJSON(f).getBounds()
    const b2 = L.geoJSON(ff).getBounds()
    if(b1.intersects(b2)) arr.push(ff.id)
  })
  return arr
}
function expandFromCountry(i){
  const st = gameState.countryStatus[i]
  if(!st || st.control < 20) return
  let prob = BASE_EXPANSION_PROBABILITY * (1 + (st.esbirros / st.popReal)) * gameState.expansionProbabilityMultiplier
  if(st.control >= 20){
    prob *= 1
  }
  if(st.control >= 50){
    prob *= 3
  }
  if(st.control >= 90){
    prob *= 5
  }
  if(st.control === 100) prob *= 0.05
  prob *= gameState.startingCountryExpansionMultiplier
  const dominatedCount = Object.keys(gameState.countryStatus).filter(k => gameState.countryStatus[k].dominated || gameState.countryStatus[k].control>=50).length
  const penaltyFactor = 1 + (Math.max(0, dominatedCount-2) * EXPANSION_DIFFICULTY_FACTOR)
  prob /= penaltyFactor
  if(prob < 0.0005) prob = 0.0005
  if(prob > 0.1) prob = 0.1
  if(Math.random() < prob){
    const exp = Math.random() < 0.7 ? 1 : 2
    let possible = getNeighbors(i).filter(x => !gameState.countryStatus[x])
    possible.sort(() => Math.random() - 0.5)
    const n = Math.min(exp, possible.length)
    for(let k=0; k<n; k++){
      const newIso = possible[k]
      const nf = countriesData.features.find(ff => ff.id===newIso)
      if(nf){
        gameState.countryStatus[newIso] = {
          countryName: nf.properties.name || newIso,
          popReal: nf.properties.population || 0,
          control: 0,
          dominated: false,
          arrestedTotal: 0,
          esbirros: 1
        }
        addNotification(`¡Te has expandido a ${nf.properties.name || newIso}!`,"expansion")
        increaseStarsWithResistance(BASE_TENSION_EXPANSION)
        animateExpansion(newIso)
        renderWorldList()
      }
    }
  }
}
function animateExpansion(i){
  if(!geojsonLayer) return
  geojsonLayer.eachLayer(l => {
    if(l.feature?.id !== i) return
    const orig = { color:"#555", weight:1, fillColor:"#FF0000", fillOpacity:0.2 }
    const anim = { color:"#555", weight:2, fillColor:"#800080", fillOpacity:0.7 }
    l.setStyle(anim)
    const b = l.getBounds()
    const c = b.getCenter()
    const circle = L.circleMarker(c, { radius:10, color:"white", weight:3, fillOpacity:0 }).addTo(map)
    let r = 10
    const interval = setInterval(() => {
      r += EXPANSION_ANIMATION_CIRCLE_RADIUS_INCREMENT
      circle.setRadius(r)
      circle.setStyle({ opacity: Math.max(0, 1 - r/EXPANSION_ANIMATION_CIRCLE_MAX_RADIUS) })
      if(r >= EXPANSION_ANIMATION_CIRCLE_MAX_RADIUS){
        clearInterval(interval)
        map.removeLayer(circle)
      }
    }, EXPANSION_ANIMATION_INTERVAL_MS)
    setTimeout(() => {
      l.setStyle(orig)
      refreshGeoStyle()
    }, ANIMATION_DURATION)
  })
}
function renderWorldList(){
  countryListElement.innerHTML = ""
  const arr = Object.keys(gameState.countryStatus)
  arr.forEach(iso => {
    const st = gameState.countryStatus[iso]
    const li = document.createElement("li")
    const icon = st.dominated ? '<i class="fas fa-check-circle country-conquered"></i>' : (st.control>=50 ? '<i class="fas fa-flag country-expanding"></i>' : "")
    li.innerHTML = `${st.countryName || iso} ${icon}`
    li.addEventListener("click", () => {
      showCountryDetail(iso)
      geojsonLayer.eachLayer(ly => {
        if(ly instanceof L.GeoJSON){
          ly.eachLayer(featLy => {
            if(featLy.feature.id === iso){
              map.fitBounds(featLy.getBounds())
            }
          })
        }
      })
    })
    const rescueUpgrade = weaponsUpgrades.find(upg => upg.id === "military-boost-6")
    if (rescueUpgrade && rescueUpgrade.times > 0) {
      const rescueButton = document.createElement("button")
      rescueButton.textContent = "Rescatar Esbirros"
      rescueButton.classList.add("rescue-button")
      rescueButton.addEventListener("click", (e) => {
        e.stopPropagation()
        if (!gameState.rescueMinionsActive && st.arrestedTotal > 0) {
          attemptRescueMinions(iso)
        } else if (gameState.rescueMinionsActive) {
          addNotification("Rescate en curso, espera.", "general")
        } else if (st.arrestedTotal <= 0) {
          addNotification("No hay esbirros arrestados aquí.", "general")
        }
      })
      li.appendChild(rescueButton)
    }
    countryListElement.appendChild(li)
  })
  if(gameState.currentIso) showCountryDetail(gameState.currentIso)
}
function showCountryDetail(i){
  gameState.currentIso = i
  const st = gameState.countryStatus[i]
  if(!st) return
  detailCountryNameElement.innerText = st.countryName || i
  detailPopulationElement.innerText = formatNumber(st.popReal || 0)
  detailEsbirrosElement.innerText = formatNumber(st.esbirros || 0)
  detailArrestedElement.innerText = formatNumber(st.arrestedTotal || 0)
  refreshGeoStyle()
  renderStats()
}
function startGame(){
  if(!gameState.currentUser) return
  renderStats()
  renderUpgrades()
  renderAbilities()
  renderWorldList()
  refreshGeoStyle()
  updatePerSecondStats()
  if(!gameState.gameActive){
    gameState.gameActive = true
    startNewsGeneration()
  } else if(!gameState.firstSession){
    startNewsGeneration()
  }
}
function spawnIcon(iconType, icon, iso){
  if(!iconsEnabled) return
  if(iconType==="money" && !moneyIconsEnabled) return
  if(iconType==="esbirros" && !esbirrosIconsEnabled) return
  if(iconType==="police" && !policeIconsEnabled) return
  if(!iso || !geojsonLayer) return
  let tLayer
  geojsonLayer.eachLayer(l => {
    if(l.feature?.id === iso) tLayer = l
  })
  if(!tLayer) return
  const b = tLayer.getBounds()
  const sw = b.getSouthWest()
  const ne = b.getNorthEast()
  const lngSpan = ne.lng - sw.lng
  const latSpan = ne.lat - sw.lat
  let tries = 50
  while(tries>0){
    const rLng = sw.lng + lngSpan*Math.random()
    const rLat = sw.lat + latSpan*Math.random()
    const p = L.latLng([rLat, rLng])
    if(b.contains(p)){
      const mk = L.marker(p, { icon })
      const ibp = map.latLngToContainerPoint(p).add([0, icon.options.iconAnchor[1] - icon.options.popupAnchor[1]])
      const bLatLng = map.containerPointToLatLng(ibp)
      if(b.contains(bLatLng)){
        mk.on("click", () => {
          if(iconType==="money"){
            const mg = gameState.moneyPerSecond * 10
            gameState.playerMoney += mg
            createCenterPopupAnimation(`+$${formatNumber(mg)}`,"money")
            createAnimation(bannerMoneyElement, mg, "money")
            renderStats()
            saveGame()
            generateMoneyNews({bandName: gameState.bandName, leaderName: gameState.leaderName}, gameState.countryStatus[iso]?.countryName||iso)
            .then(n => showNewsPopup(n, "¡Hallazgo inesperado!"))
          } else if(iconType==="esbirros"){
            const st = gameState.countryStatus[iso]
            if(st){
              let maxEsbirros = st.popReal - st.arrestedTotal
              if (maxEsbirros < 0) maxEsbirros = 0
              let currentEsbirros = st.esbirros || 0;
              if (currentEsbirros >= maxEsbirros) {
                return;
              }
              // eG depende de esbirrosPerSecond que antes siempre era 0:
              let eG = Math.floor(gameState.esbirrosPerSecond * 100) // MODIFICADO A * 100 PARA DAR X100
              let canAdd = Math.max(0, maxEsbirros - currentEsbirros); // DEFINICIÓN DE canAdd
              if(eG > canAdd) eG = canAdd
              if(eG > 0){
                st.esbirros = currentEsbirros + eG
                createCenterPopupAnimation(`+${formatNumber(eG)} esbirros`,"esbirros")
                createAnimation(bannerEsbirrosElement, eG, "esbirros")
                renderStats()
                renderWorldList()
                saveGame()
                generateEsbirrosNews({bandName:gameState.bandName,leaderName:gameState.leaderName}, st.countryName||iso)
                .then(n => showNewsPopup(n, "¡Reclutamiento sorpresa!"))
              }
            }
          } else if(iconType==="police"){
            if(gameState.policeStars>0){
              recalcPoliceStarsFromValue(gameState.policeStars - 1)
              createCenterPopupAnimation("-1 Estrella", "police")
              renderStats()
              saveGame()
              generatePoliceNews({bandName:gameState.bandName,leaderName:gameState.leaderName}, gameState.countryStatus[iso]?.countryName||iso)
              .then(n => showNewsPopup(n, "¡Relajación Policial!"))
            }
          }
          map.removeLayer(mk)
          activeIcons = activeIcons.filter(m => m!==mk)
        })
        mk.addTo(map)
        activeIcons.push(mk)
        return
      }
    }
    tries--
  }
}
function spawnRandomIcons(){
  if(!iconsEnabled) return
  if(!gameState.gameActive || !gameState.bandName || !countriesData) return
  const cIso = Object.keys(gameState.countryStatus).filter(i => gameState.countryStatus[i].control>=0)
  const now = Date.now()
  if(now - lastMoneySpawn >= MONEY_ICON_SPAWN_INTERVAL && moneyIconsEnabled && cIso.length){
    const rM = cIso[Math.floor(Math.random()*cIso.length)]
    spawnIcon("money", moneyIcon, rM)
    lastMoneySpawn = now
  }
  const dominated = cIso.filter(i => {
    return gameState.countryStatus[i].dominated && esbirrosIconsEnabled && (gameState.countryStatus[i].esbirros||0) > (gameState.countryStatus[i].arrestedTotal||0)
  })
  if(now - lastEsbirrosSpawn >= ESBIRROS_ICON_SPAWN_INTERVAL && esbirrosIconsEnabled){
    const countriesWithEsbirros = dominated.filter(iso => gameState.countryStatus[iso].esbirros > 0)
    if(countriesWithEsbirros.length){
      const rE = countriesWithEsbirros[Math.floor(Math.random()*countriesWithEsbirros.length)]
      spawnIcon("esbirros", esbirrosIcon, rE)
      lastEsbirrosSpawn = now
    }
  }
  if(gameState.policeStars>0 && now - lastPoliceSpawn >= POLICE_ICON_SPAWN_INTERVAL && policeIconsEnabled && cIso.length){
    const rP = cIso[Math.floor(Math.random()*cIso.length)]
    const st = gameState.countryStatus[rP]
    if(!st || (st.arrestedTotal||0) <= (st.esbirros||0)){
      spawnIcon("police", policeIcon, rP)
      lastPoliceSpawn = now
    }
  }
}
function checkGameOver(){
  const allCountries = countriesData.features.map(f => f.id)
  const controlledCountries = Object.keys(gameState.countryStatus).filter(iso => gameState.countryStatus[iso].dominated)
  const allCountriesControlled = allCountries.length === controlledCountries.length
  if(allCountriesControlled){
    addNotification("¡Has dominado el mundo entero! Fin del juego.","gameResult")
    return true
  }
  let totalPopulation = 0
  let arrestedPopulation = 0
  for(const iso in gameState.countryStatus){
    const st = gameState.countryStatus[iso]
    const pop = st.popReal || 0
    totalPopulation += pop
    if((st.arrestedTotal / pop) * 100 >= 100 && pop>0){
      arrestedPopulation += pop
    }
  }
  if((arrestedPopulation / totalPopulation) * 100 >= POPULATION_CONTROL_GAME_OVER_THRESHOLD && totalPopulation>0){
    addNotification("¡GAME OVER! La policía domina el 51% de la población mundial.","gameResult")
    return true
  }
  return false
}
setInterval(() => {
  if(!gameState.gameActive || !gameState.bandName || !countriesData) return
  if(gameState.reconquestEvent){
    handleReconquestEvent()
  }
  triggerPoliceActions()
  let newArrestsGlobal = 0
  let totalWorldPopulation = 0
  let totalEsbirrosInGame = 0
  for(const iso in gameState.countryStatus){
    const st = gameState.countryStatus[iso]
    const oldE = st.esbirros || 0
    const eGain = (gameState.totalEsbirrosUpgrades * gameState.esbirrosPerTickMultiplier * (1 + gameState.esbirrosMultiplierPercentage)) / 5
    const dominatedCount = Object.keys(gameState.countryStatus).filter(k => gameState.countryStatus[k].dominated).length
    let arrestRate = 0.01 * Math.max(0, gameState.policeStars - gameState.policeResistance)
    if(gameState.policeStars >= 3) arrestRate *= 1.5
    if(gameState.policeStars >= 5) arrestRate *= 2.5
    if(st.control < 20){
      arrestRate *= 0.05
    } else if(st.control < 50){
      arrestRate *= 0.25
    } else if(st.control < 80){
      arrestRate *= 0.6
    } else {
      arrestRate *= 0.8
    }
    const arrests = Math.floor(oldE * arrestRate * (1 + dominatedCount * ARRESTS_COUNTRY_INCREASE))
    let newEsb = oldE + eGain - arrests
    const pop = st.popReal || 0
    totalWorldPopulation += pop
    let maxEsbirrosInCountry = Math.max(0, pop - (st.arrestedTotal || 0))
    newEsb = Math.min(newEsb, maxEsbirrosInCountry)
    if(isNaN(newEsb) || !isFinite(newEsb)) newEsb = 0
    if(newEsb < 0) newEsb = 0
    newArrestsGlobal += arrests
    st.esbirros = newEsb
    st.arrestedTotal = Math.min((st.arrestedTotal || 0) + arrests, pop)
    st.control = pop>0 ? Math.min(100, (st.esbirros/pop)*100) : 0
    if(iso === gameState.startCountry && st.control>=50){
      gameState.startingCountryExpansionMultiplier = 2
    } else if(iso === gameState.startCountry){
      gameState.startingCountryExpansionMultiplier = 1
    }
    if(st.control >= 100 && !st.dominated){
      st.dominated = true
      addNotification("¡Has dominado","countryConquered", st.countryName)
    }
    totalEsbirrosInGame += (st.esbirros || 0)
  }
  gameState.totalArrested += newArrestsGlobal
  gameState.lastArrestIncrement = newArrestsGlobal
  gameState.arrestedPerSecond = gameState.lastArrestIncrement / 5
  gameState.moneyPerSecond = Math.max(0, gameState.totalMoneyUpgradesSec)
  gameState.playerMoney += gameState.moneyPerSecond
  if(checkGameOver()){
    gameState.gameActive = false
    stopNewsGeneration()
    saveGame()
    return
  }
  if(totalEsbirrosInGame <= 0){
    addNotification("¡GAME OVER! Todos tus esbirros han sido arrestados.","gameResult")
    gameState.gameActive = false
    stopNewsGeneration()
    saveGame()
    return
  }
  updatePerSecondStats()
  refreshGeoStyle()
  renderStats()
  renderWorldList()
  Object.keys(gameState.countryStatus).forEach(expandFromCountry)
  spawnRandomIcons()
  renderStats()
  saveGame()
}, 200)
function generateNewsUpdate(){}
function startNewsGeneration(){
  if(!newsInterval){
    newsInterval = setInterval(generateNewsUpdate, 300000)
  }
}
function stopNewsGeneration(){
  if(newsInterval){
    clearInterval(newsInterval)
    newsInterval = null
  }
}
function showNewsPopup(txt, ttl="Última hora", m="default"){
  newsPopupTitle.innerHTML = ttl
  newsPopupTitle.classList.toggle("welcome-title", m==="welcome")
  newsPopupElement.classList.toggle("welcome-popup", m==="welcome")
  newsPopupDescription.innerHTML = txt
  newsPopupElement.classList.remove("hidden")
  newsOverlay.classList.remove("hidden")
  stopNewsGeneration()
}
function closeNewsPopup(){
  newsPopupElement.classList.add("hidden")
  newsOverlay.classList.add("hidden")
  startNewsGeneration()
}
closeNewsButton.addEventListener("click", closeNewsPopup)
newsOverlay.addEventListener("click", closeNewsPopup)
leaderCards.forEach(c => {
  c.addEventListener("click", () => {
    leaderCards.forEach(x => x.classList.remove("selected"))
    c.classList.add("selected")
  })
})
tabButtons.forEach(btn => {
  btn.addEventListener("click", e => {
    const tId = e.target.dataset.tab || e.target.parentElement.dataset.tab
    tabContents.forEach(cc => cc.classList.remove("active"))
    tabButtons.forEach(b => b.classList.remove("active"))
    document.getElementById(tId).classList.add("active")
    btn.classList.add("active")
    if(tId === "world") renderWorldList()
    renderUpgrades()
  })
})
gameTitles.forEach(tl => {
  tl.addEventListener("click", () => {
    tl.parentElement.classList.toggle("collapsed")
    tl.querySelector("i.fas")?.classList.toggle("fa-chevron-down")
    tl.querySelector("i.fas")?.classList.toggle("fa-chevron-up")
  })
})
countryProgressModalCloseButton.addEventListener("click", () => {
  countryProgressModal.classList.remove("active")
})
function setMenuIcon(){
  const ic = menuToggleButton.querySelector("i")
  const portr = window.innerWidth<=768 && window.innerHeight>window.innerWidth
  const active = sidebar.classList.contains("active")
  if(portr){
    ic.className = `fas fa-chevron-${active?"down":"up"}`
  } else {
    ic.className = `fas fa-chevron-${active?"right":"left"}`
  }
}
function adjustMenuToggleButton(){
  const p = window.innerWidth<=768 && window.innerHeight>window.innerWidth
  sidebar.classList.toggle("portrait", p)
  Object.assign(menuToggleButton.style,
    p
    ? { top:"auto", bottom:"20px", left:"50%", right:"auto", transform:"translateX(-50%)" }
    : { bottom:"auto", top:"50%", right:"0", left:"auto", transform:"translateY(-50%)" }
  )
  setMenuIcon()
}
window.addEventListener("load", adjustMenuToggleButton)
window.addEventListener("resize", adjustMenuToggleButton)
window.addEventListener("orientationchange", adjustMenuToggleButton)
menuToggleButton.addEventListener("click", () => {
  sidebar.classList.toggle("active")
  setMenuIcon()
})
fetch("./data/countriesWithPopulation.geo.json")
.then(r => r.json())
.then(d => {
  countriesData = d
  geojsonLayer = L.geoJSON(d, {
    style: () => ({ color:"#555", weight:1, fillColor:"#f0f0f0", fillOpacity:0.2 }),
    onEachFeature: (f,l) => l.on({
      click: onCountryClick,
      mouseover: onCountryMouseOver,
      mouseout: onCountryMouseOut
    })
  }).addTo(map)
  d.features.forEach(f => {
    const opt = document.createElement("option")
    opt.value = f.id
    opt.textContent = f.properties.name
    startCountrySelect.appendChild(opt)
  })
  initializeAuth(handleAuthStateChanged)
})
.catch(() => {})