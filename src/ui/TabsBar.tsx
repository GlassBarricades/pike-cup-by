import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Tabs } from '@mantine/core'
import { useSearchParams } from 'react-router-dom'

export type TabItem = {
  value: string
  label: ReactNode
}

const listStyle = {
  flexWrap: 'nowrap' as const,
  overflowX: 'auto' as const,
  maxWidth: '100%',
}

export function TabsBar({
  tabs,
  defaultTab,
  param = 'tab',
  extraValues = [],
  children,
}: {
  tabs: TabItem[]
  defaultTab: string
  param?: string
  /** Значения в адресе, которых нет в полосе, но они остаются открытыми. */
  extraValues?: string[]
  children: (active: string) => ReactNode
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const fromUrl = searchParams.get(param) ?? defaultTab
  const available = tabs.map((t) => t.value)
  const known = new Set([...available, ...extraValues])
  const active = known.has(fromUrl) ? fromUrl : defaultTab
  const selected = available.includes(active) ? active : null

  useEffect(() => {
    if (active === fromUrl) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (active === defaultTab) next.delete(param)
        else next.set(param, active)
        return next
      },
      { replace: true },
    )
  }, [active, fromUrl, defaultTab, param, setSearchParams])

  return (
    <Tabs
      value={selected}
      onChange={(v) => {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            if (!v || v === defaultTab) next.delete(param)
            else next.set(param, v)
            return next
          },
          { replace: true },
        )
      }}
      variant="pills"
      radius={0}
    >
      <Tabs.List mb="sm" grow className="pc-print-hide" style={listStyle}>
        {tabs.map((t) => (
          <Tabs.Tab key={t.value} value={t.value}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {children(active)}
    </Tabs>
  )
}
