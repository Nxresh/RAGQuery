import React from "react"
import { AppSidebar } from "./app-sidebar"
import { ChartAreaInteractive } from "./chart-area-interactive"
import { DataTable } from "./data-table"
import { SectionCards } from "./section-cards"
import { SiteHeader } from "./site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "./ui/sidebar"

const data = [
    { id: "INV-001", status: "Paid", email: "ken99@yahoo.com", amount: "$250.00" },
    { id: "INV-002", status: "Pending", email: "abe45@gmail.com", amount: "$150.00" },
    { id: "INV-003", status: "Unpaid", email: "monserrat44@gmail.com", amount: "$350.00" },
    { id: "INV-004", status: "Paid", email: "silas22@gmail.com", amount: "$450.00" },
    { id: "INV-005", status: "Paid", email: "carmelo87@hotmail.com", amount: "$550.00" },
]

export default function SidebarPage() {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "18rem",
                    "--header-height": "3rem",
                } as React.CSSProperties
            }
        >
            <AppSidebar onNewChat={() => { }} />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <SectionCards />
                            <div className="px-4 lg:px-6">
                                <ChartAreaInteractive />
                            </div>
                            <DataTable data={data} />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
