

export function SectionCards() {
    return (
        <div className="grid gap-4 px-4 md:grid-cols-3 lg:px-6">
            {[
                { title: "Total Revenue", value: "$45,231.89", change: "+20.1% from last month" },
                { title: "Subscriptions", value: "+2350", change: "+180.1% from last month" },
                { title: "Active Now", value: "+573", change: "+201 since last hour" },
            ].map((card, i) => (
                <div key={i} className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">{card.title}</h3>
                    </div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.change}</p>
                </div>
            ))}
        </div>
    )
}
