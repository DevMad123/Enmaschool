// ===== src/shared/components/ui/Stepper.tsx =====

import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface StepperStep {
  id: number
  label: string
  description?: string
}

interface StepperProps {
  steps: StepperStep[]
  currentStep: number
  onStepClick?: (stepId: number) => void
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Étapes" className="flex items-center justify-center">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep
        const isCurrent = step.id === currentStep
        const isUpcoming = step.id > currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              disabled={!onStepClick || isUpcoming}
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                'flex flex-col items-center gap-2',
                onStepClick && !isUpcoming ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                  isCompleted && 'border-indigo-600 bg-indigo-600 text-white',
                  isCurrent &&
                    'border-indigo-600 bg-white text-indigo-600 ring-4 ring-indigo-100',
                  isUpcoming && 'border-slate-300 bg-white text-slate-400',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.id}
              </span>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:block whitespace-nowrap',
                  isCurrent && 'text-indigo-600',
                  isCompleted && 'text-slate-700',
                  isUpcoming && 'text-slate-400',
                )}
              >
                {step.label}
              </span>
            </button>

            {!isLast && (
              <div
                className={cn(
                  'mx-3 mb-5 h-0.5 w-16 transition-colors sm:w-20',
                  step.id < currentStep ? 'bg-indigo-600' : 'bg-slate-200',
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
