import React from 'react';
import { Box, Flag, Layers, ListOrdered, MapPin, Scale } from 'lucide-react';
import TruckVisualization from './TruckVisualization';

export interface OptimizationStatsProps {
  result: any;
}

export const OptimizationStats: React.FC<OptimizationStatsProps> = ({ result }) => {
  const efficiencyPct = typeof result?.efficiency === 'number' ? result.efficiency : 0;
  const itemsPlaced = result?.statistics?.items_placed ?? 0;
  const totalItems = result?.statistics?.total_items ?? (result?.placed_items?.length ?? 0) + (result?.unplaced_items?.length ?? 0);
  const totalWeight = typeof result?.total_weight === 'number' ? result.total_weight : 0;
  const execTime = typeof result?.execution_time === 'number' ? result.execution_time : 0;

  const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow p-4">
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-800">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Efficiency" value={`${efficiencyPct}%`} />
      <StatCard label="Items Placed" value={`${itemsPlaced}/${totalItems}`} />
      <StatCard label="Total Weight" value={`${totalWeight.toFixed(2)} kg`} />
      <StatCard label="Execution Time" value={`${execTime.toFixed(3)} s`} />
    </div>
  );
};

export interface OptimizationManifestProps {
  result: any;
  fillHeight?: boolean;
  selectedItemId?: string | null;
  onSelectItem?: (id: string) => void;
}

