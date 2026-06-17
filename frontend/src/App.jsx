import { useEffect, useRef, useState, useMemo } from "react"

function App() {
  const [started, setStarted] = useState(false)

  
  const sentences = useMemo(() => [
    "Each point is a life. Not a number.",
    "Behind every dot, a human story.",
    "You are not seeing dots. You are seeing lives.",
    "Every light represents a memory.",
    "A life once lived, now remembered.",
    "Look closer. It’s a soul, not a stat.",
    "Every pixel holds a pulse."
  ], [])

  const [text, setText] = useState(sentences[0])
  const [visible, setVisible] = useState(true)

  
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 }) 
  const hoveredPersonRef = useRef(null)
  const cameraRef = useRef({ x: 0, y: 0 })

  
  const [people, setPeople] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [minAge, setMinAge] = useState(0)
  const [maxAge, setMaxAge] = useState(110)
  const [genderFilter, setGenderFilter] = useState("all")

  
  const [hoveredPerson, setHoveredPerson] = useState(null)
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 })
  const [soundEnabled, setSoundEnabled] = useState(false) 

  
  useEffect(() => {
    fetch("/killed-in-gaza-v3.json")
      .then((res) => res.json())
      .then((rawData) => {
        const realPeopleRows = rawData.slice(1)

        const mappedPeople = realPeopleRows.map((row, index) => {
          const angle = Math.random() * Math.PI * 2
          const radius = Math.sqrt(Math.random()) * 900 

          return {
            id: row[0] || index,
            name: row[1],
            arabicName: row[2],
            age: row[3] !== undefined ? row[3] : "Unknown",
            gender: row[5] === "m" ? "Male" : "Female",
            story: "A soul that had dreams, a family, and a life full of hope, brutally taken away. Never forgotten.",
            x: window.innerWidth / 2 + Math.cos(angle) * radius,
            y: window.innerHeight / 2 + Math.sin(angle) * radius,
          }
        })

        setPeople(mappedPeople) 
      })
      .catch((err) => console.error("Error loading dataset:", err))
  }, [])

  
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current  = new Audio("/audio.mp3")
      audioRef.current.loop = true
      audioRef.current.volume = 0.25 
    }
    if (soundEnabled && started) {
      audioRef.current.play().catch((err) => console.log("Audio waiting...", err))
    } else {
      audioRef.current.pause()
    }
  }, [soundEnabled, started])

  
  const filteredPeople = useMemo(() => {
    return people.filter(p =>
      p.age >= minAge &&
      p.age <= maxAge &&
      (genderFilter === "all" || p.gender === genderFilter)
    )
  }, [people, minAge, maxAge, genderFilter])

  
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSelectedPerson(null)
      return
    }
    const found = people.find(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setSelectedPerson(found || null)
  }, [searchTerm, people])

  
  useEffect(() => {
    if (!started) return 
    let last = text
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        let next
        do {
          next = sentences[Math.floor(Math.random() * sentences.length)]
        } while (next === last)
        last = next
        setText(next)
        setVisible(true)
      }, 400)
    }, 4500)
    return () => clearInterval(interval)
  }, [sentences, text, started])

  
  useEffect(() => {
    if (!started) return

    let animationId
    const canvas = canvasRef.current

    const tick = () => {
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      const scale = window.devicePixelRatio || 1

      if (canvas.width !== window.innerWidth * scale || canvas.height !== window.innerHeight * scale) {
        canvas.width = window.innerWidth * scale
        canvas.height = window.innerHeight * scale
        canvas.style.width = `${window.innerWidth}px`
        canvas.style.height = `${window.innerHeight}px`
      }

      const targetX = selectedPerson ? window.innerWidth / 2 - selectedPerson.x : 0
      const targetY = selectedPerson ? window.innerHeight / 2 - selectedPerson.y : 0

      cameraRef.current.x += (targetX - cameraRef.current.x) * 0.08
      cameraRef.current.y += (targetY - cameraRef.current.y) * 0.08

      const camX = cameraRef.current.x
      const camY = cameraRef.current.y

      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.scale(scale, scale)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      let found = null

      filteredPeople.forEach(person => {
        const px = person.x + camX
        const py = person.y + camY
        const dx = mx - px
        const dy = my - py
        if (dx * dx + dy * dy < 49) { 
          found = person
        }
      })

      if (found?.id !== hoveredPersonRef.current?.id) {
        hoveredPersonRef.current = found
        setHoveredPerson(found)
      }
      if (found) {
        setCardPosition({ x: mx, y: my })
      }

      const activePerson = selectedPerson || found

      
      filteredPeople.forEach(person => {
        const px = person.x + camX
        const py = person.y + camY

        const isSelected = selectedPerson?.id === person.id
        const isHovered = found?.id === person.id

        ctx.beginPath()
        
        let radius = 1.2
        if (isSelected) radius = 2.5
        else if (isHovered) radius = 1.8

        ctx.arc(px, py, radius, 0, Math.PI * 2)

        
        if (isSelected) {
          ctx.fillStyle = "#ff5252" 
        } else if (isHovered) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)" 
        } else if (activePerson) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)" 
        } else if (searchTerm) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.65)" 
        }
        
        ctx.fill()
      })

      ctx.restore()
      animationId = requestAnimationFrame(tick)
    }

    animationId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationId)
  }, [filteredPeople, selectedPerson, searchTerm, started])

  const handleMouseMove = (e) => {
    if (!started) return
    const rect = canvasRef.current.getBoundingClientRect()
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleCanvasClick = () => {
    if (!started) return
    if (hoveredPersonRef.current) {
      setSelectedPerson(hoveredPersonRef.current)
    } else {
      setSelectedPerson(null)
      setSearchTerm("")
    }
  }

  const handleEnterSite = (enableSound) => {
    setSoundEnabled(enableSound)
    setStarted(true)
  }

  
  return (
    <div className="app" style={{ backgroundColor: "black", minHeight: "100vh", overflow: "hidden", position: "relative" }}>
      
      
      {!started && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "#050505", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
          zIndex: 10000, color: "white", fontFamily: "monospace"
        }}>
          <h1 style={{ fontSize: "24px", letterSpacing: "2px", marginBottom: "15px", color: "#dfb15b" }}>I'M NOT A NUMBER</h1>
          <p style={{ color: "#666", fontSize: "13px", marginBottom: "40px", maxWidth: "450px", textAlign: "center", lineHeight: "1.6", padding: "0 20px" }}>
            This is a digital memorial for those we lost. Behind every dot lies a lived experience, a family, and a story. Please choose how you wish to enter.
          </p>
          <div style={{ display: "flex", gap: "15px" }}>
            <button onClick={() => handleEnterSite(true)} style={{ background: "none", border: "1px solid #dfb15b", color: "#dfb15b", padding: "12px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>🔊 ENTER WITH SOUND</button>
            <button onClick={() => handleEnterSite(false)} style={{ background: "none", border: "1px solid #444", color: "#888", padding: "12px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>🔇 ENTER SILENTLY</button>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      {started && (
        <div className="controls" style={{ position: "absolute", top: 20, left: 20, zIndex: 10, display: "flex", gap: "10px" }}>
          <input
            placeholder="Search name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: "8px", borderRadius: "4px", fontFamily: "monospace" }}
          />
          <input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(Number(e.target.value))}
            placeholder="Min age"
            style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: "8px", borderRadius: "4px", width: "80px", fontFamily: "monospace" }}
          />
          <input
            type="number"
            value={maxAge}
            onChange={(e) => setMaxAge(Number(e.target.value))}
            placeholder="Max age"
            style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: "8px", borderRadius: "4px", width: "80px", fontFamily: "monospace" }}
          />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: "8px", borderRadius: "4px", fontFamily: "monospace" }}
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {(selectedPerson || searchTerm) && (
            <button 
              onClick={() => { setSearchTerm(""); setSelectedPerson(null); }}
              style={{ background: "#222", color: "#aaa", border: "none", padding: "8px 12px", cursor: "pointer", borderRadius: "4px", fontFamily: "monospace" }}
            >
              Reset View
            </button>
          )}
        </div>
      )}

      
      {started && (
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            position: "absolute", top: "20px", right: "20px", zIndex: 10,
            background: soundEnabled ? "rgba(223, 177, 91, 0.1)" : "#111",
            color: soundEnabled ? "#dfb15b" : "#666",
            border: soundEnabled ? "1px solid #dfb15b" : "1px solid #333",
            padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontFamily: "monospace", fontSize: "12px"
          }}
        >
          {soundEnabled ? "🔊 SOUND: ON" : "🔇 SOUND: MUTED"}
        </button>
      )}

      
      <canvas 
        ref={canvasRef} 
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        style={{ display: "block", cursor: hoveredPerson ? "pointer" : "default" }}
      />

      {/* CAPTION */}
      {started && (
        <div className={`caption ${visible ? "show" : "hide"}`} style={{
          position: "absolute", bottom: "50px", left: "50%", transform: "translateX(-50%)",
          color: "#dfb15b", fontFamily: "monospace", fontSize: "16px", fontWeight: "500",
          letterSpacing: "0.5px", textAlign: "center", textShadow: "0px 2px 8px #000",
          transition: "opacity 0.4s ease-in-out", opacity: visible ? 1 : 0, pointerEvents: "none", zIndex: 20
        }}>
          {text}
        </div>
      )}

      {/* HOVER CARD */}
      {started && hoveredPerson && (
        <div className="card" style={{
          position: "absolute", top: cardPosition.y - 120, left: cardPosition.x + 20,
          background: "rgba(15, 15, 15, 0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          color: "white", padding: "14px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)",
          pointerEvents: "none", zIndex: 9999, fontFamily: "monospace", boxShadow: "0 10px 30px rgba(0,0,0,0.7)"
        }}>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "600", letterSpacing: "0.5px" }}>{hoveredPerson.name}</h3>
          {hoveredPerson.arabicName && <p style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#dfb15b", direction: "rtl", fontFamily: "sans-serif" }}>{hoveredPerson.arabicName}</p>}
          <div style={{ display: "flex", gap: "15px", fontSize: "11px", color: "#888", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "6px" }}>
            <span>Age: <strong style={{ color: "#bbb" }}>{hoveredPerson.age}</strong></span>
            <span>Gender: <strong style={{ color: "#bbb" }}>{hoveredPerson.gender}</strong></span>
          </div>
        </div>
      )}

    </div>
  )
}

export default App