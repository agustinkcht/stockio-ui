import jsPDF from "jspdf"
import type { Compra } from "@/lib/types"
import { getVentaItemDisplay } from "@/lib/utils/venta-item-lookup"

type MiNegocio = {
  razonSocial?: string
  nombre?: string
  nombreApp?: string
  ciudad?: string
  provincia?: string
  email?: string
  fotoUrl?: string
}

/**
 * Renders a single compra onto an existing jsPDF document starting at the top of the current page.
 */
export async function renderCompraPage(doc: jsPDF, compra: Compra, miNegocio: MiNegocio): Promise<void> {
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const ml = 16
  const mr = pw - 16
  let y = 16

  const newPageIfNeeded = (needed = 10) => {
    if (y + needed > ph - 16) { doc.addPage(); y = 16 }
  }

  const proveedorNombre = compra.proveedorNombre || "Proveedor"

  // ── Brand block ──────────────────────────────────────────────────────────
  const businessName = miNegocio.razonSocial || miNegocio.nombre || miNegocio.nombreApp || "Negocio"
  const businessSub = miNegocio.ciudad
    ? `${miNegocio.ciudad}${miNegocio.provincia ? `, ${miNegocio.provincia}` : ""}`
    : miNegocio.email || ""
  const logoSize = 11

  let logoLoaded = false
  if (miNegocio.fotoUrl) {
    try {
      const logoDataUrl = await fetch(miNegocio.fotoUrl)
        .then(r => r.blob())
        .then(blob => new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        }))
      doc.addImage(logoDataUrl, "JPEG", ml, y - 1, logoSize, logoSize, undefined, "FAST")
      logoLoaded = true
    } catch {
      // fall through
    }
  }
  if (!logoLoaded) {
    doc.setFillColor(15, 23, 42)
    doc.roundedRect(ml, y - 1, logoSize, logoSize, 2, 2, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text(businessName.charAt(0).toUpperCase(), ml + logoSize / 2, y + 5.5, { align: "center" })
  }

  const nameX = ml + logoSize + 2
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text(businessName, nameX, y + 4)
  if (businessSub) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(businessSub, nameX, y + 8.5)
  }

  const fechaFormateada = new Date(compra.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`COMPRA ${compra.id}`, mr, y + 3, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text(fechaFormateada, mr, y + 8.5, { align: "right" })
  y += 17

  // ── Divider ──────────────────────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(ml, y, mr, y)
  y += 7

  // ── Proveedor ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text("PROVEEDOR", ml, y)
  y += 4
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(proveedorNombre, ml, y)
  y += 9

  // ── Column headers ────────────────────────────────────────────────────────
  const colItem = ml
  const colQty = 106
  const colPrice = 130
  const colSub = mr

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text("ÍTEM", colItem, y)
  doc.text("CANT.", colQty + 6, y, { align: "center" })
  doc.text("PRECIO UNIT.", colPrice, y)
  doc.text("SUBTOTAL", colSub, y, { align: "right" })
  y += 3

  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.5)
  doc.line(ml, y, mr, y)
  y += 5

  // ── Item rows ─────────────────────────────────────────────────────────────
  for (const item of compra.items) {
    const display = getVentaItemDisplay(item)
    const hasDiscount = item.discount > 0
    const adjustedUnit = item.discountType === "percent"
      ? item.unitPrice * (1 - item.discount / 100)
      : item.discountType === "fixed"
      ? Math.max(0, item.unitPrice - item.discount)
      : item.unitPrice
    const lineTotal = Math.round(item.total)

    const hasSecondPriceLine = hasDiscount
    const rowH = 8 + (hasSecondPriceLine ? 4 : 0)

    newPageIfNeeded(rowH + 3)

    const nameY = y + (hasSecondPriceLine ? 3.5 : 5)
    const nameStr = display.name.length > 50 ? display.name.slice(0, 47) + "..." : display.name
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(nameStr, colItem, nameY)

    if (display.tags.length > 0) {
      const nameW = doc.getTextWidth(nameStr)
      const spaceW = doc.getTextWidth(" ")
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      const tagsStr = display.tags.join("  ·  ")
      doc.text(tagsStr, colItem + nameW + spaceW * 2, nameY)
    }

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(String(item.quantity), colQty + 6, y + 5, { align: "center" })

    if (hasDiscount) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      const origStr = `$${item.unitPrice.toLocaleString("es-AR")}`
      const origW = doc.getTextWidth(origStr)
      doc.text(origStr, colPrice, y + 3.5)
      doc.setDrawColor(148, 163, 184)
      doc.setLineWidth(0.25)
      doc.line(colPrice, y + 2.8, colPrice + origW, y + 2.8)
      const badgeLabel = item.discountType === "percent"
        ? `-${item.discount}%`
        : `-$${item.discount.toLocaleString("es-AR")}`
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(239, 68, 68)
      doc.text(badgeLabel, colPrice + origW + 1.5, y + 3.5)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
      doc.text(`$${Math.round(adjustedUnit).toLocaleString("es-AR")} c/u`, colPrice, y + 8.5)
    } else {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
      doc.text(`$${item.unitPrice.toLocaleString("es-AR")} c/u`, colPrice, y + 5)
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(`$${lineTotal.toLocaleString("es-AR")}`, colSub, y + 5, { align: "right" })

    y += rowH
    doc.setDrawColor(241, 245, 249)
    doc.setLineWidth(0.2)
    doc.line(ml, y, mr, y)
    y += 2
  }

  // ── Adjustments + Total ───────────────────────────────────────────────────
  const compraDescuento = compra.descuento ?? 0
  const compraDescuentoTipo = compra.descuentoTipo ?? "percent"
  const compraDescuentoAmount = compraDescuentoTipo === "percent"
    ? compra.subtotal * (compraDescuento / 100)
    : compraDescuento
  const compraEnvio = compra.envio ?? 0
  const compraCustomCharges = (compra.customCharges ?? []).filter(c => c.value > 0)

  y += 4
  newPageIfNeeded(30)

  const adjLeft = mr - 68
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(adjLeft, y, mr, y)
  y += 5

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text("Subtotal", adjLeft, y)
  doc.setTextColor(71, 85, 105)
  doc.text(`$${Math.round(compra.subtotal).toLocaleString("es-AR")}`, mr, y, { align: "right" })
  y += 5.5

  if (compraDescuento > 0) {
    const label = `Descuento${compraDescuentoTipo === "percent" ? ` (${compraDescuento}%)` : ""}`
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(label, adjLeft, y)
    doc.setTextColor(239, 68, 68)
    doc.text(`-$${Math.round(compraDescuentoAmount).toLocaleString("es-AR")}`, mr, y, { align: "right" })
    y += 5.5
  }

  if (compraEnvio > 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text("Envío", adjLeft, y)
    doc.setTextColor(71, 85, 105)
    doc.text(`+$${Math.round(compraEnvio).toLocaleString("es-AR")}`, mr, y, { align: "right" })
    y += 5.5
  }

  for (const c of compraCustomCharges) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(c.label, adjLeft, y)
    doc.setTextColor(71, 85, 105)
    doc.text(`+$${Math.round(c.value).toLocaleString("es-AR")}`, mr, y, { align: "right" })
    y += 5.5
  }

  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.5)
  doc.line(adjLeft, y, mr, y)
  y += 5.5

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text("Total", adjLeft, y)
  doc.text(`$${Math.round(compra.total).toLocaleString("es-AR")}`, mr, y, { align: "right" })

  // ── Footer ───────────────────────────────────────────────────────────────
  const footerY = ph - 12
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(ml, footerY - 3, mr, footerY - 3)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  const footerLeft = [businessName, miNegocio.email].filter(Boolean).join("  ·  ")
  doc.text(footerLeft, ml, footerY)
  doc.text(`Compra ${compra.id}`, mr, footerY, { align: "right" })
}

/**
 * Download a PDF for one or more compras.
 */
export async function downloadComprasPDF(compras: Compra[], miNegocio: MiNegocio): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  for (let i = 0; i < compras.length; i++) {
    if (i > 0) doc.addPage()
    await renderCompraPage(doc, compras[i], miNegocio)
  }
  const filename = compras.length === 1
    ? `Compra-${compras[0].id}.pdf`
    : `Compras-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
