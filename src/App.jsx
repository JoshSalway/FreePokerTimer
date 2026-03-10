import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const DEFAULT_STRUCTURE = [
  { type: 'level', small: 100, big: 200, ante: 0, duration: 900 },
  { type: 'level', small: 200, big: 400, ante: 0, duration: 900 },
  { type: 'level', small: 300, big: 600, ante: 0, duration: 900 },
  { type: 'level', small: 500, big: 1000, ante: 0, duration: 900 },
  { type: 'break', duration: 1200 },
  { type: 'level', small: 1000, big: 2000, ante: 0, duration: 900 },
  { type: 'level', small: 2000, big: 4000, ante: 0, duration: 900 },
  { type: 'level', small: 3000, big: 6000, ante: 0, duration: 900 },
  { type: 'level', small: 5000, big: 10000, ante: 0, duration: 900 },
  { type: 'level', small: 10000, big: 20000, ante: 0, duration: 900 },
  { type: 'level', small: 15000, big: 30000, ante: 0, duration: 900 },
  { type: 'level', small: 20000, big: 40000, ante: 0, duration: 900 },
  { type: 'level', small: 30000, big: 60000, ante: 0, duration: 900 },
  { type: 'level', small: 50000, big: 100000, ante: 0, duration: 900 },
  { type: 'level', small: 100000, big: 200000, ante: 0, duration: 900 },
  { type: 'level', small: 200000, big: 400000, ante: 0, duration: 900 },
  { type: 'level', small: 500000, big: 1000000, ante: 0, duration: 900 },
]

function fmt(n) {
  if (n >= 1_000_000 && n % 1_000_000 === 0) return `${n / 1_000_000}M`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 10_000 && n % 1_000 === 0) return `${n / 1_000}K`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function parseDuration(str) {
  const trimmed = String(str).trim()
  if (!trimmed) return 600
  const parts = trimmed.split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10)
    const s = parseInt(parts[1], 10)
    if (isNaN(m) || isNaN(s)) return 600
    return Math.max(0, m * 60 + s)
  }
  // Handle plain number input (e.g. "12" → 12:00)
  const n = parseInt(trimmed, 10)
  if (isNaN(n) || n < 0) return 600
  return n * 60
}

