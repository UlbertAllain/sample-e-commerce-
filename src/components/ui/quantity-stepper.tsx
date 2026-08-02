"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="quantity-stepper" aria-label="Atur jumlah">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Kurangi">
        <Minus size={15} />
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Tambah">
        <Plus size={15} />
      </button>
    </div>
  );
}