export const OptimizationManifest: React.FC<OptimizationManifestProps> = ({
  result,
  fillHeight = false,
  selectedItemId,
  onSelectItem,
}) => {
  const placedItems: any[] = Array.isArray(result?.placed_items) ? result.placed_items : [];

  const getPos = (item: any) => {
    const p = item?.position;
    if (Array.isArray(p) && p.length >= 3) return { x: Number(p[0]) || 0, y: Number(p[1]) || 0, z: Number(p[2]) || 0 };
    if (p && typeof p === 'object') return { x: Number(p.x) || 0, y: Number(p.y) || 0, z: Number(p.z) || 0 };
    return { x: 0, y: 0, z: 0 };
  };

  const getDims = (item: any) => {
    const d = item?.dimensions;
    if (Array.isArray(d) && d.length >= 3) return { l: Number(d[0]) || 0, w: Number(d[1]) || 0, h: Number(d[2]) || 0 };
    if (d && typeof d === 'object') return { l: Number(d.length) || 0, w: Number(d.width) || 0, h: Number(d.height) || 0 };
    return { l: 0, w: 0, h: 0 };
  };

  return (
    <div
      className={[
        'bg-white rounded-xl shadow-md border border-slate-200 border-t-4 border-purple-500 hover:shadow-lg transition-shadow',
        fillHeight ? 'h-full flex flex-col' : '',
      ].join(' ')}
    >
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
        <ListOrdered className="h-5 w-5 text-purple-600" />
        <div className="text-sm font-bold text-slate-800">Loading Sequence</div>
      </div>

      <div
        className={[
          fillHeight ? 'flex-1' : 'max-h-[500px]',
          'overflow-y-auto overflow-x-hidden custom-scrollbar',
        ].join(' ')}
      >
        {placedItems.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="text-sm font-semibold text-slate-900">No placements available</div>
            <div className="mt-1 text-sm text-slate-600">Run optimization to generate a loading manifest.</div>
          </div>
        ) : (
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '40px' }} />
              <col style={{ width: '25px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '50px' }} />
              <col style={{ width: '140px' }} />
            </colgroup>
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left pl-4 pr-2 py-3 font-medium text-slate-600 align-top">Seq</th>
                <th className="text-left px-2 py-3 font-medium text-slate-600 align-top">ID</th>
                <th className="text-left px-2 py-3 font-medium text-slate-600 align-top">
                  <div className="leading-tight">
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span>Route</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Stack • Prio</div>
                  </div>
                </th>
                <th className="text-left px-2 py-3 font-medium text-slate-600 align-top">Coords</th>
                <th className="text-left px-2 py-3 font-medium text-slate-600 align-top">Dims / Weight</th>
              </tr>
            </thead>
            <tbody className="bg-white text-xs">
              {placedItems.map((item, idx) => {
                const pos = getPos(item);
                const dims = getDims(item);
                const id = String(item?.id ?? '');
                const routeRaw = String(item?.route ?? item?.destination ?? '').trim();
                const route = routeRaw || 'No Route';
                const stackabilityRaw = String(item?.stackability || 'stackable');
                const stackabilityLabel =
                  stackabilityRaw === 'unstackable'
                    ? 'Unstackable'
                    : stackabilityRaw === 'semi_stackable'
                      ? 'Semi-stackable'
                      : 'Stackable';
                const priority = String(item?.priority || '—');
                const isSelected = !!selectedItemId && id && String(selectedItemId) === id;

                const stackabilityBadge =
                  stackabilityRaw === 'unstackable'
                    ? 'bg-slate-50 text-slate-800 border-slate-200'
                    : stackabilityRaw === 'semi_stackable'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-cyan-50 text-cyan-700 border-cyan-200';
                const stackabilityIcon =
                  stackabilityRaw === 'unstackable'
                    ? 'text-slate-500'
                    : stackabilityRaw === 'semi_stackable'
                      ? 'text-purple-600'
                      : 'text-cyan-600';

                const p = priority;
                const prioBadge =
                  p === '1'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : p === '2'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : p === '3'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : p === '4'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200';
                const prioIcon =
                  p === '1'
                    ? 'text-red-600'
                    : p === '2'
                      ? 'text-orange-600'
                      : p === '3'
                        ? 'text-amber-600'
                        : p === '4'
                          ? 'text-green-600'
                          : 'text-slate-500';

                return (
                  <tr
                    key={`${id}-${idx}`}
                    className={[
                      'border-b border-slate-100 hover:bg-slate-50 transition-colors',
                      isSelected ? 'bg-slate-50' : '',
                    ].join(' ')}
                    onMouseEnter={() => console.log(`Highlight item ID: ${id}`)}
                    onClick={() => {
                      if (!id) return;
                      onSelectItem?.(id);
                    }}
                    role={onSelectItem ? 'button' : undefined}
                  >
                    <td className="pl-4 pr-2 py-3 text-slate-900 font-mono align-top">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-2 py-3 text-slate-900 font-medium truncate align-top">{id || '—'}</td>
                    <td className="px-2 py-3 text-slate-700 align-top">
                      <div className="text-sm truncate inline-flex items-center gap-2" title={route}>
                        <MapPin className={['h-4 w-4 shrink-0', routeRaw ? 'text-slate-400' : 'text-slate-300'].join(' ')} />
                        <span className={['truncate', routeRaw ? 'text-slate-700' : 'text-slate-500'].join(' ')}>{route}</span>
                      </div>
                      <div className="mt-1 flex flex-col items-start gap-1 text-xs text-slate-500">
                        <span
                          className={[
                            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border w-fit',
                            stackabilityBadge,
                          ].join(' ')}
                          title={stackabilityLabel}
                        >
                          <Layers className={['h-3.5 w-3.5', stackabilityIcon].join(' ')} />
                          <span className="leading-tight max-w-[110px] truncate">{stackabilityLabel}</span>
                        </span>
                        <span
                          className={['inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border w-fit', prioBadge].join(' ')}
                          title={`Priority: ${priority}`}
                        >
                          <Flag className={['h-3.5 w-3.5', prioIcon].join(' ')} />
                          <span className="font-semibold">P{priority}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="font-mono text-[10px] text-slate-500 leading-4">
                        <div>
                          <span className="text-slate-400">X:</span> {pos.x.toFixed(1)}
                        </div>
                        <div>
                          <span className="text-slate-400">Y:</span> {pos.y.toFixed(1)}
                        </div>
                        <div>
                          <span className="text-slate-400">Z:</span> {pos.z.toFixed(1)}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 rounded px-1.5 py-0.5">
                        <Box className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {dims.l.toFixed(2)} × {dims.w.toFixed(2)} × {dims.h.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Scale className="h-3.5 w-3.5 text-slate-400" />
                        <span>{Number(item?.weight || 0).toFixed(2)} kg</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export interface Optimization3DViewerProps {
  truckDimensions: { length: number; width: number; height: number };
  placedItems: any[];
  selectedItemId?: string | null;
  fillHeight?: boolean;
}

export const Optimization3DViewer: React.FC<Optimization3DViewerProps> = ({ truckDimensions, placedItems, selectedItemId, fillHeight = false }) => {
  return (
    <div
      className={[
        'bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex flex-col',
        fillHeight ? 'h-full min-h-0' : 'min-h-[520px]',
      ].join(' ')}
    >
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-2">
        <Box className="h-5 w-5 text-purple-600" />
        <div className="text-sm font-bold text-slate-800">3D Visualization</div>
      </div>
      <div className="p-4 flex-1 min-h-0">
        <TruckVisualization
          truckDimensions={truckDimensions}
          placedItems={placedItems}
          selectedItemId={selectedItemId ?? null}
          containerClassName="h-full w-full"
          useAspectVideo={false}
        />
      </div>
    </div>
  );
};

/**
 * Backwards-compatible default export: composed results block.
 * Prefer importing the named components for layout control:
 * `OptimizationStats`, `OptimizationManifest`, `Optimization3DViewer`.
 */
interface ResultsDisplayProps {
  result: any;
  truckDimensions: { length: number; width: number; height: number };
  selectedItemId?: string | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, truckDimensions, selectedItemId }) => {
  const placedItems: any[] = Array.isArray(result?.placed_items) ? result.placed_items : [];
  return (
    <div className="space-y-6">
      <OptimizationStats result={result} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <OptimizationManifest result={result} />
        </div>
        <div className="lg:col-span-7">
          <Optimization3DViewer truckDimensions={truckDimensions} placedItems={placedItems} selectedItemId={selectedItemId} />
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;