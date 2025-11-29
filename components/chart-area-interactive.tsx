

export function ChartAreaInteractive() {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Interactive Chart</h3>
                <p className="text-sm text-muted-foreground">Displaying data for the last 3 months</p>
            </div>
            <div className="p-6 pt-0">
                <div className="h-[300px] w-full bg-neutral-100 rounded-md flex items-center justify-center text-neutral-400">
                    Chart Placeholder Area
                </div>
            </div>
        </div>
    )
}
