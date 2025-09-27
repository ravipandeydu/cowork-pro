import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface SectionCardData {
  id: string
  title: string
  value: string | number
  description: string
  trend: {
    value: string
    isPositive: boolean
    icon?: ReactNode
  }
  footer?: {
    mainText: string
    subText: string
    icon?: ReactNode
  }
}

export interface SectionCardsProps {
  cards: SectionCardData[]
  className?: string
}

export function SectionCards({ cards, className = "" }: SectionCardsProps) {
  return (
    <div className={`*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 ${className}`}>
      {cards.map((card) => (
        <Card key={card.id} className="@container/card">
          <CardHeader>
            <CardDescription>{card.description}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.trend.icon || (card.trend.isPositive ? <IconTrendingUp /> : <IconTrendingDown />)}
                {card.trend.value}
              </Badge>
            </CardAction>
          </CardHeader>
          {card.footer && (
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.footer.mainText}{" "}
                {card.footer.icon || (card.trend.isPositive ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />)}
              </div>
              <div className="text-muted-foreground">
                {card.footer.subText}
              </div>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}

// Default data for backward compatibility
export const defaultSectionCards: SectionCardData[] = [
  {
    id: "total-revenue",
    title: "Total Revenue",
    value: "$1,250.00",
    description: "Total Revenue",
    trend: {
      value: "+12.5%",
      isPositive: true,
    },
    footer: {
      mainText: "Trending up this month",
      subText: "Visitors for the last 6 months",
    },
  },
  {
    id: "new-customers",
    title: "New Customers",
    value: "1,234",
    description: "New Customers",
    trend: {
      value: "-20%",
      isPositive: false,
    },
    footer: {
      mainText: "Down 20% this period",
      subText: "Acquisition needs attention",
    },
  },
  {
    id: "active-accounts",
    title: "Active Accounts",
    value: "45,678",
    description: "Active Accounts",
    trend: {
      value: "+12.5%",
      isPositive: true,
    },
    footer: {
      mainText: "Strong user retention",
      subText: "Engagement exceed targets",
    },
  },
  {
    id: "growth-rate",
    title: "Growth Rate",
    value: "4.5%",
    description: "Growth Rate",
    trend: {
      value: "+4.5%",
      isPositive: true,
    },
    footer: {
      mainText: "Steady performance increase",
      subText: "Meets growth projections",
    },
  },
]
