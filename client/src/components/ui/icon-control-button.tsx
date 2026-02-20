import * as React from "react"
import { cn } from "@/lib/utils"

interface IconControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function IconControlButton({ className, children, ...props }: IconControlButtonProps) {
  return (
    <button
      className={cn(
        `
        w-8 h-8
        flex items-center justify-center
        text-black
        text-lg leading-none font-bold
        hover:opacity-60
        active:translate-y-[1px]
        transition
        cursor-pointer
        !bg-transparent
        !border-0
        !p-0
        !rounded-none
        `,
        className
        )}
      {...props}
    >
      {children}
    </button>
  )
}
