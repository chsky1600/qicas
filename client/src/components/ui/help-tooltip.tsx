import * as TooltipPrimitive from "@radix-ui/react-tooltip"

interface HelpTooltipProps {
  title: string
  description: string
}

export function HelpTooltip({ title, description }: HelpTooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            tabIndex={-1}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-[10px] font-bold hover:bg-gray-400 transition-colors focus:outline-none cursor-default"
          >
            ?
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="z-[9999] max-w-64 rounded-md bg-gray-900 px-3 py-2 text-white shadow-lg"
            sideOffset={6}
          >
            <p className="text-xs font-semibold mb-1">{title}</p>
            <p className="text-xs leading-relaxed text-gray-300">{description}</p>
            <TooltipPrimitive.Arrow className="fill-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