function DurationInput({ value, onChange, className }) {
  const [text, setText] = useState(formatTime(value))
  const [lastValue, setLastValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)

  if (value !== lastValue && !isFocused) {
    setText(formatTime(value))
    setLastValue(value)
  }

  const handleBlur = () => {
    setIsFocused(false)
    const secs = parseDuration(text)
    onChange(secs)
    setText(formatTime(secs))
    setLastValue(secs)
  }

  return (
    <input
      type="text"
      value={text}
      onChange={e => setText(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      className={className}
    />
  )
}

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.frequency.value = 800
  oscillator.type = 'sine'
  gain.gain.value = 0.3
  oscillator.start()
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  oscillator.stop(ctx.currentTime + 0.5)
}

function getLevelNumber(structure, index) {
  let num = 0
  for (let i = 0; i <= index; i++) {
    if (structure[i].type === 'level') num++
  }
  return num
}

let nextItemId = 1
function assignIds(items) {
  return items.map(item => item._id ? item : { ...item, _id: nextItemId++ })
}

function CircleTimer({ progress, isWarning, onClick, children }) {
  const radius = 140
  const stroke = 8
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - progress * circumference

  return (
    <div className="circle-timer" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
        <circle
          className="circle-bg"
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeWidth={stroke}
        />
        <circle
          className={`circle-progress ${isWarning ? 'circle-warning' : ''}`}
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
      <div className="circle-content">{children}</div>
    </div>
  )
}

// Snap to the nearest standard poker blind value
const POKER_BLINDS = [
  5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100,
  125, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000,
  1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000,
  12000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 80000, 100000,
  120000, 150000, 200000, 250000, 300000, 400000, 500000, 600000, 750000, 800000, 1000000,
  1200000, 1500000, 2000000, 2500000, 3000000, 4000000, 5000000,
]

function roundBlind(value) {
  if (value <= 0) return POKER_BLINDS[0]
  let closest = POKER_BLINDS[0]
  let minDiff = Math.abs(value - closest)
  for (let i = 1; i < POKER_BLINDS.length; i++) {
    const diff = Math.abs(value - POKER_BLINDS[i])
    if (diff < minDiff) {
      minDiff = diff
      closest = POKER_BLINDS[i]
    }
  }
  return closest
}

function generateStructure({ startSmall, bbMultiplier, increase, levels, duration, breakEvery, breakDuration, includeAnte, anteStart }) {
  const result = []
  let small = startSmall

  // Figure out which levels get breaks
  const breakAfterLevels = new Set()
  const totalTime = levels * duration
  if (breakEvery === 'once') {
    // 1 break after ~1 hour or halfway
    const target = Math.min(3600, totalTime / 2)
    breakAfterLevels.add(Math.max(1, Math.round(target / duration)))
  } else if (breakEvery === 'twice') {
    // 2 breaks: at 1/3 and 2/3
    breakAfterLevels.add(Math.max(1, Math.round(levels / 3)))
    breakAfterLevels.add(Math.max(2, Math.round((levels * 2) / 3)))
  } else if (breakEvery === 'thrice') {
    // 3 breaks: at 1/4, 1/2, 3/4
    breakAfterLevels.add(Math.max(1, Math.round(levels / 4)))
    breakAfterLevels.add(Math.max(2, Math.round(levels / 2)))
    breakAfterLevels.add(Math.max(3, Math.round((levels * 3) / 4)))
  } else if (breakEvery !== 'none') {
    const every = Number(breakEvery)
    for (let l = every; l < levels; l += every) {
      breakAfterLevels.add(l)
    }
  }

  let levelCount = 0
  for (let i = 0; i < levels; i++) {
    levelCount++
    const big = roundBlind(small * bbMultiplier)
    let ante = 0
    if (includeAnte && levelCount >= anteStart) {
      ante = roundBlind(big * 0.1)
    }
    result.push({ type: 'level', small: roundBlind(small), big, ante, duration })
    if (breakAfterLevels.has(levelCount) && i < levels - 1) {
      result.push({ type: 'break', duration: breakDuration })
    }
    small = small * increase
  }
  return result
}

function BlindEditor({ structure, onSave, onClose }) {
  const [items, setItems] = useState(() => assignIds(JSON.parse(JSON.stringify(structure))))
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [gen, setGen] = useState({
    startSmall: 100,
    bbMultiplier: 2,
    increase: 1.5,
    levels: 30,
    duration: 12,
    breakEvery: 'once',
    breakDuration: 20,
    includeAnte: false,
    anteStart: 5,
  })

  const updateGen = (field, value) => {
    setGen(prev => ({ ...prev, [field]: value }))
  }

  const applyGenerator = () => {
    const result = generateStructure({
      ...gen,
      duration: gen.duration * 60,
      breakDuration: gen.breakDuration * 60,
    })
    setItems(assignIds(result))
    setShowGenerator(false)
  }

  const updateItem = (index, field, value) => {
    const updated = [...items]
    if (field === 'duration') {
      updated[index].duration = parseDuration(value)
    } else {
      updated[index][field] = Number(value) || 0
    }
    setItems(updated)
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const addLevel = () => {
    const lastLevel = [...items].reverse().find(i => i.type === 'level')
    setItems([...items, {
      _id: nextItemId++,
      type: 'level',
      small: lastLevel ? lastLevel.big : 100,
      big: lastLevel ? lastLevel.big * 2 : 200,
      ante: 0,
      duration: 600,
    }])
  }

  const addBreak = () => {
    setItems([...items, { _id: nextItemId++, type: 'break', duration: 600 }])
  }


  const handleDragStart = (e, index) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const updated = [...items]
    const [dragged] = updated.splice(dragIndex, 1)
    updated.splice(dropIndex, 0, dragged)
    setItems(updated)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  let levelNum = 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Blind Structure</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {/* Quick Setup Generator */}
          <div className="generator-toggle">
            <button className="btn btn-generator" onClick={() => setShowGenerator(!showGenerator)}>
              {showGenerator ? 'Hide' : 'Quick Setup'}
            </button>
          </div>

          {showGenerator && (
            <div className="generator">
              <div className="gen-grid">
                <label>
                  <span>Starting Small Blind</span>
                  <input type="number" value={gen.startSmall} onChange={e => updateGen('startSmall', Number(e.target.value))} className="gen-input" />
                </label>
                <label>
                  <span>Big Blind Multiplier</span>
                  <select value={gen.bbMultiplier} onChange={e => updateGen('bbMultiplier', Number(e.target.value))} className="gen-input">
                    <option value={2}>2x (Standard)</option>
                    <option value={2.5}>2.5x</option>
                    <option value={3}>3x</option>
                  </select>
                </label>
                <label>
                  <span>Increase Each Round</span>
                  <select value={gen.increase} onChange={e => updateGen('increase', Number(e.target.value))} className="gen-input">
                    <option value={1.25}>1.25x (Slow)</option>
                    <option value={1.5}>1.5x (Standard)</option>
                    <option value={1.75}>1.75x (Fast)</option>
                    <option value={2}>2x (Turbo)</option>
                  </select>
                </label>
                <label>
                  <span>Number of Levels</span>
                  <select value={gen.levels} onChange={e => updateGen('levels', Number(e.target.value))} className="gen-input">
                    {[10, 12, 15, 18, 20, 25, 30].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Level Duration</span>
                  <select value={gen.duration} onChange={e => updateGen('duration', Number(e.target.value))} className="gen-input">
                    {[5, 8, 10, 12, 15, 20, 25, 30].map(n => (
                      <option key={n} value={n}>{n} min</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Break Every</span>
                  <select value={gen.breakEvery} onChange={e => updateGen('breakEvery', e.target.value)} className="gen-input">
                    <option value="none">No Breaks</option>
                    <option value="once">1 Break</option>
                    <option value="twice">2 Breaks</option>
                    <option value="thrice">3 Breaks</option>
                    <option value="4">Every 4 levels</option>
                    <option value="5">Every 5 levels</option>
                    <option value="6">Every 6 levels</option>
                    <option value="7">Every 7 levels</option>
                    <option value="8">Every 8 levels</option>
                  </select>
                </label>
                {gen.breakEvery !== 'none' && (
                  <label>
                    <span>Break Duration</span>
                    <select value={gen.breakDuration} onChange={e => updateGen('breakDuration', Number(e.target.value))} className="gen-input">
                      {[5, 10, 15, 20, 30].map(n => (
                        <option key={n} value={n}>{n} min</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="gen-checkbox">
                  <input type="checkbox" checked={gen.includeAnte} onChange={e => updateGen('includeAnte', e.target.checked)} />
                  <span>Include Antes</span>
                </label>
                {gen.includeAnte && (
                  <label>
                    <span>Antes Start at Level</span>
                    <select value={gen.anteStart} onChange={e => updateGen('anteStart', Number(e.target.value))} className="gen-input">
                      <option value={1}>Level 1 (From start)</option>
                      <option value={3}>Level 3</option>
                      <option value={4}>Level 4</option>
                      <option value={5}>Level 5 (After 1st break)</option>
                      <option value={6}>Level 6</option>
                      <option value={8}>Level 8</option>
                      <option value={10}>Level 10 (Late)</option>
                    </select>
                  </label>
                )}
              </div>
              <button className="btn btn-save gen-apply" onClick={applyGenerator}>Generate Structure</button>
            </div>
          )}

          <table className="editor-table">
            <thead>
              <tr>
                <th></th>
                <th>Level</th>
                <th>Small Blind</th>
                <th>Big Blind</th>
                <th>Ante</th>
                <th>Duration</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const isDragging = dragIndex === i
                const isDragOver = dragOverIndex === i
                if (item.type === 'break') {
                  return (
                    <tr
                      key={item._id}
                      className={`break-row ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                      draggable
                      onDragStart={e => handleDragStart(e, i)}
                      onDragOver={e => handleDragOver(e, i)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                    >
                      <td className="drag-handle">&#9776;</td>
                      <td colSpan={4} className="break-label">Break</td>
                      <td>
                        <DurationInput
                          value={item.duration}
                          onChange={secs => { const u = [...items]; u[i].duration = secs; setItems(u) }}
                          className="editor-input duration-input"
                        />
                      </td>
                      <td>
                        <button className="remove-btn" onClick={() => removeItem(i)}>&times;</button>
                      </td>
                    </tr>
                  )
                }
                levelNum++
                return (
                  <tr
                    key={item._id}
                    className={`${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                  >
                    <td className="drag-handle">&#9776;</td>
                    <td className="level-num">{levelNum}</td>
                    <td>
                      <input
                        type="number"
                        value={item.small}
                        onChange={e => updateItem(i, 'small', e.target.value)}
                        className="editor-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.big}
                        onChange={e => updateItem(i, 'big', e.target.value)}
                        className="editor-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.ante || '-'}
                        onChange={e => updateItem(i, 'ante', e.target.value === '-' ? 0 : e.target.value)}
                        className="editor-input"
                      />
                    </td>
                    <td>
                      <DurationInput
                        value={item.duration}
                        onChange={secs => { const u = [...items]; u[i].duration = secs; setItems(u) }}
                        className="editor-input duration-input"
                      />
                    </td>
                    <td>
                      <button className="remove-btn" onClick={() => removeItem(i)}>&times;</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <div className="add-buttons">
            <button className="btn btn-add" onClick={addLevel}>+ Add New Level</button>
            <button className="btn btn-add" onClick={addBreak}>+ Add Break</button>
          </div>
          <button className="btn btn-save" onClick={() => onSave(items)}>Save</button>
        </div>
      </div>
    </div>
  )
}

const STORAGE_KEY = 'fpt_state'

const _savedState = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    // Validate basic shape
    if (!saved.structure || !Array.isArray(saved.structure) || saved.structure.length === 0) return null
    if (saved.currentIndex >= saved.structure.length) return null
    // Reject corrupted state with blinds beyond max poker blind
    const maxBlind = POKER_BLINDS[POKER_BLINDS.length - 1]
    const current = saved.structure[saved.currentIndex]
    if (current.type === 'level' && (current.small > maxBlind || current.big > maxBlind)) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    // If the timer was running, subtract elapsed wall-clock time
    if (saved.isRunning && saved.savedAt) {
      const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000)
      saved.secondsLeft = Math.max(0, saved.secondsLeft - elapsed)
    }
    // If time ran out during refresh, advance to next level (just one)
    if (saved.isRunning && saved.secondsLeft === 0) {
      if (saved.currentIndex < saved.structure.length - 1) {
        saved.currentIndex += 1
        saved.secondsLeft = saved.structure[saved.currentIndex].duration
      } else {
        // At end of structure, just pause
        saved.isRunning = false
      }
    }
    return saved
  } catch {
    return null
  }
})()

function App() {
  const [structure, setStructure] = useState(_savedState?.structure ?? DEFAULT_STRUCTURE)
  const [currentIndex, setCurrentIndex] = useState(_savedState?.currentIndex ?? 0)
  const [secondsLeft, setSecondsLeft] = useState(_savedState?.secondsLeft ?? DEFAULT_STRUCTURE[0].duration)
  const [isRunning, setIsRunning] = useState(_savedState?.isRunning ?? false)
  const [soundOn, setSoundOn] = useState(_savedState?.soundOn ?? false)
  const [showEditor, setShowEditor] = useState(false)
  const [interruptedLevel, setInterruptedLevel] = useState(_savedState?.interruptedLevel ?? null)
  const [showTimeEdit, setShowTimeEdit] = useState(false)
  const [editTime, setEditTime] = useState('')
  const intervalRef = useRef(null)
  const timerStartRef = useRef(null)
  const timerBaseRef = useRef(null)

  const current = structure[currentIndex]
  const progress = current.duration > 0 ? 1 - secondsLeft / current.duration : 0
  const isWarning = secondsLeft <= 60 && secondsLeft > 0

  const generateNextLevel = useCallback(() => {
    const lastLevel = [...structure].reverse().find(i => i.type === 'level')
    if (!lastLevel) return null
    const maxBlind = POKER_BLINDS[POKER_BLINDS.length - 1]
    // Stop generating if we've hit the ceiling
    if (lastLevel.big >= maxBlind) return null
    return {
      type: 'level',
      small: roundBlind(lastLevel.big),
      big: roundBlind(lastLevel.big * 2),
      ante: lastLevel.ante > 0 ? roundBlind(lastLevel.ante * 1.5) : 0,
      duration: lastLevel.duration,
    }
  }, [structure])

  const getNextLevel = useCallback(() => {
    for (let i = currentIndex + 1; i < structure.length; i++) {
      if (structure[i].type === 'level') return structure[i]
    }
    return generateNextLevel()
  }, [currentIndex, structure, generateNextLevel])

  const nextLevel = getNextLevel()

  const resetTimerRefs = useCallback((secs) => {
    timerStartRef.current = Date.now()
    timerBaseRef.current = secs
  }, [])

  const resumeFromBreak = useCallback(() => {
    if (!interruptedLevel) return
    const { index, remainingTime } = interruptedLevel
    // Remove the inserted break from structure
    const updated = [...structure]
    updated.splice(currentIndex, 1)
    setStructure(updated)
    // The interrupted level index may have shifted if break was before it
    const resumeIndex = currentIndex <= index ? index - 1 : index
    setCurrentIndex(resumeIndex)
    setSecondsLeft(remainingTime)
    resetTimerRefs(remainingTime)
    setInterruptedLevel(null)
    if (soundOn) try { playBeep() } catch { /* audio may not be available */ }
  }, [interruptedLevel, structure, currentIndex, soundOn, resetTimerRefs])

  const advanceLevel = useCallback(() => {
    // If ending a break that interrupted a level, resume that level
    if (structure[currentIndex]?.type === 'break' && interruptedLevel) {
      resumeFromBreak()
      return
    }
    if (currentIndex < structure.length - 1) {
      const next = currentIndex + 1
      const dur = structure[next].duration
      setCurrentIndex(next)
      setSecondsLeft(dur)
      resetTimerRefs(dur)
      if (soundOn) try { playBeep() } catch { /* audio may not be available */ }
    } else {
      const newLevel = generateNextLevel()
      if (newLevel) {
        const updated = [...structure, newLevel]
        setStructure(updated)
        setCurrentIndex(updated.length - 1)
        setSecondsLeft(newLevel.duration)
        resetTimerRefs(newLevel.duration)
        if (soundOn) try { playBeep() } catch { /* audio may not be available */ }
      }
    }
  }, [currentIndex, structure, soundOn, generateNextLevel, resetTimerRefs, interruptedLevel, resumeFromBreak])

  // Persist state to localStorage (throttled to once per second)
  const saveTimerRef = useRef(null)
  useEffect(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const state = {
        structure,
        currentIndex,
        secondsLeft,
        isRunning,
        soundOn,
        interruptedLevel,
        savedAt: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }, 1000)
    return () => clearTimeout(saveTimerRef.current)
  }, [structure, currentIndex, secondsLeft, isRunning, soundOn, interruptedLevel])

  // Save immediately on beforeunload so we capture exact state on refresh
  useEffect(() => {
    const handleUnload = () => {
      const state = {
        structure,
        currentIndex,
        secondsLeft,
        isRunning,
        soundOn,
        interruptedLevel,
        savedAt: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [structure, currentIndex, secondsLeft, isRunning, soundOn, interruptedLevel])

  // Track when timer starts for drift-free countdown
  useEffect(() => {
    if (isRunning) {
      timerStartRef.current = Date.now()
      timerBaseRef.current = secondsLeft
    }
  }, [isRunning]) // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000)
      const remaining = timerBaseRef.current - elapsed
      if (remaining <= 0) {
        setSecondsLeft(0)
        clearInterval(intervalRef.current)
        advanceLevel()
      } else {
        setSecondsLeft(remaining)
      }
    }, 250)
    return () => clearInterval(intervalRef.current)
  }, [isRunning, advanceLevel])

  const toggleRunning = () => setIsRunning(r => !r)

  const wasRunningRef = useRef(false)

  const handleCircleClick = () => {
    wasRunningRef.current = isRunning
    setIsRunning(false)
    setEditTime(formatTime(secondsLeft))
    setShowTimeEdit(true)
  }

  const handleTimeEditConfirm = () => {
    const secs = parseDuration(editTime)
    setSecondsLeft(secs)
    resetTimerRefs(secs)
    setShowTimeEdit(false)
    if (wasRunningRef.current) {
      setIsRunning(true)
    }
  }

  const handleTimeEditCancel = () => {
    setShowTimeEdit(false)
    if (wasRunningRef.current) {
      setIsRunning(true)
    }
  }

  const prevLevel = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1
      const dur = structure[prev].duration
      setCurrentIndex(prev)
      setSecondsLeft(dur)
      resetTimerRefs(dur)
    }
  }

  const skipLevel = () => advanceLevel()

  const takeBreak = () => {
    // If already on a break, end it early
    if (isBreak && interruptedLevel) {
      resumeFromBreak()
      return
    }
    const breakItem = { type: 'break', duration: 1200 }
    const updated = [...structure]
    updated.splice(currentIndex + 1, 0, breakItem)
    setStructure(updated)
    setInterruptedLevel({ index: currentIndex, remainingTime: secondsLeft })
    setIsRunning(false)
    setCurrentIndex(currentIndex + 1)
    setSecondsLeft(1200)
    resetTimerRefs(1200)
  }

  const handleSaveStructure = (newStructure) => {
    setStructure(newStructure)
    setIsRunning(false)
    setCurrentIndex(0)
    setSecondsLeft(newStructure[0].duration)
    resetTimerRefs(newStructure[0].duration)
    setInterruptedLevel(null)
    setShowEditor(false)
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (showEditor) return
      if (e.code === 'Space') {
        e.preventDefault()
        setIsRunning(r => !r)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showEditor])

  const isBreak = current.type === 'break'

  // Compute next break info
  const getNextBreakInfo = () => {
    // Find the next break after current index
    let totalSecsUntilBreak = secondsLeft // time left in current level
    let levelsUntilBreak = 0
    for (let i = currentIndex + 1; i < structure.length; i++) {
      if (structure[i].type === 'break') {
        // Count how many levels between current and the break
        for (let j = currentIndex; j < i; j++) {
          if (structure[j].type === 'level') levelsUntilBreak++
        }
        // If we're currently on a level, we already counted it via secondsLeft
        // Add durations of levels between current+1 and break
        for (let j = currentIndex + 1; j < i; j++) {
          totalSecsUntilBreak += structure[j].duration
        }
        const levelNum = getLevelNumber(structure, i - 1)
        return { totalSecsUntilBreak, levelsUntilBreak, afterLevel: levelNum }
      }
    }
    return null // no more breaks
  }

  const nextBreakInfo = isBreak ? null : getNextBreakInfo()

  const getPrevLevel = () => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (structure[i].type === 'level') return structure[i]
    }
    return null
  }
  const prevLevelData = getPrevLevel()

  return (
    <div className={`app ${isWarning ? 'warning' : ''} ${isBreak ? 'on-break' : ''}`}>
      {/* Title */}
      <div className="app-title">Free Poker Timer</div>

      {/* Top bar */}
      <div className="top-bar">
        <button
          className={`icon-btn ${soundOn ? '' : 'muted'}`}
          onClick={() => setSoundOn(s => !s)}
          title={soundOn ? 'Mute' : 'Unmute'}
        >
          {soundOn ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
        <button className="icon-btn" onClick={() => setShowEditor(true)} title="Settings">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Main timer area */}
      <div className="timer-layout">
        {/* Left: Current/Previous Blinds */}
        <div className={`blinds-panel left-panel ${isBreak ? 'dimmed' : ''}`}>
          <div className="panel-label">{isBreak ? 'Previous' : 'Blinds'}</div>
          {isBreak ? (
            prevLevelData ? (
              <div className="blind-big">{fmt(prevLevelData.small)} / {fmt(prevLevelData.big)}</div>
            ) : (
              <div className="blind-big dim">-</div>
            )
          ) : (
            <>
              <div className="blind-big">{fmt(current.small)} / {fmt(current.big)}</div>
              {current.ante > 0 && <div className="blind-ante">Ante: {fmt(current.ante)}</div>}
            </>
          )}
        </div>

        {/* Center: Circle Timer */}
        <div className="center-panel">
          <CircleTimer progress={progress} isWarning={isWarning} onClick={!showTimeEdit ? handleCircleClick : undefined}>
            {showTimeEdit ? (
              <div className="circle-edit-overlay">
                <input
                  type="text"
                  className="circle-edit-input"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleTimeEditConfirm()
                    if (e.key === 'Escape') handleTimeEditCancel()
                  }}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
                <div className="circle-edit-buttons">
                  <button className="circle-edit-btn confirm" onClick={e => { e.stopPropagation(); handleTimeEditConfirm() }} title="Confirm">&#10003;</button>
                  <button className="circle-edit-btn cancel" onClick={e => { e.stopPropagation(); handleTimeEditCancel() }} title="Cancel">&#10005;</button>
                </div>
              </div>
            ) : (
              <div className="circle-inner">
                {isBreak ? (
                  <>
                    <div className="circle-break-label">Break</div>
                    <div className={`time-display ${isWarning ? 'time-warning' : ''}`}>
                      {formatTime(secondsLeft)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="circle-level">
                      Level {getLevelNumber(structure, currentIndex)}
                    </div>
                    <div className={`time-display ${isWarning ? 'time-warning' : ''}`}>
                      {formatTime(secondsLeft)}
                    </div>
                  </>
                )}
              </div>
            )}
          </CircleTimer>
        </div>

        {/* Right: Next Blinds */}
        <div className={`blinds-panel right-panel ${isBreak ? 'dimmed' : ''}`}>
          <div className="panel-label">Next Blinds</div>
          {nextLevel ? (
            <>
              <div className="blind-big">{fmt(nextLevel.small)} / {fmt(nextLevel.big)}</div>
              {nextLevel.ante > 0 && <div className="blind-ante">Ante: {fmt(nextLevel.ante)}</div>}
            </>
          ) : (
            <div className="blind-big dim">--</div>
          )}
        </div>
      </div>

      {/* Next Break Info */}
      <div className="break-info">
        {isBreak ? null : nextBreakInfo ? (
          (() => {
            const hrs = Math.floor(nextBreakInfo.totalSecsUntilBreak / 3600)
            const mins = Math.ceil((nextBreakInfo.totalSecsUntilBreak % 3600) / 60)
            const timeStr = hrs > 0
              ? `${hrs}h ${mins}m`
              : `${mins}m`
            return `Next break in ~${timeStr} (after Level ${nextBreakInfo.afterLevel})`
          })()
        ) : (
          'No More Breaks'
        )}
      </div>

      {/* Controls */}
      <div className="controls">
        <button className="btn" onClick={prevLevel} disabled={currentIndex === 0}>
          &#9664; Prev
        </button>
        <button className={`btn btn-play ${isRunning ? 'btn-pause' : ''}`} onClick={toggleRunning}>
          {isRunning ? 'Pause' : 'Play'}
        </button>
        <button className="btn" onClick={skipLevel}>
          Next &#9654;
        </button>
        <button className="btn btn-break" onClick={takeBreak}>
          {isBreak && interruptedLevel ? 'End Break' : 'Break'}
        </button>
      </div>

      <footer>
        <p>Press <kbd>Space</kbd> to play/pause</p>
      </footer>

      {/* Editor Modal */}
      {showEditor && (
        <BlindEditor
          structure={structure}
          onSave={handleSaveStructure}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}

export default App
