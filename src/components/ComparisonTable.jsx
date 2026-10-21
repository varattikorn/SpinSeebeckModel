import React from 'react';
import { elementsData } from '../physics_models/elementsData';
import { referenceData } from '../physics_models/referenceData';
import { calculateVishe, calculateVane, predictVishe, aneCoefficient } from '../physics_models/calculations';

function predict(ref) {
  if (ref.symbol) {
    const el = elementsData.find(e => e.symbol === ref.symbol);
    return { ishe: calculateVishe(el, ref.t, ref.deltaT), ane: calculateVane(el, ref.deltaT) };
  }
  return {
    ishe: predictVishe({ theta: ref.theta, lambda: ref.lambda, rhoFilm: ref.rhoFilm, t: ref.t, deltaT: ref.deltaT }),
    ane: aneCoefficient(ref.moment) * ref.deltaT
  };
}

export default function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="p-2">ตัวอย่าง</th>
            <th className="p-2">V_ISHE ทำนาย / ทดลอง (μV)</th>
            <th className="p-2">V_ANE ทำนาย / ทดลอง (μV)</th>
            <th className="p-2">ที่มา</th>
          </tr>
        </thead>
        <tbody>
          {referenceData.map(ref => {
            const p = predict(ref);
            return (
              <tr key={ref.label} className="border-t border-slate-200">
                <td className="p-2 font-semibold">{ref.label} · ΔT = {ref.deltaT} K</td>
                <td className="p-2">{p.ishe.toFixed(2)} / {ref.measured.vIshe}</td>
                <td className="p-2">{p.ane.toFixed(2)} / {ref.measured.vAne}</td>
                <td className="p-2 text-xs text-slate-500">{ref.source}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
