import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ReceiptLineItem {
  serviceName: string
  qty: number
  /** Full line amount (already qty-adjusted) — the "Amount ($)" column. */
  amount: number
  /** What was actually collected against this line. Defaults to `amount`; only
   *  diverges from it for a partly-paid pledge. */
  paid?: number
}

export interface TransactionReceiptProps {
  recipientName: string
  recipientEmail?: string
  /** ISO string or Date — rendered as "MM-DD-YYYY h:mm am/pm", the temple's own format. */
  date: string | Date
  receiptNo: string
  lines: ReceiptLineItem[]
  paymentMode: string
  referenceNumber: string
  className?: string
}

function fmtReceiptDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return '—'
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = date.getHours()
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ampm = hh >= 12 ? 'pm' : 'am'
  const h12 = hh % 12 || 12
  return `${mm}-${dd}-${date.getFullYear()} ${h12}:${mi} ${ampm}`
}

const money2 = (n: number) => n.toFixed(2)

/**
 * A faithful copy of the temple's own transaction-confirmation email — same banner,
 * table shape and footer boilerplate a devotee already gets by email — rendered here
 * for a single donation or sponsorship so staff can regenerate, reprint or download
 * one on request rather than dig through an inbox.
 */
export const TransactionReceipt = forwardRef<HTMLDivElement, TransactionReceiptProps>(
  function TransactionReceipt(
    {
      recipientName,
      recipientEmail,
      date,
      receiptNo,
      lines,
      paymentMode,
      referenceNumber,
      className,
    },
    ref,
  ) {
    const total = lines.reduce((s, l) => s + (l.paid ?? l.amount), 0)

    return (
      <div
        ref={ref}
        className={cn(
          'print-area mx-auto max-w-[600px] border border-[#ccc] bg-white text-[13px] leading-relaxed text-black',
          className,
        )}
      >
        <img src="/deities/recipt.png" alt="Sri Meenakshi Devasthanam" className="block w-full" />

        <div className="px-6 py-5">
          <p>Dear {recipientName},</p>
          <p className="mt-4 indent-8">
            Thank you for performing transaction with our temple. Please find the below details of
            your transaction(s).
          </p>

          <p className="mt-4">Date: {fmtReceiptDate(date)}</p>
          <p>Receipt No: {receiptNo}</p>

          <table className="mt-3 w-full border-collapse border border-[#999] text-left">
            <thead>
              <tr className="bg-[#d9d9d9]">
                <th className="border border-[#999] px-2 py-1.5 text-center">Sl No</th>
                <th className="border border-[#999] px-2 py-1.5">Service Name</th>
                <th className="border border-[#999] px-2 py-1.5 text-center">Qty</th>
                <th className="border border-[#999] px-2 py-1.5 text-right">Amount ($)</th>
                <th className="border border-[#999] px-2 py-1.5 text-right">Paid ($)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="border border-[#999] px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-[#999] px-2 py-1.5">{l.serviceName}</td>
                  <td className="border border-[#999] px-2 py-1.5 text-center">{l.qty}</td>
                  <td className="border border-[#999] px-2 py-1.5 text-right">
                    {money2(l.amount)}
                  </td>
                  <td className="border border-[#999] px-2 py-1.5 text-right">
                    {money2(l.paid ?? l.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#d9d9d9] font-medium">
                <td colSpan={4} className="border border-[#999] px-2 py-1.5 text-right">
                  Total Amount Paid ($)
                </td>
                <td className="border border-[#999] px-2 py-1.5 text-right">{money2(total)}</td>
              </tr>
            </tfoot>
          </table>

          <p className="mt-4">Payment Mode: {paymentMode}</p>
          <p>Reference Number: {referenceNumber}</p>

          <p className="mt-4">
            If you have additional questions, please contact the Temple Administrator for further
            assistance.
          </p>

          <div className="mt-4 border border-[#999] bg-[#f2f2f2] px-4 py-3 text-center">
            May Sri Meenakshi Sri Sundareswarar Sri Venkateshwara and Sri Padmavathi bless you and
            your families abundantly with good health long life and prosperity and happiness.
          </div>

          <p className="mt-5">Regards,</p>
          <p>Sri Meenakshi Temple Society</p>
          <p>17130 McLean Road</p>
          <p>Pearland</p>
          <p>+1-2814890358</p>
          <p>
            <a className="text-[#1155cc] underline" href="https://www.meenakshi.org">
              https://www.meenakshi.org
            </a>
          </p>
          <p>
            <a className="text-[#1155cc] underline" href="mailto:temple@meenakshi.org">
              temple@meenakshi.org
            </a>
          </p>

          <hr className="my-4 border-[#ccc]" />

          <p className="text-xs text-[#555]">
            This email was sent to {recipientEmail ?? '—'} by temple@meenakshi.org.
          </p>
          <p className="text-xs text-[#555]">
            We respect your privacy and do not share your personal information. Review our Privacy
            Policy.
          </p>
        </div>
      </div>
    )
  },
)
