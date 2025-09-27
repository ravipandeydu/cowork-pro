"use client"

import * as React from "react"
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconGripVertical,
    IconLayoutColumns,
    IconPlus,
    IconArrowUp,
    IconArrowDown,
} from "@tabler/icons-react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    Row,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

// Generic interfaces for dynamic data table
export interface BaseDataItem {
    id: string | number
    [key: string]: any
}

export interface TabConfig {
    value: string
    label: string
    badge?: number
}

export interface DataTableAction {
    label: string
    onClick: (item: BaseDataItem) => void
    variant?: "default" | "destructive"
}

export interface DataTableConfig<T extends BaseDataItem> {
    enableDragAndDrop?: boolean
    enableSelection?: boolean
    enablePagination?: boolean
    enableColumnVisibility?: boolean
    enableSorting?: boolean | string[] // Can be boolean for all columns or array of column keys for specific columns
    initialSorting?: {
        columnKey: string
        direction: 'asc' | 'desc'
    }
    enableTabs?: boolean
    tabs?: TabConfig[]
    defaultTab?: string
    actions?: DataTableAction[]
    actionsAsButtons?: boolean
    addButtonLabel?: string
    onAddClick?: () => void
    customColumnsLabel?: string
    emptyStateMessage?: string
    pageSize?: number
    pageSizeOptions?: number[]
}

export interface DataTableProps<T extends BaseDataItem> {
    data: T[]
    columns: ColumnDef<T>[]
    config?: DataTableConfig<T>
    onDataChange?: (data: T[]) => void
}

// Create a separate component for the drag handle
function DragHandle<T extends BaseDataItem>({
    id,
    enabled = true
}: {
    id: string | number
    enabled?: boolean
}) {
    const { attributes, listeners } = useSortable({
        id,
        disabled: !enabled,
    })

    if (!enabled) return null

    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-7 hover:bg-transparent"
        >
            <IconGripVertical className="text-muted-foreground size-3" />
            <span className="sr-only">Drag to reorder</span>
        </Button>
    )
}

// Generic draggable row component
function DraggableRow<T extends BaseDataItem>({
    row,
    enableDragAndDrop = false
}: {
    row: Row<T>
    enableDragAndDrop?: boolean
}) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.original.id,
        disabled: !enableDragAndDrop,
    })

    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            data-dragging={isDragging}
            ref={enableDragAndDrop ? setNodeRef : undefined}
            className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            style={enableDragAndDrop ? {
                transform: CSS.Transform.toString(transform),
                transition: transition,
            } : undefined}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    )
}

// Helper function to create drag column
export function createDragColumn<T extends BaseDataItem>(): ColumnDef<T> {
    return {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
        size: 40,
    }
}

