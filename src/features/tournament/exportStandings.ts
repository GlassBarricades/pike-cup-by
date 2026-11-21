import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatTournamentDate } from './date'
import { formatPlace } from './scoring'
import type { AthleteStandingRow, TeamStandingRow, TourResult } from './formats/individual/scoring'
import type { Tournament } from './types'

export type ExportStandingKind = 'team' | 'individual' | 'juniors'

export type ExportMeta = {
  tournamentName: string
  eventDate: string
  location: string
  standingTitle: string
  fileSlug: string
}

export type ExportTable = {
  headers: string[]
  rows: string[][]
  meta: ExportMeta
}

const STANDING_LABEL: Record<ExportStandingKind, { title: string; slug: string }> = {
  team: { title: 'Командный зачёт', slug: 'komandnyy' },
  individual: { title: 'Личный зачёт', slug: 'lichnyy' },
  juniors: { title: 'Юниорский зачёт', slug: 'yuniori' },
}

function tourOf(tours: TourResult[], n: number): TourResult | undefined {
  return tours.find((t) => t.tour === n) ?? tours[n - 1]
}

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-яё0-9_-]/gi, '')
    .slice(0, 40) || 'turnir'
}

function fileDate(isoDate: string): string {
  return isoDate.slice(0, 10)
}

export function buildExportMeta(
  tournament: Pick<Tournament, 'name' | 'event_date' | 'location'>,
  kind: ExportStandingKind,
): ExportMeta {
  const standing = STANDING_LABEL[kind]
  return {
    tournamentName: tournament.name,
    eventDate: tournament.event_date,
    location: tournament.location,
    standingTitle: standing.title,
    fileSlug: `${slugifyName(tournament.name)}-${standing.slug}-${fileDate(tournament.event_date)}`,
  }
}

export function buildTeamExportTable(
  teams: TeamStandingRow[],
  meta: ExportMeta,
): ExportTable {
  const headers = ['#', 'Команда', 'Состав', 'Т1 место', 'Т1 вес', 'Т2 место', 'Т2 вес', 'Σ мест', 'Вес']
  const sorted = [...teams].sort((a, b) => a.finalPlace - b.finalPlace)
  const rows = sorted.map((row) => {
    const t1 = tourOf(row.tours, 1)
    const t2 = tourOf(row.tours, 2)
    return [
      formatPlace(row.finalPlace),
      row.teamName,
      row.athleteNames.join(', '),
      t1 ? formatPlace(t1.place) : '—',
      t1 ? String(t1.weight) : '—',
      t2 ? formatPlace(t2.place) : '—',
      t2 ? String(t2.weight) : '—',
      formatPlace(row.placeSum),
      String(row.totalWeight),
    ]
  })
  return { headers, rows, meta }
}

export function buildAthleteExportTable(
  athletes: AthleteStandingRow[],
  meta: ExportMeta,
): ExportTable {
  const headers = [
    '#',
    'Спортсмен',
    'Команда',
    'Т1 место',
    'Т1 зона',
    'Т1 вес',
    'Т2 место',
    'Т2 зона',
    'Т2 вес',
    'Σ мест',
    'Вес',
  ]
  const sorted = [...athletes].sort((a, b) => a.finalPlace - b.finalPlace)
  const rows = sorted.map((row) => {
    const t1 = tourOf(row.tours, 1)
    const t2 = tourOf(row.tours, 2)
    return [
      formatPlace(row.finalPlace),
      row.athleteName,
      row.teamName,
      t1 ? formatPlace(t1.place) : '—',
      t1?.zone ?? '—',
      t1 ? String(t1.weight) : '—',
      t2 ? formatPlace(t2.place) : '—',
      t2?.zone ?? '—',
      t2 ? String(t2.weight) : '—',
      formatPlace(row.placeSum),
      String(row.totalWeight),
    ]
  })
  return { headers, rows, meta }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadXlsx(table: ExportTable): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'PikeCup'
  const sheet = wb.addWorksheet(table.meta.standingTitle.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 5 }],
  })

  sheet.addRow([table.meta.tournamentName])
  sheet.addRow([formatTournamentDate(table.meta.eventDate)])
  sheet.addRow([table.meta.location])
  sheet.addRow([table.meta.standingTitle])
  sheet.addRow([])
  sheet.addRow(table.headers)
  for (const row of table.rows) sheet.addRow(row)

  sheet.getRow(1).font = { bold: true, size: 14 }
  sheet.getRow(4).font = { bold: true, size: 12 }
  sheet.getRow(6).font = { bold: true }
  sheet.columns.forEach((col) => {
    let max = 10
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? '').length
      if (len > max) max = len
    })
    col.width = Math.min(40, max + 2)
  })

  const buffer = await wb.xlsx.writeBuffer()
  triggerDownload(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${table.meta.fileSlug}.xlsx`,
  )
}

let fontCache: { regular: string; bold: string } | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function loadPdfFonts(): Promise<{ regular: string; bold: string }> {
  if (fontCache) return fontCache
  const [regularBuf, boldBuf] = await Promise.all([
    fetch('/fonts/DejaVuSans.ttf').then((r) => {
      if (!r.ok) throw new Error('Не удалось загрузить шрифт DejaVuSans')
      return r.arrayBuffer()
    }),
    fetch('/fonts/DejaVuSans-Bold.ttf').then((r) => {
      if (!r.ok) throw new Error('Не удалось загрузить шрифт DejaVuSans-Bold')
      return r.arrayBuffer()
    }),
  ])
  fontCache = {
    regular: arrayBufferToBase64(regularBuf),
    bold: arrayBufferToBase64(boldBuf),
  }
  return fontCache
}

export async function downloadPdf(table: ExportTable): Promise<void> {
  const fonts = await loadPdfFonts()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.addFileToVFS('DejaVuSans.ttf', fonts.regular)
  doc.addFileToVFS('DejaVuSans-Bold.ttf', fonts.bold)
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal')
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVu', 'bold')

  doc.setFont('DejaVu', 'bold')
  doc.setFontSize(14)
  doc.text(table.meta.tournamentName, 14, 14)
  doc.setFont('DejaVu', 'normal')
  doc.setFontSize(10)
  doc.text(
    `${formatTournamentDate(table.meta.eventDate)} · ${table.meta.location}`,
    14,
    20,
  )
  doc.setFont('DejaVu', 'bold')
  doc.setFontSize(12)
  doc.text(table.meta.standingTitle, 14, 28)

  autoTable(doc, {
    startY: 32,
    head: [table.headers],
    body: table.rows,
    styles: { font: 'DejaVu', fontSize: 8, cellPadding: 1.5 },
    headStyles: { font: 'DejaVu', fontStyle: 'bold', fillColor: [40, 40, 40], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 10, right: 10 },
  })

  doc.save(`${table.meta.fileSlug}.pdf`)
}
