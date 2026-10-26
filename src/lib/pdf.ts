import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Rasterises a DOM node and saves it as a downloadable PDF, paginating automatically
 * if the node is taller than one page. Used for the transaction receipt — the other
 * printable views in this app rely on `window.print()`, which hands the devotee a
 * dialog rather than a file they can attach to an email or keep on disk.
 */
export async function downloadElementAsPdf(el: HTMLElement, filename: string) {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const imgData = canvas.toDataURL('image/png')

  let heightLeft = imgHeight
  let position = 0
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(filename)
}
