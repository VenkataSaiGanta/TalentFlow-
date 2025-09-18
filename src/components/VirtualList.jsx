// src/components/VirtualList.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react'

export default function VirtualList({ items, rowHeight = 72, overscan = 6, renderRow, className='' }) {
  const ref = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [height, setHeight] = useState(600)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.clientHeight || 600))
    ro.observe(el)
    const onScroll = () => setScrollTop(el.scrollTop)
    el.addEventListener('scroll', onScroll)
    return () => { ro.disconnect(); el.removeEventListener('scroll', onScroll) }
  }, [])

  const total = items.length * rowHeight
  const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2
  const endIdx = Math.min(items.length, startIdx + visibleCount)
  const offsetY = startIdx * rowHeight
  const slice = items.slice(startIdx, endIdx)

  return (
    <div ref={ref} className={`relative overflow-auto ${className}`} style={{ height }}>
      <div style={{ height: total, position:'relative' }}>
        <div style={{ position:'absolute', insetInlineStart:0, top: offsetY, width:'100%' }}>
          {slice.map((item, i) => renderRow(item, startIdx + i))}
        </div>
      </div>
    </div>
  )
}
