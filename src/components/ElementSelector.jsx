import React from 'react';
import { elementsData } from '../physics_models/elementsData';

const COLORS = {
  'alkali': 'bg-pink-300 hover:bg-pink-400 text-pink-900',
  'alkaline-earth': 'bg-sky-300 hover:bg-sky-400 text-sky-900',
  'transition': 'bg-rose-300 hover:bg-rose-400 text-rose-900',
  'post-transition': 'bg-purple-300 hover:bg-purple-400 text-purple-900',
  'metalloid': 'bg-orange-300 hover:bg-orange-400 text-orange-900',
  'nonmetal': 'bg-green-300 hover:bg-green-400 text-green-900',
  'halogen': 'bg-cyan-300 hover:bg-cyan-400 text-cyan-900',
  'noble-gas': 'bg-lime-300 hover:bg-lime-400 text-lime-900',
  'lanthanide': 'bg-amber-200 hover:bg-amber-300 text-amber-900',
  'actinide': 'bg-stone-300 hover:bg-stone-400 text-stone-900'
};

const STATUS_LABEL = {
  insulator: 'N/A (ฉนวน/สารกึ่งตัวนำ)',
  nodata: 'ไม่มีข้อมูล',
  liquid: 'ของเหลว (ทำฟิล์มไม่ได้)'
};

// ย้ายออกมานอก component เพื่อไม่ให้ถูกสร้างใหม่ทุกครั้งที่ลาก slider
function ElementBox({ el, isSelected, onSelect }) {
  const style = isSelected
    ? 'bg-blue-600 text-white ring-4 ring-blue-300 scale-110 z-20 shadow-xl'
    : `${COLORS[el.category] || 'bg-gray-200'} opacity-90 hover:opacity-100 shadow-sm`;
  return (
    <button
      onClick={() => onSelect(el)}
      style={{ gridColumn: el.group, gridRow: el.period <= 7 ? el.period : 'auto' }}
      className={`relative flex flex-col items-center justify-center p-1 rounded-sm border border-black/10 transition-all ${style}`}
      title={`${el.name} (Z=${el.id})`}
    >
      <span className="absolute top-0.5 left-1 text-[8px] font-bold opacity-60">{el.id}</span>
      <span className="text-sm md:text-base font-black leading-none mt-1">{el.symbol}</span>
    </button>
  );
}

const mainTable = elementsData.filter(el => el.period <= 7);
const lanthanides = elementsData.filter(el => el.category === 'lanthanide');
const actinides = elementsData.filter(el => el.category === 'actinide');

function Slider({ label, value, min, max, onChange, color }) {
  return (
    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}: {value}</label>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 ${color} rounded-lg appearance-none cursor-pointer`} />
    </div>
  );
}

export default function ElementSelector({ selectedElement: el, onSelectElement, deltaT, setDeltaT, thickness, setThickness }) {
  const ok = el.status === 'ok';
  const rows = [
    ['Z', el.id],
    ['ρ (bulk)', ok ? `${el.resistivity} μΩ·cm` : STATUS_LABEL[el.status]],
    ['θ_SH', ok ? el.spinHallAngle : '-'],
    ['λ_s', ok ? `${el.spinDiffusionLength} nm` : '-'],
    ['μ_sat (ferromagnet)', el.isMagnetic ? `${el.magneticMoment} μ_B` : 'non-magnetic (0)'],
    ['α_ANE', `${el.aneCoefficient} μV/K`]
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid gap-1 mb-4"
            style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gridTemplateRows: 'repeat(7, minmax(36px, 1fr))' }}>
            {mainTable.map(e => <ElementBox key={e.id} el={e} isSelected={el.id === e.id} onSelect={onSelectElement} />)}
            <div className="flex items-center justify-center text-lg font-bold text-slate-500" style={{ gridColumn: 3, gridRow: 6 }}>*</div>
            <div className="flex items-center justify-center text-lg font-bold text-slate-500" style={{ gridColumn: 3, gridRow: 7 }}>**</div>
          </div>
          <div className="grid gap-1 mt-4" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
            <div className="flex items-center justify-end text-xs font-bold text-slate-500 pr-2" style={{ gridColumn: '1 / span 2', gridRow: 1 }}>* Lanthanides</div>
            {lanthanides.map(e => <ElementBox key={e.id} el={e} isSelected={el.id === e.id} onSelect={onSelectElement} />)}
            <div className="flex items-center justify-end text-xs font-bold text-slate-500 pr-2" style={{ gridColumn: '1 / span 2', gridRow: 2 }}>** Actinides</div>
            {actinides.map(e => <ElementBox key={e.id} el={e} isSelected={el.id === e.id} onSelect={onSelectElement} />)}
          </div>
        </div>
      </div>

      <Slider label="ความต่างอุณหภูมิ ΔT (K)" value={deltaT} min={-50} max={50} onChange={setDeltaT} color="bg-blue-200" />
      <Slider label="ความหนาฟิล์ม t (nm)" value={thickness} min={1} max={40} onChange={setThickness} color="bg-purple-200" />

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-inner">
        <h3 className="font-bold text-blue-900 mb-2 border-b border-blue-200 pb-1">
          พารามิเตอร์ทางทฤษฎีของ {el.symbol} ({el.name})
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
          {rows.map(([k, v]) => (
            <div key={k}><span className="font-semibold text-slate-500">{k}:</span> {v}</div>
          ))}
        </div>
        {el.radioactive && <p className="mt-2 text-xs text-amber-700">ธาตุกัมมันตรังสี — ค่าเป็นการประมาณ</p>}
      </div>
    </div>
  );
}
