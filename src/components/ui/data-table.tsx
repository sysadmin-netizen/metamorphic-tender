import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

function isNumericValue(value: unknown): boolean {
  if (typeof value === 'number') return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && !isNaN(Number(trimmed));
  }
  return false;
}

function getCellValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No data available.',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-stone-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="sticky top-0 z-10 bg-stone-50">
            {columns.map((col, colIdx) => (
              <th
                key={col.key}
                className={[
                  'whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500',
                  colIdx === 0
                    ? 'sticky left-0 z-20 bg-stone-50'
                    : '',
                ].join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
            >
              {columns.map((col, colIdx) => {
                const rawValue = getCellValue(row, col.key);
                const rendered = col.render
                  ? col.render(row)
                  : String(rawValue ?? '');
                const numeric =
                  !col.render && isNumericValue(rawValue);

                return (
                  <td
                    key={col.key}
                    className={[
                      'whitespace-nowrap px-4 py-3 text-stone-900',
                      colIdx === 0
                        ? 'sticky left-0 z-10 bg-inherit'
                        : '',
                      numeric ? 'font-mono tabular-nums text-right' : '',
                    ].join(' ')}
                  >
                    {rendered}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