// Helper function to create selection column
export function createSelectionColumn<T extends BaseDataItem>(): ColumnDef<T> {
    return {
        id: "select",
        header: ({ table }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    }
}

// Helper function to create actions column
export function createActionsColumn<T extends BaseDataItem>(
    actions: DataTableAction[],
    asButtons: boolean = false
): ColumnDef<T> {
    return {
        id: "actions",
        cell: ({ row }) => {
            if (asButtons) {
                return (
                    <div className="flex items-center gap-2">
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant === "destructive" ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => action.onClick(row.original)}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                            size="icon"
                        >
                            <IconGripVertical />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                        {actions.map((action, index) => (
                            <React.Fragment key={index}>
                                <DropdownMenuItem
                                    variant={action.variant}
                                    onClick={() => action.onClick(row.original)}
                                >
                                    {action.label}
                                </DropdownMenuItem>
                                {index < actions.length - 1 && action.variant === "destructive" && (
                                    <DropdownMenuSeparator />
                                )}
                            </React.Fragment>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
        size: asButtons ? 120 : 40,
    }
}

export function DataTable<T extends BaseDataItem>({
    data: initialData,
    columns: baseColumns = [],
    config = {},
    onDataChange,
}: DataTableProps<T>) {
    const {
        enableDragAndDrop = false,
        enableSelection = false,
        enablePagination = true,
        enableColumnVisibility = true,
        enableTabs = false,
        tabs = [],
        defaultTab = tabs[0]?.value,
        actions = [],
        actionsAsButtons = false,
        addButtonLabel = "Add Item",
        onAddClick,
        customColumnsLabel = "Customize Columns",
        emptyStateMessage = "No results.",
        pageSize = 10,
        pageSizeOptions = [10, 20, 30, 40, 50],
        initialSorting,
    } = config

    const [data, setData] = React.useState(() => initialData)
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>(() => {
        if (initialSorting) {
            return [{
                id: initialSorting.columnKey,
                desc: initialSorting.direction === 'desc'
            }]
        }
        return []
    })
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize,
    })
    const [activeTab, setActiveTab] = React.useState(defaultTab || "default")

    const sortableId = React.useId()
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    // Build columns dynamically based on configuration
    const columns = React.useMemo(() => {
        const dynamicColumns: ColumnDef<T>[] = []

        if (enableDragAndDrop) {
            dynamicColumns.push(createDragColumn<T>())
        }

        if (enableSelection) {
            dynamicColumns.push(createSelectionColumn<T>())
        }

        // Ensure baseColumns is an array before spreading
        if (Array.isArray(baseColumns)) {
            dynamicColumns.push(...baseColumns)
        }

        if (actions.length > 0) {
            dynamicColumns.push(createActionsColumn<T>(actions, actionsAsButtons))
        }

        return dynamicColumns
    }, [baseColumns, enableDragAndDrop, enableSelection, actions, actionsAsButtons])

    const dataIds = React.useMemo<UniqueIdentifier[]>(
        () => data?.map(({ id }) => id) || [],
        [data]
    )

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination: enablePagination ? pagination : undefined,
        },
        getRowId: (row) => row.id.toString(),
        enableRowSelection: enableSelection,
        onRowSelectionChange: enableSelection ? setRowSelection : undefined,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: enablePagination ? setPagination : undefined,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (active && over && active.id !== over.id) {
            const newData = arrayMove(data,
                dataIds.indexOf(active.id),
                dataIds.indexOf(over.id)
            )
            setData(newData)
            onDataChange?.(newData)
        }
    }

    // Update data when initialData changes
    React.useEffect(() => {
        setData(initialData)
    }, [initialData])

    const TableContent = () => (
        <div className="overflow-hidden rounded-lg border">
            {enableDragAndDrop ? (
                <DndContext
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                    id={sortableId}
                >
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} colSpan={header.colSpan}>
                                            <SortableHeader 
                                                header={header} 
                                                enableSorting={config.enableSorting || false} 
                                            />
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                <SortableContext
                                    items={dataIds}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {table.getRowModel().rows.map((row) => (
                                        <DraggableRow
                                            key={row.id}
                                            row={row}
                                            enableDragAndDrop={enableDragAndDrop}
                                        />
                                    ))}
                                </SortableContext>
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        {emptyStateMessage}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            ) : (
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} colSpan={header.colSpan}>
                                        <SortableHeader 
                                            header={header} 
                                            enableSorting={config.enableSorting || false} 
                                        />
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <DraggableRow
                                    key={row.id}
                                    row={row}
                                    enableDragAndDrop={false}
                                />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    {emptyStateMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    )

    if (enableTabs && tabs.length > 0) {
        return (
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full flex-col justify-start gap-6"
            >
                <TabsList>
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                            {tab.badge && <Badge variant="secondary">{tab.badge}</Badge>}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {tabs.map((tab) => (
                    <TabsContent
                        key={tab.value}
                        value={tab.value}
                        className="relative flex flex-col gap-4 overflow-auto"
                    >
                        <TableContent />
                        {enablePagination && (
                            <div className="flex items-center justify-between">
                                {enableSelection ? (
                                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                        {table.getFilteredRowModel().rows.length} row(s) selected.
                                    </div>
                                ) : <div></div>}
                                <div className="flex w-full items-center gap-8 lg:w-fit">
                                    <div className="hidden items-center gap-2 lg:flex">
                                        <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                            Rows per page
                                        </Label>
                                        <Select
                                            value={`${table.getState().pagination.pageSize}`}
                                            onValueChange={(value) => {
                                                table.setPageSize(Number(value))
                                            }}
                                        >
                                            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                                <SelectValue
                                                    placeholder={table.getState().pagination.pageSize}
                                                />
                                            </SelectTrigger>
                                            <SelectContent side="top">
                                                {pageSizeOptions.map((pageSize) => (
                                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                                        {pageSize}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                                        {table.getPageCount()}
                                    </div>
                                    <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                        <Button
                                            variant="outline"
                                            className="hidden h-8 w-8 p-0 lg:flex"
                                            onClick={() => table.setPageIndex(0)}
                                            disabled={!table.getCanPreviousPage()}
                                        >
                                            <span className="sr-only">Go to first page</span>
                                            <IconChevronsLeft />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="size-8"
                                            size="icon"
                                            onClick={() => table.previousPage()}
                                            disabled={!table.getCanPreviousPage()}
                                        >
                                            <span className="sr-only">Go to previous page</span>
                                            <IconChevronLeft />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="size-8"
                                            size="icon"
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                        >
                                            <span className="sr-only">Go to next page</span>
                                            <IconChevronRight />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="hidden size-8 lg:flex"
                                            size="icon"
                                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                            disabled={!table.getCanNextPage()}
                                        >
                                            <span className="sr-only">Go to last page</span>
                                            <IconChevronsRight />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        )
    }

    return (
        <div className="w-full flex-col justify-start gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {enableColumnVisibility && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <IconLayoutColumns />
                                    <span className="hidden lg:inline">{customColumnsLabel}</span>
                                    <span className="lg:hidden">Columns</span>
                                    <IconChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {table
                                    .getAllColumns()
                                    .filter(
                                        (column) =>
                                            typeof column.accessorFn !== "undefined" &&
                                            column.getCanHide()
                                    )
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {onAddClick && (
                        <Button variant="outline" size="sm" onClick={onAddClick}>
                            <IconPlus />
                            <span className="hidden lg:inline">{addButtonLabel}</span>
                        </Button>
                    )}
                </div>
            </div>
            <div className="relative flex flex-col gap-4 overflow-auto">
                <TableContent />
                {enablePagination && (
                    <div className="flex items-center justify-between">
                        {enableSelection && (
                            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                {table.getFilteredRowModel().rows.length} row(s) selected.
                            </div>
                        )}
                        <div className="flex w-full items-center gap-8 lg:w-fit">
                            <div className="hidden items-center gap-2 lg:flex">
                                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                    Rows per page
                                </Label>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => {
                                        table.setPageSize(Number(value))
                                    }}
                                >
                                    <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                        <SelectValue
                                            placeholder={table.getState().pagination.pageSize}
                                        />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {pageSizeOptions.map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex w-fit items-center justify-center text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
                            </div>
                            <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to first page</span>
                                    <IconChevronsLeft />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="size-8"
                                    size="icon"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to previous page</span>
                                    <IconChevronLeft />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="size-8"
                                    size="icon"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to next page</span>
                                    <IconChevronRight />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="hidden size-8 lg:flex"
                                    size="icon"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to last page</span>
                                    <IconChevronsRight />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// SortableHeader component for handling column sorting UI
interface SortableHeaderProps {
    header: any;
    enableSorting: boolean | string[];
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ header, enableSorting }) => {
    // Determine if this specific column can be sorted
    const columnId = header.column.id;
    const canSort = (() => {
        if (typeof enableSorting === 'boolean') {
            return enableSorting && header.column.getCanSort();
        }
        // If enableSorting is an array, check if this column is included
        return Array.isArray(enableSorting) && enableSorting.includes(columnId) && header.column.getCanSort();
    })();
    
    const sortDirection = header.column.getIsSorted();

    const handleSort = () => {
        if (canSort) {
            header.column.toggleSorting();
        }
    };

    return (
        <div 
            className={`flex items-center gap-2 ${canSort ? 'cursor-pointer select-none' : ''}`}
            onClick={handleSort}
        >
            <span>
                {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                    )}
            </span>
            {canSort && (
                <div className="flex flex-col">
                    {sortDirection === 'asc' ? (
                        <IconArrowUp size={16} className="text-primary" />
                    ) : sortDirection === 'desc' ? (
                        <IconArrowDown size={16} className="text-primary" />
                    ) : (
                        <div className="flex flex-col opacity-50">
                            <IconArrowUp size={12} className="mb-[-2px]" />
                            <IconArrowDown size={12} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
