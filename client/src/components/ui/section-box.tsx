import * as React from "react"
import { cn } from "@/lib/utils"

type SectionBoxProps = {
  title: string
  action?: React.ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
  children: React.ReactNode
}

export function SectionBox({
  title,
  action,
  className,
  headerClassName,
  bodyClassName,
  children,
}: SectionBoxProps) {
  return (
    <div className={cn("border border-black rounded-md bg-white overflow-hidden", className)}>
      <div
        className={cn(
          "bg-[#cfcfcf] border-b border-black px-3 py-1 font-semibold flex items-center justify-between",
          headerClassName
        )}
      >
        <span>{title}</span>
        {action}
      </div>

      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </div>
  )
}
