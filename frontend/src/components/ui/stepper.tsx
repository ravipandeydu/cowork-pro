import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface Step {
    id: string
    title: string
    description?: string
    status: "completed" | "active" | "inactive"
    content?: React.ReactNode
    icon?: React.ReactNode
}

interface StepperProps {
    steps: Step[]
    className?: string
    orientation?: "horizontal" | "vertical"
    showContent?: boolean
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
    ({ steps, className, orientation = "horizontal", showContent = false, ...props }, ref) => {
        const activeStep = steps.find(step => step.status === "active")

        return (
            <div
                ref={ref}
                className={cn(
                    "flex",
                    orientation === "horizontal" ? "flex-col" : "flex-col",
                    className
                )}
                {...props}
            >
                {/* Stepper Navigation */}
                <div
                    className={cn(
                        "flex",
                        orientation === "horizontal" ? "flex-row items-center" : "flex-col"
                    )}
                >
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div
                                className={cn(
                                    "flex",
                                    orientation === "horizontal" ? "flex-col items-center" : "flex-col"
                                )}
                            >
                                {/* Step Circle */}
                                <div
                                    className={cn(
                                        "relative flex items-center justify-center rounded-full border-2 transition-all duration-200",
                                        "w-10 h-10 text-sm font-semibold",
                                        {
                                            // Completed state
                                            "bg-primary border-primary text-primary-foreground":
                                                step.status === "completed",
                                            // Active state - slightly different styling to distinguish from completed
                                            "bg-primary/90 border-primary text-primary-foreground ring-2 ring-primary/20":
                                                step.status === "active",
                                            // Inactive state
                                            "bg-background border-muted-foreground/30 text-muted-foreground":
                                                step.status === "inactive",
                                        }
                                    )}
                                >
                                    {step.status === "completed" ? (
                                        <Check className="w-5 h-5" />
                                    ) : step.status === "active" && step.icon ? (
                                        step.icon
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>

                                {/* Step Content */}
                                <div
                                    className={cn(
                                        orientation === "horizontal" ? "mt-2 text-center" : "ml-3 mt-2"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "text-sm font-medium transition-colors",
                                            {
                                                "text-foreground": step.status === "active" || step.status === "completed",
                                                "text-muted-foreground": step.status === "inactive",
                                            }
                                        )}
                                    >
                                        {step.title}
                                    </div>
                                    {step.description && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {step.description}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "transition-colors duration-200",
                                        orientation === "horizontal"
                                            ? "flex-1 h-0.5 mx-4 min-w-8 self-start mt-5"
                                            : "w-0.5 h-8 ml-5 my-2",
                                        {
                                            "bg-primary": step.status === "completed",
                                            "bg-muted-foreground/30": step.status === "active" || step.status === "inactive",
                                        }
                                    )}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step Content Area */}
                {showContent && activeStep && activeStep.content && (
                    <div className="mt-6 p-6 border rounded-lg bg-card">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">{activeStep.title}</h3>
                            {activeStep.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {activeStep.description}
                                </p>
                            )}
                        </div>
                        <div>{activeStep.content}</div>
                    </div>
                )}
            </div>
        )
    }
)

Stepper.displayName = "Stepper"

export { Stepper, type StepperProps }