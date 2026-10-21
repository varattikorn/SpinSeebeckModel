// ค่าทดลองสำหรับเทียบกับโมเดล — ตรวจที่มาทุกค่าก่อนส่งงาน
export const referenceData = [
  {
    label: 'Pt(3 nm)/YIG (จุด calibrate)', symbol: 'Pt', t: 3, deltaT: 10,
    measured: { vIshe: 9.9, vAne: 0 },
    source: 'Miao et al., PRL 111, 066602 (2013), Fig. 2b'
  },
  {
    label: 'Py(5 nm)/YIG', t: 5, deltaT: 10,
    theta: 0.005, lambda: 2.5,
    rhoFilm: 55,   // อ่านจาก Fig. 4a ประมาณ — ต้องตรวจ
    moment: 1.0,   // โมเมนต์ Py ประมาณ — ต้องตรวจ
    measured: { vIshe: 3.3, vAne: 0.9 }, // 4.2 − 0.9 µV
    source: 'Miao et al., PRL 111, 066602 (2013), Fig. 3c, Eq.(3)'
  }
  // เพิ่ม Ta, W, Au, Cu ฯลฯ พร้อมที่มาที่นี่
];
