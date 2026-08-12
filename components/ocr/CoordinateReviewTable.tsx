import React, { useState } from 'react';
import { UTMCoordinate } from '@/types';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, AlertCircle } from 'lucide-react';

interface CoordinateReviewTableProps {
  initialCoordinates: UTMCoordinate[];
  onConfirm: (coords: UTMCoordinate[]) => void;
  onCancel: () => void;
  title?: string;
}

export function CoordinateReviewTable({ initialCoordinates, onConfirm, onCancel, title = "Extracted Coordinates" }: CoordinateReviewTableProps) {
  const [coordinates, setCoordinates] = useState<UTMCoordinate[]>(initialCoordinates);

  const updateCoordinate = (id: string, field: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value);
    setCoordinates(prev => prev.map(coord =>
      coord.id === id ? { ...coord, [field]: isNaN(numValue) ? 0 : numValue } : coord
    ));
  };

  const removeCoordinate = (id: string) => {
    setCoordinates(prev => prev.filter(c => c.id !== id));
  };

  const addCoordinate = () => {
    setCoordinates(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        index: prev.length,
        x: 0,
        y: 0
      }
    ]);
  };

  const handleConfirm = () => {
    // Re-index before confirming
    const finalCoords = coordinates.map((c, i) => ({ ...c, index: i }));
    onConfirm(finalCoords);
  };

  const isLowConfidence = coordinates.length < 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>

      {isLowConfidence && (
        <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-md flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>Some coordinates may need verification. A land boundary needs at least 3 points.</p>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white text-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 font-medium text-gray-500 w-12 text-center">#</th>
              <th className="px-3 py-2 font-medium text-gray-500">X (Easting)</th>
              <th className="px-3 py-2 font-medium text-gray-500">Y (Northing)</th>
              <th className="px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coordinates.map((coord, idx) => (
              <tr key={coord.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-500">{idx}</td>
                <td className="px-1 py-2">
                  <input
                    type="text"
                    value={coord.x || ''}
                    onChange={(e) => updateCoordinate(coord.id, 'x', e.target.value)}
                    className="w-full min-w-[90px] bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors px-1.5 py-1.5 text-sm sm:text-base text-gray-900 font-medium"
                  />
                </td>
                <td className="px-1 py-2">
                  <input
                    type="text"
                    value={coord.y || ''}
                    onChange={(e) => updateCoordinate(coord.id, 'y', e.target.value)}
                    className="w-full min-w-[100px] bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors px-1.5 py-1.5 text-sm sm:text-base text-gray-900 font-medium"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => removeCoordinate(coord.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addCoordinate} className="flex gap-1">
          <Plus size={16} /> Add Row
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={coordinates.length < 3}
          className="flex-1"
        >
          Confirm & Map
        </Button>
      </div>
    </div>
  );
}
