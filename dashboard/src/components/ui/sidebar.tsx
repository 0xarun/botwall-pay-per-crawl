import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, isCollapsed, onToggle, children, ...props }, ref) => (
      <div
        ref={ref}
          className={cn(
        "flex h-full flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            className
          )}
          {...props}
        >
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className={cn(
          "font-semibold transition-all duration-300",
          isCollapsed ? "opacity-0" : "opacity-100"
        )}>
          Dashboard
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
            {children}
        </div>
      </div>
    )
)
Sidebar.displayName = "Sidebar"

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    badge?: string
  }[]
  activeItem?: string
  onItemClick: (href: string) => void
}

const SidebarNav = React.forwardRef<HTMLDivElement, SidebarNavProps>(
  ({ className, items, activeItem, onItemClick, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    >
      {items.map((item) => (
        <Button
          key={item.href}
          variant={activeItem === item.href ? "secondary" : "ghost"}
          className={cn(
            "justify-start gap-3 h-10",
            activeItem === item.href && "bg-secondary text-secondary-foreground"
          )}
          onClick={() => onItemClick(item.href)}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.title}</span>
          {item.badge && (
            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {item.badge}
            </span>
          )}
        </Button>
      ))}
    </div>
  )
)
SidebarNav.displayName = "SidebarNav"

export { Sidebar, SidebarNav }
