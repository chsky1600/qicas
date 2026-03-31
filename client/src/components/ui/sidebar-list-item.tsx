import * as React from "react"
import { cn } from "@/lib/utils"

type SidebarListItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}

export function SidebarListItem({ active, className, ...props }: SidebarListItemProps) {
  return (
    <button
      {...props}
      className={cn(
        "w-full text-left !px-4 !py-1 text-sm text-black transition-colors !border-0",
        active ? "!bg-[#8a8a8a]" : "!bg-transparent hover:!bg-[#9d9d9d]",
        className
      )}
    />
  )
}
