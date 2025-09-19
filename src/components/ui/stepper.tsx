import * as React from "react"
import { cn } from "@/lib/utils"

const Stepper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
))
Stepper.displayName = "Stepper"

const StepperItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isActive?: boolean
    isCompleted?: boolean
  }
>(({ className, isActive, isCompleted, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-center w-8 h-8 rounded-full border-2",
      isCompleted
        ? "bg-primary border-primary text-primary-foreground"
        : isActive
        ? "border-primary text-primary"
        : "border-muted-foreground/25 text-muted-foreground",
      className
    )}
    {...props}
  />
))
StepperItem.displayName = "StepperItem"

export { Stepper, StepperItem }
