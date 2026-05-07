"use client"

import { useEffect } from "react"
import { X, Download } from "lucide-react"
import jsPDF from "jspdf"
import type { Venta } from "@/lib/types"

const BUSINESS_NAME = "Stockio"
const BUSINESS_SUBTITLE = "Sistema de Gestión"

const monthsAbbr = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function formatTicketDate(dateStr: string, hora: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = monthsAbbr[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}  ${hora}`
}

interface TicketModalProps {
  venta: Venta
  onClose: () => void
}

export function TicketModal({ venta, onClose }: TicketModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const subtotal = venta.items.reduce((sum, item) => sum + item.total, 0)
  const descuento = venta.descuento ?? 0
  const total = venta.total

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      unit: "mm",
      format: [80, 200], // thermal receipt width
      orientation: "portrait",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 12

    // Business header
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(BUSINESS_NAME, pageWidth / 2, y, { align: "center" })
    y += 5

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 30, 30)
    doc.text(BUSINESS_NAME, pageWidth / 2, y, { align: "center" })
    y += 6

    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(130, 130, 130)
    doc.text(formatTicketDate(venta.fecha, venta.hora), pageWidth / 2, y, { align: "center" })
    y += 4
    doc.text(venta.clienteNombre, pageWidth / 2, y, { align: "center" })
    y += 5

    // Dashed divider
    doc.setDrawColor(180, 180, 180)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(4, y, pageWidth - 4, y)
    y += 5

    // Items
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(30, 30, 30)
    venta.items.forEach((item) => {
      const name = item.name.length > 24 ? item.name.slice(0, 21) + "..." : item.name
      const priceStr = `$${item.total.toLocaleString("es-AR")}`
      doc.text(name, 4, y)
      doc.text(priceStr, pageWidth - 4, y, { align: "right" })
      y += 4

      // qty x unit
      doc.setFontSize(7)
      doc.setTextColor(130, 130, 130)
      doc.text(`${item.quantity} x $${item.unitPrice.toLocaleString("es-AR")}`, 4, y)
      y += 5
      doc.setFontSize(8)
      doc.setTextColor(30, 30, 30)
    })

    // Divider before totals
    doc.setLineDashPattern([1, 1], 0)
    doc.setDrawColor(180, 180, 180)
    doc.line(4, y, pageWidth - 4, y)
    y += 5

    // Subtotal
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    doc.text("Subtotal:", 4, y)
    doc.text(`$${subtotal.toLocaleString("es-AR")}`, pageWidth - 4, y, { align: "right" })
    y += 5

    if (descuento > 0) {
      doc.setTextColor(180, 60, 60)
      doc.text("Descuento:", 4, y)
      doc.text(`-$${descuento.toLocaleString("es-AR")}`, pageWidth - 4, y, { align: "right" })
      y += 5
      doc.setTextColor(80, 80, 80)
    }

    // Total
    doc.setLineDashPattern([], 0)
    doc.setDrawColor(180, 180, 180)
    doc.line(4, y - 1, pageWidth - 4, y - 1)
    y += 3
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(10, 10, 10)
    doc.text("TOTAL:", 4, y)
    doc.text(`$${total.toLocaleString("es-AR")}`, pageWidth - 4, y, { align: "right" })
    y += 8

    // Footer
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.text("¡Gracias por tu preferencia!", pageWidth / 2, y, { align: "center" })

    // Resize page height
    const finalPageHeight = y + 10
    doc.internal.pageSize.height = finalPageHeight

    doc.save(`ticket-${venta.id}.pdf`)
  }

  const subtotalDisplay = venta.items.reduce((sum, item) => sum + item.total, 0)
  const hasDescuento = (venta.descuento ?? 0) > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Ticket panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[320px] mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ticket content */}
        <div className="px-6 pt-6 pb-4 font-mono">
          {/* Business header */}
          <div className="text-center mb-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{BUSINESS_SUBTITLE}</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0.5">{BUSINESS_NAME}</p>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {formatTicketDate(venta.fecha, venta.hora)}
            </p>
            <p className="text-[11px] text-slate-500">{venta.clienteNombre}</p>
          </div>

          {/* Dashed divider */}
          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Items */}
          <div className="flex flex-col gap-3 mb-3">
            {venta.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-slate-800 leading-snug">{item.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {item.quantity} x ${item.unitPrice.toLocaleString("es-AR")}
                  </p>
                </div>
                <p className="text-[12px] font-semibold text-slate-800 shrink-0">
                  ${item.total.toLocaleString("es-AR")}
                </p>
              </div>
            ))}
          </div>

          {/* Dashed divider */}
          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Subtotal + descuento + total */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Subtotal</span>
              <span className="text-[11px] text-slate-600">${subtotalDisplay.toLocaleString("es-AR")}</span>
            </div>

            {hasDescuento && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-rose-500">Descuento</span>
                <span className="text-[11px] text-rose-500">
                  -${(venta.descuento ?? 0).toLocaleString("es-AR")}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2 mt-1 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">TOTAL</span>
              <span className="text-base font-bold text-slate-900">
                ${venta.total.toLocaleString("es-AR")}
              </span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 mt-4 mb-1">¡Gracias por tu preferencia!</p>
        </div>

        {/* Descargar PDF button */}
        <div className="px-6 pb-5">
          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  )
}
