import React, { useState } from 'react';
import { LandMeasurements as MeasurementsType } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LandMeasurementsProps {
  measurements: MeasurementsType | null;
  onSave?: () => void;
}

export function LandMeasurements({ measurements, onSave }: LandMeasurementsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!measurements) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-gray-700 tracking-wider">LAND MEASUREMENTS</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 italic">No land boundary defined. Draw or import points to see measurements.</p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-bold text-gray-700 tracking-wider">LAND MEASUREMENTS</h2>
      </CardHeader>
      
      <div className="divide-y divide-gray-100">
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Area</span>
          <span className="text-lg font-bold text-gray-900">{formatNumber(measurements.area)} m²</span>
        </div>
        
        <div className="p-4 flex justify-between items-center bg-gray-50/30">
          <span className="text-sm font-medium text-gray-600">Perimeter</span>
          <span className="text-base font-semibold text-gray-800">{formatNumber(measurements.perimeter)} m</span>
        </div>
        
        {isExpanded && (
          <>
            <div className="p-4 grid grid-cols-2 gap-4 border-t border-gray-100">
              <div>
                <div className="text-xs text-gray-500 mb-1">Width (bounding box)</div>
                <div className="font-semibold text-gray-800">{formatNumber(measurements.width)} m</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Height (bounding box)</div>
                <div className="font-semibold text-gray-800">{formatNumber(measurements.height)} m</div>
              </div>
            </div>

            {measurements.sides && measurements.sides.length > 0 && (
              <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Side Lengths</h3>
                <div className="space-y-2">
                  {measurements.sides.map((length, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">Side {String.fromCharCode(65 + idx)} (P{idx + 1} &rarr; P{((idx + 1) % measurements.sides.length) + 1})</span>
                      <span className="font-medium text-gray-900">{formatNumber(length)} m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        <div className="flex bg-white rounded-b-lg border-t border-gray-100 divide-x divide-gray-100">
          <button 
            className="flex-1 p-3 flex justify-center items-center text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>Hide details <ChevronUp size={16} className="ml-1" /></>
            ) : (
              <>Show more details <ChevronDown size={16} className="ml-1" /></>
            )}
          </button>
          {onSave && (
            <button 
              className="flex-1 p-3 flex justify-center items-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={onSave}
            >
              Save Property
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
