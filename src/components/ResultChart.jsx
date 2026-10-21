import React from 'react';
import Plot from 'react-plotly.js';
import { BlockMath } from 'react-katex';
import {
  calculateJsProfile, calculateVishe, calculateVane, calculateVsse,
  calculateVisheOverRho, calculateSSECoefficient
} from '../physics_models/calculations';

const T_RANGE = Array.from({ length: 40 }, (_, i) => i + 1);
const layout = (x, y) => ({
  xaxis: { title: x }, yaxis: { title: y },
  autosize: true, margin: { l: 60, r: 20, t: 20, b: 40 }
});
const NOTICE = {
  insulator: 'ธาตุนี้เป็นฉนวน/สารกึ่งตัวนำ ไม่มีกระแสสปินแบบโลหะ',
  nodata: 'ยังไม่มีข้อมูลความต้านทานของธาตุนี้',
  liquid: 'ธาตุนี้เป็นของเหลวที่อุณหภูมิห้อง ทำเป็นฟิล์มบางไม่ได้'
};

function Card({ title, formula, children }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 text-center mb-2">{title}</h3>
      <div className="text-center mb-2 text-sm bg-slate-50 p-2 rounded overflow-x-auto">
        <BlockMath math={formula} />
      </div>
      {children}
    </div>
  );
}

export default function ResultChart({ selectedElement: el, deltaT, thickness }) {
  if (el.status !== 'ok') {
    return <div className="p-6 text-center text-slate-600 bg-slate-50 rounded-lg">{NOTICE[el.status]}</div>;
  }

  const vishe = T_RANGE.map(t => calculateVishe(el, t, deltaT));
  const vane = T_RANGE.map(() => calculateVane(el, deltaT));
  const vsse = T_RANGE.map(t => calculateVsse(el, t, deltaT));
  const overRho = T_RANGE.map(t => calculateVisheOverRho(el, t, deltaT));
  const z = Array.from({ length: 50 }, (_, i) => (i / 49) * thickness);
  const js = z.map(v => calculateJsProfile(v, thickness, el.spinDiffusionLength));

  const cur = {
    ishe: calculateVishe(el, thickness, deltaT),
    ane: calculateVane(el, deltaT),
    total: calculateVsse(el, thickness, deltaT),
    s: calculateSSECoefficient(el, thickness)
  };
  const plot = (data, lay, h) => (
    <Plot data={data} layout={lay} useResizeHandler style={{ width: '100%', height: h }} />
  );

  return (
    <div className="w-full flex flex-col space-y-8">
      <Card title="Spatial Spin Current Profile (t = ความหนาที่เลือก)"
        formula="J_s(z) = J_s(0)\,\frac{\sinh((t - z)/\lambda_{sf})}{\sinh(t/\lambda_{sf})}">
        {plot([{ x: z, y: js, type: 'scatter', mode: 'lines', line: { color: '#8b5cf6', width: 3 } }],
          { ...layout('Depth from interface, z (nm)', 'J_s(z) / J_s(0)'), showlegend: false }, '250px')}
      </Card>

      <Card title="Voltage vs Film Thickness"
        formula="V_{\text{ISHE}} \propto \Delta T\,\theta_{SH}\,\lambda_{sf}\,\frac{\rho(t)}{t}\tanh\!\left(\frac{t}{2\lambda_{sf}}\right)">
        {plot([
          { x: T_RANGE, y: vishe, name: 'V_ISHE', type: 'scatter', mode: 'lines', line: { color: '#2563eb', width: 3 } },
          { x: T_RANGE, y: vane, name: 'V_ANE', type: 'scatter', mode: 'lines', line: { color: '#ef4444', width: 2, dash: 'dash' } },
          { x: T_RANGE, y: vsse, name: 'V_SSE', type: 'scatter', mode: 'lines', line: { color: '#16a34a', width: 3 } },
          { x: [thickness], y: [cur.total], type: 'scatter', mode: 'markers', marker: { color: '#8b5cf6', size: 10 }, showlegend: false }
        ], { ...layout('Film thickness, t (nm)', 'Predicted voltage (μV)'), legend: { orientation: 'h', y: -0.2 } }, '300px')}
        <p className="text-xs text-slate-500 text-center mt-2">
          calibrate ให้ Pt(3 nm) ≈ 9.9 μV ที่ ΔT = 10 K · ρ(t) ใช้ Fuchs–Sondheimer โดยประมาณ
        </p>
      </Card>

      <Card title="V_ISHE / ρ vs Thickness (Eq. 3)"
        formula="V_{\text{ISHE}}/\rho \propto \Delta T\,\theta_{SH}\,\frac{\lambda_{sf}}{t}\tanh\!\left(\frac{t}{2\lambda_{sf}}\right)">
        {plot([{ x: T_RANGE, y: overRho, type: 'scatter', mode: 'lines', line: { color: '#0891b2', width: 3 } }],
          { ...layout('Film thickness, t (nm)', 'V_ISHE / ρ (a.u.)'), showlegend: false }, '250px')}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div className="text-xs text-blue-600 font-bold mb-1">ISHE voltage (t = {thickness} nm)</div>
          <div className="text-lg font-black text-blue-900">{cur.ishe.toFixed(4)} μV</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
          <div className="text-xs text-red-600 font-bold mb-1">ANE voltage</div>
          <div className="text-lg font-black text-red-900">{cur.ane.toFixed(4)} μV</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-400 shadow-md">
          <div className="text-xs text-green-700 font-black mb-1">Spin Seebeck coefficient S_SSE = V_SSE / ΔT</div>
          <div className="text-2xl font-black text-green-700">{cur.s.toFixed(4)} <span className="text-sm font-semibold">μV/K</span></div>
        </div>
      </div>
    </div>
  );
}