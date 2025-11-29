

export function DataTable({ data }: { data: any[] }) {
    return (
        <div className="px-4 lg:px-6">
            <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {data && data.length > 0 ? (
                            data.map((row, i) => (
                                <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle">{row.id || "INV-001"}</td>
                                    <td className="p-4 align-middle">{row.status || "Paid"}</td>
                                    <td className="p-4 align-middle">{row.email || "user@example.com"}</td>
                                    <td className="p-4 align-middle">{row.amount || "$250.00"}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">INV-001</td>
                                <td className="p-4 align-middle">Paid</td>
                                <td className="p-4 align-middle">user@example.com</td>
                                <td className="p-4 align-middle">$250.00</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
