"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
// import { buttonVariants } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white w-full max-w-[340px] mx-auto rounded-3xl", className)}
      style={{
        "--rdp-cell-size": "2.75rem",
        "--rdp-accent-color": "#2286BE",
        "--rdp-background-color": "rgba(34, 134, 190, 0.1)",
        "--rdp-accent-color-dark": "#1b6da0",
        "--rdp-background-color-dark": "rgba(34, 134, 190, 0.2)",
        "--rdp-outline": "2px solid #2286BE",
        "--rdp-outline-selected": "none",
        "--rdp-day-font": "inherit",
      } as React.CSSProperties}
      classNames={{
        // We only override superficial styling, NEVER the structural grid logic.
        root: "text-slate-900 bg-white",
        month_caption: "flex justify-center items-center relative mb-6 pt-2 w-full",
        caption_label: "text-lg font-black tracking-tight",
        
        // Navigation overlays the caption cleanly
        nav: "absolute w-full flex justify-between px-1 top-1 pointer-events-none",
        button_previous: "h-9 w-9 bg-slate-50 border border-slate-100 rounded-[0.8rem] hover:bg-slate-100 hover:text-[#2286BE] transition-colors flex items-center justify-center pointer-events-auto cursor-pointer shadow-sm active:scale-95",
        button_next: "h-9 w-9 bg-slate-50 border border-slate-100 rounded-[0.8rem] hover:bg-slate-100 hover:text-[#2286BE] transition-colors flex items-center justify-center pointer-events-auto cursor-pointer shadow-sm active:scale-95",
        
        // Grid Structure
        month_grid: "w-full border-collapse pb-1",
        weekdays: "flex w-full justify-center gap-1.5 mb-4",
        weekday: "text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] w-10 text-center flex-shrink-0",
        week: "flex w-full justify-center gap-1.5 mb-2",
        day: "h-10 w-10 p-0 text-center text-sm relative focus-within:relative focus-within:z-20 flex-shrink-0",
        day_button: "h-10 w-10 flex items-center justify-center font-bold text-sm rounded-2xl hover:bg-slate-50 transition-all border-2 border-transparent active:scale-95 text-slate-800",
        
        // States
        selected: "font-black shadow-md shadow-[#2286BE]/10 z-10 !bg-[#2286BE]/5 !text-[#2286BE] border-2 border-[#2286BE] rounded-2xl",
        today: "text-[#2286BE] font-black border-[#2286BE]/20 ring-1 ring-[#2286BE]/10 rounded-2xl bg-[#2286BE]/5 outline-none",
        outside: "text-slate-300 opacity-40",
        disabled: "text-slate-200 opacity-40",
        hidden: "invisible",
        
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
