// src/physics_models/calculations.js
// ค่าที่ต้อง calibrate / ตรวจที่มา อยู่ที่นี่ที่เดียว
 
export const CALIBRATION = {
  // Pt: θ_SH = 0.014 จาก Miao PRL 111, 066602 (2013)
  // λ_sf และ ρ0 ของ Pt เป็นค่าตัวอย่างจากวรรณกรรม -> ใส่ที่มาที่ตรวจแล้วเอง
  PT: { Z: 78, theta: 0.014, lambda: 1.4, rho0: 10.6 },
  // จุด calibrate แรงดัน: Pt(3 nm)/YIG ให้ ≈ 9.9 µV ที่ ΔT = 10 K (Miao 2013, Fig. 2b)
  REF_VISHE: { value: 9.9, t: 3, deltaT: 10 },
  // จุด calibrate ANE: Py(5 nm) ให้ ≈ 0.9 µV ที่ 10 K (Miao 2013); โมเมนต์ Py ≈ 1 µB (ประมาณ)
  REF_ANE: { value: 0.9, deltaT: 10, moment: 1.0 },
  RHO_L: 60,             // ρ·ℓ ≈ ค่าคงที่ (µΩ·cm·nm) ใช้ประมาณ mean free path
  SPECULARITY: 0,        // p ในทฤษฎี Fuchs–Sondheimer
  FM_LAMBDA_FACTOR: 0.1, // ferromagnet มี λ_sf สั้นลง (ประมาณการ)
  NON_TRANSITION_SH: 0.2 // ตัวคูณ θ_SH ของธาตุที่ไม่ใช่ transition metal (ประมาณการ)
};
 
// โมเมนต์อิ่มตัวของ ferromagnet ที่อุณหภูมิห้อง (µB/atom): Fe, Co, Ni
export const FERROMAGNET_MOMENTS = { 26: 2.22, 27: 1.72, 28: 0.62 };
 
/* ---------- ฟังก์ชันพื้นฐาน ---------- */
 
// ρ(t) ฟิล์มบาง: ประมาณแบบ Fuchs–Sondheimer (ใช้ได้ดีเมื่อ t > ℓ)
export function filmResistivity(rho0, t) {
  const ell = CALIBRATION.RHO_L / rho0;
  return rho0 * (1 + 0.375 * (1 - CALIBRATION.SPECULARITY) * (ell / t));
}
 
// θ_SH · λ · (ρ/t) · tanh(t / 2λ)   (ยังไม่คูณค่าคงที่/ΔT)
function rawVishe({ theta, lambda, rhoFilm, t }) {
  if (!lambda || lambda <= 0 || !t || t <= 0) return 0;
  return theta * lambda * (rhoFilm / t) * Math.tanh(t / (2 * lambda));
}
 
const kVolt = () => {
  const { PT, REF_VISHE: r } = CALIBRATION;
  const ref = rawVishe({ theta: PT.theta, lambda: PT.lambda, rhoFilm: filmResistivity(PT.rho0, r.t), t: r.t });
  return r.value / (r.deltaT * ref);
};
const kAne = () => CALIBRATION.REF_ANE.value / (CALIBRATION.REF_ANE.deltaT * CALIBRATION.REF_ANE.moment);
 
// ใช้ตรงๆ กับวัสดุที่ไม่ใช่ธาตุเดี่ยว (เช่น Py) โดยระบุ ρ ของฟิล์มเอง
export function predictVishe({ theta, lambda, rhoFilm, t, deltaT }) {
  return kVolt() * deltaT * rawVishe({ theta, lambda, rhoFilm, t });
}
 
/* ---------- โมเดลทำนายพารามิเตอร์ ---------- */
 
// โมเมนต์อะตอมแบบ Hund (spin-only) — ใช้แสดงอ้างอิงเท่านั้น ไม่ใช่โมเมนต์ของโลหะ
export function predictMagneticMoment(dElectrons) {
  if (dElectrons === undefined || dElectrons <= 0 || dElectrons >= 10) return 0;
  const n = dElectrons <= 5 ? dElectrons : 10 - dElectrons;
  return Number(Math.sqrt(n * (n + 2)).toFixed(2));
}
 
export const getFerromagnetMoment = (Z) => FERROMAGNET_MOMENTS[Z] ?? 0;
 
// θ_SH ∝ sign · Z^4 โดย scale ให้ Pt = 0.014
export function predictSpinHallAngle(Z, dElectrons, category) {
  const { PT, NON_TRANSITION_SH } = CALIBRATION;
  const C = PT.theta / Math.pow(PT.Z, 4);
  const sign = dElectrons <= 5 ? -1 : 1;
  const factor = category === 'transition' ? 1 : NON_TRANSITION_SH;
  return Number((sign * factor * C * Math.pow(Z, 4)).toFixed(5));
}
 
// λ_s ∝ 1/(ρ Z²) โดย scale ให้ Pt = CALIBRATION.PT.lambda
export function predictSpinDiffusionLength(Z, rho0, isMagnetic) {
  const { PT, FM_LAMBDA_FACTOR } = CALIBRATION;
  const C = PT.lambda * PT.rho0 * Math.pow(PT.Z, 2);
  const lambda = C / (rho0 * Z * Z);
  return Number((isMagnetic ? lambda * FM_LAMBDA_FACTOR : lambda).toFixed(2));
}
 
// สัมประสิทธิ์ ANE (µV/K) ∝ โมเมนต์อิ่มตัว
export const aneCoefficient = (moment) => Number((kAne() * moment).toFixed(4));
 
/* ---------- ฟังก์ชันที่ UI เรียกใช้ ---------- */
 
const usable = (el) => el.status === 'ok' && el.spinDiffusionLength > 0;
 
// Js(z)/Js(0) — Eq.(1)
export function calculateJsProfile(z, thickness, lambda_s, Js0 = 1.0) {
  if (!lambda_s || !thickness) return 0;
  return Js0 * Math.sinh((thickness - z) / lambda_s) / Math.sinh(thickness / lambda_s);
}
 
// V_ISHE (µV) — Eq.(2), ใช้ ρ(t) ของฟิล์ม
export function calculateVishe(el, t, deltaT) {
  if (!usable(el)) return 0;
  return predictVishe({
    theta: el.spinHallAngle, lambda: el.spinDiffusionLength,
    rhoFilm: filmResistivity(el.resistivity, t), t, deltaT
  });
}
 
// V_ISHE / ρ — Eq.(3) (หารด้วย ρ ของฟิล์มที่ความหนา t)
export function calculateVisheOverRho(el, t, deltaT) {
  if (!usable(el)) return 0;
  return calculateVishe(el, t, deltaT) / filmResistivity(el.resistivity, t);
}
 
export const calculateVane = (el, deltaT) => (el.status === 'ok' ? el.aneCoefficient * deltaT : 0);
 
export const calculateVsse = (el, t, deltaT) => calculateVishe(el, t, deltaT) + calculateVane(el, deltaT);
 
// S_SSE = V_SSE/ΔT (µV/K) — คำนวณที่ ΔT = 1 K จึงไม่เป็น 0 เมื่อ slider = 0
export const calculateSSECoefficient = (el, t) => calculateVsse(el, t, 1);
 