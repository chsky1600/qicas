import { cn } from "@/lib/utils"

type ModeToggleOption<T extends string> = {
  value: T
  label: string
}

type ModeTogglePillProps<T extends string> = {
  value: T
  options: Array<ModeToggleOption<T>>
  onChange: (next: T) => void
  className?: string
  buttonClassName?: string

  // new optional prop
  fullWidth?: boolean
  minButtonWidth?: string
}

export function ModeTogglePill<T extends string>({
  value,
  options,
  onChange,
  className,
  buttonClassName,
  fullWidth = false,
  minButtonWidth,
}: ModeTogglePillProps<T>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-white rounded-full p-[3px] shadow-inner",
        fullWidth && "w-[420px]",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          type="button"
          className={cn(
            "px-6 py-1.5 text-sm font-semibold rounded-full transition text-center",
            fullWidth && "flex-1",
            minButtonWidth && `min-w-[${minButtonWidth}]`,
            value === opt.value
              ? "!bg-white text-black"
              : "!bg-black text-white hover:!bg-gray-800",
            buttonClassName
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
