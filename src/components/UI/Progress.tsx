import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: "default" | "gradient" | "glow"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  label?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    variant = "default",
    size = "md",
    showLabel = false,
    label,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizeClasses = {
      sm: "h-1",
      md: "h-2", 
      lg: "h-3"
    }

    const variantClasses = {
      default: "bg-primary",
      gradient: "bg-gradient-to-r from-blue-500 to-purple-500",
      glow: "bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25"
    }

    return (
      <div className="space-y-2">
        {(showLabel || label) && (
          <div className="flex justify-between text-sm">
            <span>{label || "Progress"}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-secondary",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full w-full flex-1 transition-all duration-500 ease-out",
              variantClasses[variant]
            )}
            style={{
              transform: `translateX(-${100 - percentage}%)`
            }}
          />
        </div>
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress } 