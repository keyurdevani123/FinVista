'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

const today = () => new Date().toISOString().slice(0, 10)

export function AddInvestmentModal({ type, onAdded, buttonText }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [fields,  setFields]  = useState({})

  const set = (key, value) => setFields((prev) => ({ ...prev, [key]: value }))

  const reset = () => setFields({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Build the payload based on investment type
    let payload = { type }

    if (type === 'FD') {
      const startDate = fields.startDate || today()
      // Compute endDate from startDate + years
      const end = new Date(startDate)
      end.setMonth(end.getMonth() + Math.round(parseFloat(fields.years || 1) * 12))

      payload = {
        ...payload,
        name:         fields.fdName,
        amount:       parseFloat(fields.amount),
        interestRate: parseFloat(fields.interestRate),
        startDate,
        endDate: end.toISOString().slice(0, 10),
      }

    } else if (type === 'STOCKS') {
      payload = {
        ...payload,
        name:         fields.companyName,
        amount:       parseFloat(fields.buyPrice),   // buy price per share
        ticker:       fields.ticker?.trim() || null,
        quantity:     parseFloat(fields.quantity),
        purchaseDate: fields.purchaseDate || today(),
      }

    } else if (type === 'SIP') {
      payload = {
        ...payload,
        name:      fields.fundName,
        amount:    parseFloat(fields.amount),
        startDate: fields.startDate || today(),
        status:    fields.status || 'Active',
      }

    } else if (type === 'MUTUAL_FUNDS') {
      payload = {
        ...payload,
        name:            fields.fundName,
        amount:          parseFloat(fields.amount),
        investmentDate:  fields.investmentDate || today(),
      }
    }

    const res = await fetch('/api/investment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    setLoading(false)

    if (res.ok) {
      setOpen(false)
      reset()
      onAdded?.()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Failed to add investment')
    }
  }

  const closeModal = () => { setOpen(false); reset() }

  const inputCls = 'w-full'

  let formFields = null

  // ── Fixed Deposit ──────────────────────────────────────────────
  if (type === 'FD') {
    formFields = (
      <>
        <div className="space-y-1">
          <Label>FD Name / Bank</Label>
          <Input
            className={inputCls}
            placeholder="e.g. SBI Fixed Deposit"
            value={fields.fdName || ''}
            onChange={(e) => set('fdName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Principal Amount (₹)</Label>
          <Input
            className={inputCls}
            type="number"
            min="1"
            placeholder="e.g. 100000"
            value={fields.amount || ''}
            onChange={(e) => set('amount', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Duration (Years)</Label>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              placeholder="e.g. 2"
              value={fields.years || ''}
              onChange={(e) => set('years', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Interest Rate (% p.a.)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="e.g. 7.5"
              value={fields.interestRate || ''}
              onChange={(e) => set('interestRate', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Start Date</Label>
          <Input
            type="date"
            defaultValue={today()}
            onChange={(e) => set('startDate', e.target.value)}
          />
        </div>
      </>
    )

  // ── Stocks ────────────────────────────────────────────────────
  } else if (type === 'STOCKS') {
    formFields = (
      <>
        <div className="space-y-1">
          <Label>Company Name</Label>
          <Input
            className={inputCls}
            placeholder="e.g. IRFC"
            value={fields.companyName || ''}
            onChange={(e) => set('companyName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label>NSE Ticker Symbol <span className="text-muted-foreground text-xs">(optional, for live price)</span></Label>
          <Input
            className={inputCls}
            placeholder="e.g. RELIANCE, INFY, IRFC"
            value={fields.ticker || ''}
            onChange={(e) => set('ticker', e.target.value.toUpperCase())}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Buy Price (₹/share)</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 150"
              value={fields.buyPrice || ''}
              onChange={(e) => set('buyPrice', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Quantity (shares)</Label>
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 10"
              value={fields.quantity || ''}
              onChange={(e) => set('quantity', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Purchase Date</Label>
          <Input
            type="date"
            defaultValue={today()}
            onChange={(e) => set('purchaseDate', e.target.value)}
          />
        </div>
      </>
    )

  // ── SIP ───────────────────────────────────────────────────────
  } else if (type === 'SIP') {
    formFields = (
      <>
        <div className="space-y-1">
          <Label>Fund Name</Label>
          <Input
            className={inputCls}
            placeholder="e.g. HDFC Mid Cap Fund"
            value={fields.fundName || ''}
            onChange={(e) => set('fundName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Monthly SIP Amount (₹)</Label>
          <Input
            className={inputCls}
            type="number"
            min="100"
            step="100"
            placeholder="e.g. 5000"
            value={fields.amount || ''}
            onChange={(e) => set('amount', e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Start Date</Label>
          <Input
            type="date"
            defaultValue={today()}
            onChange={(e) => set('startDate', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <select
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            value={fields.status || 'Active'}
            onChange={(e) => set('status', e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </>
    )

  // ── Mutual Fund ───────────────────────────────────────────────
  } else if (type === 'MUTUAL_FUNDS') {
    formFields = (
      <>
        <div className="space-y-1">
          <Label>Fund Name</Label>
          <Input
            className={inputCls}
            placeholder="e.g. Axis Bluechip Fund"
            value={fields.fundName || ''}
            onChange={(e) => set('fundName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Investment Amount (₹)</Label>
          <Input
            className={inputCls}
            type="number"
            min="1"
            placeholder="e.g. 25000"
            value={fields.amount || ''}
            onChange={(e) => set('amount', e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Investment Date</Label>
          <Input
            type="date"
            defaultValue={today()}
            onChange={(e) => set('investmentDate', e.target.value)}
          />
        </div>
      </>
    )
  }

  const titles = {
    FD:           'Add Fixed Deposit',
    STOCKS:       'Add Stock Investment',
    SIP:          'Add SIP',
    MUTUAL_FUNDS: 'Add Mutual Fund',
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {buttonText}
      </Button>

      <Dialog open={open} onOpenChange={closeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{titles[type]}</DialogTitle>
            <DialogDescription>
              Fill in the details below to track this investment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {formFields}
            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Saving…' : buttonText}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
