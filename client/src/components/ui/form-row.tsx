import * as React from "react"
import { cn } from "@/lib/utils"

type FormRowProps = {
  label: string
  labelClassName?: string
  className?: string
  children: React.ReactNode
}

export function FormRow({ label, labelClassName, className, children }: FormRowProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("font-semibold w-20", labelClassName)}>{label}</div>
      {children}
    </div>
  )
}
