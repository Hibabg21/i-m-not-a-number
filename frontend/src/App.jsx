import { useEffect, useRef, useState, useMemo } from "react"


const C = {
  bg:       "#070709",
  surface:  "#0f0f13",
  border:   "#1e1e26",
  borderHi: "#2e2e3a",
  amber:    "#dfb15b",
  amberDim: "rgba(223,177,91,0.15)",
  amberFg:  "#f5c96a",
  white:    "#f0f0f0",
  muted:    "#6b6b7a",
  mutedLo:  "#3a3a46",
  red:      "#ff5252",
  rowHover: "rgba(255,255,255,0.04)",
  rowSel:   "rgba(223,177,91,0.10)",
  /* couleur des points de search*/
  hit:      "#a98bd1",
  hitGlow:  "rgba(169,139,209,0.10)",
}

const FONT_MONO = "'JetBrains Mono', 'Fira Mono', 'Courier New', monospace"
const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"


const pill = (label, color = C.muted) => (
  <span style={{
    display: "inline-block", padding: "1px 7px", borderRadius: "20px",
    border: `1px solid ${color}`, color, fontSize: "10px",
    fontFamily: FONT_MONO, letterSpacing: "0.04em", lineHeight: "18px"
  }}>{label}</span>
)

function App() {
  const [started, setStarted] = useState(false)

  const sentences = useMemo(() => [
    "Each point is a life. Not a number.",
    "Behind every dot, a human story.",
    "You are not seeing dots. You are seeing lives.",
    "Every light represents a memory.",
    "A life once lived, now remembered.",
    "Look closer. It's a soul, not a stat.",
    "Every pixel holds a pulse."
  ], [])

  const [text, setText] = useState(sentences[0])
  const [visible, setVisible] = useState(true)

  const canvasRef   = useRef(null)
  const audioRef    = useRef(null)
  const mouseRef    = useRef({ x: 0, y: 0 })
  const hoveredPersonRef = useRef(null)
  const cameraRef   = useRef({ x: 0, y: 0 })
  const overUIRef   = useRef(false)
  const searchRef   = useRef(null)

  const [people,        setPeople]        = useState([])
  const [searchTerm,    setSearchTerm]    = useState("")
  const [selectedPerson,setSelectedPerson]= useState(null)
  const [minAge,        setMinAge]        = useState(0)
  const [maxAge,        setMaxAge]        = useState(110)
  const [genderFilter,  setGenderFilter]  = useState("all")
  const [hoveredPerson, setHoveredPerson] = useState(null)
  const [cardPosition,  setCardPosition]  = useState({ x: 0, y: 0 })
  const [soundEnabled,  setSoundEnabled]  = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [searched,      setSearched]      = useState(false) 

  
  useEffect(() => {
    fetch("/killed-in-gaza-v3.json")
      .then(r => r.json())
      .then(rawData => {
        const rows = rawData.slice(1)
        setPeople(rows.map((row, i) => {
          const angle  = Math.random() * Math.PI * 2
          const radius = Math.sqrt(Math.random()) * 900
          return {
            id: row[0] || i,
            name: row[1], arabicName: row[2],
            age: row[3] !== undefined ? row[3] : "Unknown",
            gender: row[5] === "m" ? "Male" : "Female",
            x: window.innerWidth  / 2 + Math.cos(angle) * radius,
            y: window.innerHeight / 2 + Math.sin(angle) * radius,
          }
        }))
      })
      .catch(console.error)
  }, [])

  
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio.mp3")
      audioRef.current.loop   = true
      audioRef.current.volume = 0.25
    }
    soundEnabled && started
      ? audioRef.current.play().catch(() => {})
      : audioRef.current.pause()
  }, [soundEnabled, started])

  
  const filteredPeople = useMemo(() =>
    people.filter(p =>
      p.age >= minAge && p.age <= maxAge &&
      (genderFilter === "all" || p.gender === genderFilter)
    ), [people, minAge, maxAge, genderFilter])

  
  const triggerSearch = () => {
    const term = searchTerm.trim().toLowerCase()
    setSearched(true)
    if (!term) { setSearchResults([]); setSearchOpen(false); setSelectedPerson(null); return }
    const matches = people.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.arabicName?.toLowerCase().includes(term)
    )
    setSearchResults(matches)
    setSearchOpen(matches.length > 0)
  }

  
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]); setSearchOpen(false)
      setSelectedPerson(null); setSearched(false)
    }
  }, [searchTerm])

  
  useEffect(() => {
    const fn = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  const handleSelectResult = person => {
    setSelectedPerson(person); setSearchTerm(person.name); setSearchOpen(false)
  }

  
  useEffect(() => {
    if (!started) return
    let last = text
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        let next
        do { next = sentences[Math.floor(Math.random() * sentences.length)] } while (next === last)
        last = next; setText(next); setVisible(true)
      }, 400)
    }, 4500)
    return () => clearInterval(iv)
  }, [sentences, text, started])

  
  useEffect(() => {
    if (!started) return
    let animId
    const canvas = canvasRef.current
    const tick = () => {
      if (!canvas) return
      const ctx   = canvas.getContext("2d")
      const scale = window.devicePixelRatio || 1
      if (canvas.width !== window.innerWidth * scale || canvas.height !== window.innerHeight * scale) {
        canvas.width  = window.innerWidth  * scale
        canvas.height = window.innerHeight * scale
        canvas.style.width  = `${window.innerWidth}px`
        canvas.style.height = `${window.innerHeight}px`
      }
      const tX = selectedPerson ? window.innerWidth  / 2 - selectedPerson.x : 0
      const tY = selectedPerson ? window.innerHeight / 2 - selectedPerson.y : 0
      cameraRef.current.x += (tX - cameraRef.current.x) * 0.08
      cameraRef.current.y += (tY - cameraRef.current.y) * 0.08
      const { x: camX, y: camY } = cameraRef.current

      ctx.fillStyle = C.bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.save(); ctx.scale(scale, scale)

      const mx = mouseRef.current.x, my = mouseRef.current.y
      let found = null
      if (!overUIRef.current) {
        filteredPeople.forEach(p => {
          const dx = mx - (p.x + camX), dy = my - (p.y + camY)
          if (dx*dx + dy*dy < 49) found = p
        })
      }
      if (found?.id !== hoveredPersonRef.current?.id) {
        hoveredPersonRef.current = found; setHoveredPerson(found)
      }
      if (found) setCardPosition({ x: mx, y: my })

      const active    = selectedPerson || found
      const resultIds = new Set(searchResults.map(p => p.id))

      filteredPeople.forEach(p => {
        const px = p.x + camX, py = p.y + camY
        const isSel   = selectedPerson?.id === p.id
        const isHov   = found?.id === p.id
        const isMatch = resultIds.has(p.id) && searchResults.length > 0 && !selectedPerson
        ctx.beginPath()
        ctx.arc(px, py, isSel ? 3.5 : isHov ? 2.2 : isMatch ? 2.4 : 1.2, 0, Math.PI*2)
        ctx.fillStyle = isSel  ? C.red
          : isHov  ? "rgba(255,255,255,0.95)"
          : isMatch ? C.hit
          : active || searchResults.length > 0 ? "rgba(255,255,255,0.1)"
          : "rgba(255,255,255,0.62)"
        ctx.fill()

        
        if (isMatch) {
          ctx.beginPath()
          ctx.arc(px, py, 5, 0, Math.PI*2)
          ctx.fillStyle = C.hitGlow
          ctx.fill()
        }
        if (isSel) {
          ctx.beginPath()
          ctx.arc(px, py, 8, 0, Math.PI*2)
          ctx.fillStyle = "rgba(255,82,82,0.12)"
          ctx.fill()
        }
      })

      ctx.restore()
      animId = requestAnimationFrame(tick)
    }
    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [filteredPeople, selectedPerson, searchResults, started])

  const handleRootMouseMove = e => {
    if (!started) return
    mouseRef.current = { x: e.clientX, y: e.clientY }
  }
  const handleRootClick = e => {
    if (!started) return
    const tag = e.target.tagName.toLowerCase()
    if (["input","button","select","option"].includes(tag)) return
    if (e.target.closest(".controls") || e.target.closest("[data-ui]")) return
    if (hoveredPersonRef.current) {
      setSelectedPerson(hoveredPersonRef.current)
    } else {
      setSelectedPerson(null); setSearchTerm("")
      setSearchResults([]); setSearchOpen(false); setSearched(false)
    }
  }

  
  const inputStyle = {
    background: C.surface, color: C.white,
    border: `1px solid ${C.border}`,
    padding: "9px 12px", borderRadius: "6px",
    fontFamily: FONT_MONO, fontSize: "12px", outline: "none",
    transition: "border-color .15s",
  }

  return (
    <div
      className="app"
      style={{ backgroundColor: C.bg, minHeight: "100vh", overflow: "hidden", position: "relative" }}
      onMouseMove={handleRootMouseMove}
      onClick={handleRootClick}
    >
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.surface}; }
        ::-webkit-scrollbar-thumb { background: ${C.borderHi}; border-radius: 4px; }
        input:focus { border-color: ${C.amber} !important; }
        select:focus { border-color: ${C.amber} !important; outline: none; }
      `}</style>

      
      {!started && (
        <div style={{
          position: "absolute", inset: 0,
          background: C.bg,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 10000,
        }}>
          <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "2px", background: C.amber, borderRadius: "2px" }} />
            <h1 style={{ margin: 0, fontFamily: FONT_MONO, fontSize: "22px", letterSpacing: "4px", color: C.amber, fontWeight: 600 }}>
              I'M NOT A NUMBER
            </h1>
            <div style={{ width: "36px", height: "2px", background: C.amber, borderRadius: "2px" }} />
          </div>
          <p style={{
            fontFamily: FONT_SANS, color: C.muted, fontSize: "13px", lineHeight: "1.8",
            maxWidth: "400px", textAlign: "center", marginBottom: "40px", padding: "0 24px"
          }}>
            A digital memorial. Behind every dot lies a lived experience, a family, a story. Navigate with care.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            {[
              { label: "🔊 Enter with sound", sound: true,  style: { border: `1px solid ${C.amber}`, color: C.amber, background: C.amberDim } },
              { label: "🔇 Enter silently",   sound: false, style: { border: `1px solid ${C.border}`, color: C.muted, background: "transparent" } },
            ].map(({ label, sound, style }) => (
              <button key={label} onClick={() => { setSoundEnabled(sound); setStarted(true) }}
                style={{ ...style, padding: "11px 22px", borderRadius: "6px", cursor: "pointer", fontFamily: FONT_MONO, fontSize: "11px", letterSpacing: "0.05em" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      
      <canvas ref={canvasRef} style={{ display: "block", position: "absolute", top: 0, left: 0, pointerEvents: "none" }} />

      
      {started && (
        <div
          className="controls"
          data-ui="true"
          onMouseEnter={() => { overUIRef.current = true }}
          onMouseLeave={() => { overUIRef.current = false }}
          style={{
            position: "absolute", top: 20, left: 20, zIndex: 50,
            display: "flex", gap: "8px", alignItems: "flex-start",
          }}
        >
          
          <div ref={searchRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "6px" }}>

            
            <div style={{ display: "flex" }}>
              <input
                placeholder="Search a name…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") triggerSearch()
                  if (e.key === "Escape") setSearchOpen(false)
                }}
                style={{
                  ...inputStyle,
                  width: "210px",
                  borderRadius: "6px 0 0 6px",
                  borderRight: "none",
                }}
              />
              <button
                onClick={triggerSearch}
                style={{
                  background: C.amber, color: "#0a0a0a",
                  border: "none", padding: "9px 16px",
                  borderRadius: "0 6px 6px 0",
                  cursor: "pointer", fontFamily: FONT_MONO,
                  fontSize: "11px", fontWeight: "700",
                  letterSpacing: "0.08em",
                  transition: "opacity .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                SEARCH
              </button>
            </div>

            
            {searched && (
              <div style={{ fontFamily: FONT_MONO, fontSize: "10px", paddingLeft: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                {searchResults.length > 0 ? (
                  <>
                    <span style={{ color: C.hit }}>●</span>
                    <span style={{ color: C.muted }}>
                      <span style={{ color: C.hit, fontWeight: 600 }}>{searchResults.length}</span>
                      {" "}result{searchResults.length > 1 ? "s" : ""} — click a name to locate
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ color: C.mutedLo }}>○</span>
                    <span style={{ color: C.mutedLo }}>No results for "{searchTerm}"</span>
                  </>
                )}
              </div>
            )}

            
            {searchOpen && searchResults.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 2px)", left: 0,
                width: "340px", maxHeight: "320px", overflowY: "auto",
                background: C.surface,
                border: `1px solid ${C.borderHi}`,
                borderRadius: "8px", zIndex: 9999,
                boxShadow: `0 16px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(223,177,91,0.06)`,
              }}>

                
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px 8px",
                  borderBottom: `1px solid ${C.border}`,
                  position: "sticky", top: 0, background: C.surface, zIndex: 1,
                }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: "10px", color: C.muted, letterSpacing: "0.08em" }}>
                    SHOWING <span style={{ color: C.hit, fontWeight: 600 }}>{searchResults.length}</span> RESULTS
                  </span>
                  <button
                    onMouseDown={() => setSearchOpen(false)}
                    style={{ background: "none", border: "none", color: C.mutedLo, cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "0 2px" }}
                  >✕</button>
                </div>

                
                {searchResults.map((person, i) => (
                  <div
                    key={person.id}
                    onMouseDown={e => { e.preventDefault(); handleSelectResult(person) }}
                    style={{
                      padding: "11px 14px",
                      borderBottom: i < searchResults.length - 1 ? `1px solid ${C.border}` : "none",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      cursor: "pointer",
                      background: selectedPerson?.id === person.id ? C.rowSel : "transparent",
                      transition: "background .1s",
                    }}
                    onMouseEnter={e => { if (selectedPerson?.id !== person.id) e.currentTarget.style.background = C.rowHover }}
                    onMouseLeave={e => { e.currentTarget.style.background = selectedPerson?.id === person.id ? C.rowSel : "transparent" }}
                  >
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: "12px", color: C.white, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                        {person.name}
                      </span>
                      {person.arabicName && (
                        <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: C.hit, direction: "rtl", opacity: 0.85 }}>
                          {person.arabicName}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", flexShrink: 0, marginLeft: "12px" }}>
                      {pill(person.age !== "Unknown" ? `${person.age} y` : "? y", C.mutedLo)}
                      {pill(person.gender === "Male" ? "M" : "F", person.gender === "Male" ? "#4a8fcb" : "#c46fa8")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="number" value={minAge} onChange={e => setMinAge(Number(e.target.value))} placeholder="Min age"
                style={{ ...inputStyle, width: "78px" }} />
              <input type="number" value={maxAge} onChange={e => setMaxAge(Number(e.target.value))} placeholder="Max age"
                style={{ ...inputStyle, width: "78px" }} />
              
  
              <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="all">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <span style={{ fontFamily: FONT_MONO, fontSize: "11px", color: "gold", whiteSpace: "nowrap" }}>
                {filteredPeople.length.toLocaleString()} souls visible
              </span>
            </div>
          </div>

          
          {(selectedPerson || searchResults.length > 0) && (
            <button
              onClick={() => { setSearchTerm(""); setSelectedPerson(null); setSearchResults([]); setSearchOpen(false); setSearched(false) }}
              style={{
                background: "transparent", color: C.muted,
                border: `1px solid ${C.border}`,
                padding: "9px 14px", borderRadius: "6px",
                cursor: "pointer", fontFamily: FONT_MONO, fontSize: "11px",
                transition: "border-color .15s, color .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.amber; e.currentTarget.style.color = C.amber }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
            >
              ↺ Reset
            </button>
          )}
        </div>
      )}

      
      {started && (
        <button
          data-ui="true"
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            position: "absolute", top: 20, right: 20, zIndex: 50,
            background: soundEnabled ? C.amberDim : C.surface,
            color: soundEnabled ? C.amberFg : C.muted,
            border: `1px solid ${soundEnabled ? C.amber : C.border}`,
            padding: "9px 16px", borderRadius: "6px",
            cursor: "pointer", fontFamily: FONT_MONO, fontSize: "11px", letterSpacing: "0.05em",
            transition: "all .15s",
          }}
        >
          {soundEnabled ? "🔊 Sound on" : "🔇 Muted"}
        </button>
      )}

      
      {started && (
        <div style={{
          position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
          color: C.amber, fontFamily: FONT_MONO, fontSize: "14px", fontWeight: 500,
          letterSpacing: "0.04em", textAlign: "center",
          textShadow: `0 2px 16px rgba(0,0,0,0.9)`,
          transition: "opacity .4s ease", opacity: visible ? 1 : 0,
          pointerEvents: "none", zIndex: 20, whiteSpace: "nowrap",
        }}>
          {text}
        </div>
      )}

      
      {started && hoveredPerson && (
        <div style={{
          position: "absolute",
          top:  Math.min(cardPosition.y - 10, window.innerHeight - 130),
          left: cardPosition.x + 18,
          background: C.surface,
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          color: C.white, padding: "12px 16px", borderRadius: "8px",
          border: `1px solid ${C.borderHi}`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(223,177,91,0.05)`,
          pointerEvents: "none", zIndex: 9999, fontFamily: FONT_MONO,
          minWidth: "180px",
        }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: C.white, marginBottom: hoveredPerson.arabicName ? "4px" : "8px", lineHeight: 1.3 }}>
            {hoveredPerson.name}
          </div>
          {hoveredPerson.arabicName && (
            <div style={{ fontSize: "12px", color: C.amber, direction: "rtl", fontFamily: FONT_SANS, marginBottom: "8px", lineHeight: 1.4, opacity: 0.9 }}>
              {hoveredPerson.arabicName}
            </div>
          )}
          <div style={{ display: "flex", gap: "6px", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
            {pill(hoveredPerson.age !== "Unknown" ? `${hoveredPerson.age} y` : "Age ?", C.mutedLo)}
            {pill(hoveredPerson.gender, hoveredPerson.gender === "Male" ? "#4a8fcb" : "#c46fa8")}
          </div>
        </div>
      )}

      
      {started && selectedPerson && (
        <div
          data-ui="true"
          onMouseEnter={() => { overUIRef.current = true }}
          onMouseLeave={() => { overUIRef.current = false }}
          style={{
            position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: C.surface,
            backdropFilter: "blur(20px)",
            border: `1px solid ${C.borderHi}`,
            borderRadius: "10px", padding: "16px 24px",
            boxShadow: `0 24px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(223,177,91,0.08)`,
            zIndex: 200, fontFamily: FONT_MONO,
            display: "flex", alignItems: "center", gap: "24px",
            minWidth: "360px", maxWidth: "560px",
          }}
        >
          
          <div style={{ width: "3px", height: "48px", background: C.amber, borderRadius: "2px", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: C.white, marginBottom: "4px" }}>
              {selectedPerson.name}
            </div>
            {selectedPerson.arabicName && (
              <div style={{ fontSize: "13px", color: C.amber, direction: "rtl", fontFamily: FONT_SANS, marginBottom: "8px", opacity: 0.9 }}>
                {selectedPerson.arabicName}
              </div>
            )}
            <div style={{ display: "flex", gap: "6px" }}>
              {pill(selectedPerson.age !== "Unknown" ? `${selectedPerson.age} y` : "Age ?", C.mutedLo)}
              {pill(selectedPerson.gender, selectedPerson.gender === "Male" ? "#4a8fcb" : "#c46fa8")}
              <span style={{ fontFamily: FONT_MONO, fontSize: "10px", color: C.mutedLo, alignSelf: "center", marginLeft: "4px" }}>
                — click anywhere to close
              </span>
            </div>
          </div>
          <button
            onClick={() => { setSelectedPerson(null); setSearchTerm(""); setSearchResults([]); setSearched(false) }}
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "13px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >✕</button>
        </div>
      )}
    </div>
  )
}

export default App