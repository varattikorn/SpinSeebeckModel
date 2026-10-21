import React, { useState } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import ElementSelector from './components/ElementSelector';
import ResultChart from './components/ResultChart';
import ComparisonTable from './components/ComparisonTable';
import { elementsData } from './physics_models/elementsData';

const Panel = ({ n, color, title, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 ${className}`}>
    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center border-b pb-3">
      <span className={`${color} text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm`}>{n}</span>
      {title}
    </h2>
    {children}
  </div>
);

export default function App() {
  const pt = elementsData.find(e => e.symbol === 'Pt');
  const [selectedElement, setSelectedElement] = useState(pt);
  const [deltaT, setDeltaT] = useState(20);
  const [thickness, setThickness] = useState(15);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold text-blue-900 mb-2">
            The Prediction Model of Spin Seebeck Coefficient on Periodic Table
          </h1>
          <div className="text-slate-500 text-sm md:text-base font-medium">
            <BlockMath math="V_{\text{SSE}} = V_{\text{ISHE}} + V_{\text{ANE}}" />
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <Panel n="1" color="bg-blue-600" title="เลือกธาตุและปรับพารามิเตอร์" className="xl:col-span-4">
            <ElementSelector
              selectedElement={selectedElement} onSelectElement={setSelectedElement}
              deltaT={deltaT} setDeltaT={setDeltaT}
              thickness={thickness} setThickness={setThickness}
            />
          </Panel>
          <Panel n="2" color="bg-green-600" title="ผลจำลองกลไกและแรงดันไฟฟ้า" className="xl:col-span-8">
            <ResultChart selectedElement={selectedElement} deltaT={deltaT} thickness={thickness} />
          </Panel>
        </div>

        <Panel n="3" color="bg-purple-600" title="เปรียบเทียบผลทำนายกับผลทดลอง">
          <ComparisonTable />
        </Panel>
      </div>
    </div>
  );
}
