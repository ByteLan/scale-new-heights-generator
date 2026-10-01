import * as SelectPrimitive from '@radix-ui/react-select'
import { Icon } from '@iconify/react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface SelectOption<Value extends string = string> {
  value: Value
  label: ReactNode
  disabled?: boolean
  color?: string
}

export interface SelectGroup<Value extends string = string> {
  label: string
  options: SelectOption<Value>[]
}

interface SelectProps<Value extends string>
  extends Pick<ComponentProps<typeof SelectPrimitive.Content>, 'align' | 'sideOffset' | 'collisionPadding'>,
  Pick<ComponentProps<typeof SelectPrimitive.Root>, 'onOpenChange'> {
  value: Value
  placeholder?: string
  options?: SelectOption<Value>[]
  groups?: SelectGroup<Value>[]
  className?: string
  contentClassName?: string
  viewportClassName?: string
  itemClassName?: string
  trigger?: ReactNode
  triggerLabel?: string
  triggerTitle?: string
  unstyledTrigger?: boolean
  hideIndicator?: boolean
  onValueChange: (value: Value) => void
}

export function Select<Value extends string>({
  value,
  placeholder,
  options,
  groups,
  className,
  contentClassName,
  viewportClassName,
  itemClassName,
  trigger,
  triggerLabel,
  triggerTitle,
  unstyledTrigger,
  hideIndicator,
  align,
  sideOffset,
  collisionPadding = 8,
  onOpenChange,
  onValueChange,
}: SelectProps<Value>) {
  return (
    <SelectPrimitive.Root
      value={value}
      onOpenChange={onOpenChange}
      onValueChange={(next) => onValueChange(next as Value)}
    >
      <SelectPrimitive.Trigger
        className={cn(!unstyledTrigger && 'ui-select-trigger', className)}
        aria-label={triggerLabel}
        title={triggerTitle}
      >
        {trigger ?? (
          <>
            <SelectPrimitive.Value
              className="ui-select-value"
              placeholder={placeholder}
            />
            <SelectPrimitive.Icon asChild>
              <Icon icon="tabler:chevron-down" />
            </SelectPrimitive.Icon>
          </>
        )}
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn('ui-select-content', contentClassName)}
          position="popper"
          align={align}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
        >
          <SelectPrimitive.Viewport className={cn('ui-select-viewport', viewportClassName)}>
            {groups
              ? groups.map((group) => (
                  <SelectPrimitive.Group key={group.label}>
                    <SelectPrimitive.Label className="ui-select-label">
                      {group.label}
                    </SelectPrimitive.Label>
                    {group.options.map((option) => (
                      <SelectItem
                        key={option.value}
                        option={option}
                        className={itemClassName}
                        hideIndicator={hideIndicator}
                      />
                    ))}
                  </SelectPrimitive.Group>
                ))
              : options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    option={option}
                    className={itemClassName}
                    hideIndicator={hideIndicator}
                  />
                ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

function SelectItem({
  option,
  className,
  hideIndicator,
}: {
  option: SelectOption
  className?: string
  hideIndicator?: boolean
}) {
  return (
    <SelectPrimitive.Item
      className={cn('ui-select-item', className)}
      value={option.value}
      disabled={option.disabled}
      style={{ color: option.color }}
    >
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      {hideIndicator ? null : (
        <SelectPrimitive.ItemIndicator className="ui-select-indicator">
          <Icon icon="tabler:check" />
        </SelectPrimitive.ItemIndicator>
      )}
    </SelectPrimitive.Item>
  )
}
