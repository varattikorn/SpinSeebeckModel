

import {
  predictMagneticMoment, getFerromagnetMoment, predictSpinHallAngle,
  predictSpinDiffusionLength, aneCoefficient
} from './calculations';

const NO_FILM = new Set(['nonmetal', 'noble-gas', 'halogen', 'metalloid']);
const RADIOACTIVE = new Set([43, 61, 84, 88, 89, 90, 91, 92, 93, 94, 95, 96]);

// ok | insulator (ฉนวน/สารกึ่งตัวนำ) | nodata (ไม่มีข้อมูล) | liquid
function getStatus(id, category, rho) {
  if (id === 80) return 'liquid'; // Hg ทำฟิล์มที่อุณหภูมิห้องไม่ได้
  if (rho !== 999999) return 'ok';
  return NO_FILM.has(category) ? 'insulator' : 'nodata';
}
// โครงสร้าง: [Z, Symbol, Name, Group, Period, Category, d-Electrons, Resistivity (μΩ·cm)]
// หมายเหตุ: ธาตุที่ไม่ใช่โลหะ หรือเป็นก๊าซ จะตั้งค่าความต้านทาน (ρ) สูงมาก (999999) เพื่อให้กระแสสปินเป็น 0 ตามทฤษฎี
const rawDataArray = [
  [1, 'H', 'Hydrogen', 1, 1, 'nonmetal', 0, 999999], [2, 'He', 'Helium', 18, 1, 'noble-gas', 0, 999999],
  [3, 'Li', 'Lithium', 1, 2, 'alkali', 0, 9.28], [4, 'Be', 'Beryllium', 2, 2, 'alkaline-earth', 0, 3.56],
  [5, 'B', 'Boron', 13, 2, 'metalloid', 0, 999999], [6, 'C', 'Carbon', 14, 2, 'nonmetal', 0, 999999], [7, 'N', 'Nitrogen', 15, 2, 'nonmetal', 0, 999999], [8, 'O', 'Oxygen', 16, 2, 'nonmetal', 0, 999999], [9, 'F', 'Fluorine', 17, 2, 'halogen', 0, 999999], [10, 'Ne', 'Neon', 18, 2, 'noble-gas', 0, 999999],
  [11, 'Na', 'Sodium', 1, 3, 'alkali', 0, 4.77], [12, 'Mg', 'Magnesium', 2, 3, 'alkaline-earth', 0, 4.39],
  [13, 'Al', 'Aluminum', 13, 3, 'post-transition', 0, 2.65], [14, 'Si', 'Silicon', 14, 3, 'metalloid', 0, 999999], [15, 'P', 'Phosphorus', 15, 3, 'nonmetal', 0, 999999], [16, 'S', 'Sulfur', 16, 3, 'nonmetal', 0, 999999], [17, 'Cl', 'Chlorine', 17, 3, 'halogen', 0, 999999], [18, 'Ar', 'Argon', 18, 3, 'noble-gas', 0, 999999],
  [19, 'K', 'Potassium', 1, 4, 'alkali', 0, 7.59], [20, 'Ca', 'Calcium', 2, 4, 'alkaline-earth', 0, 3.36],
  [21, 'Sc', 'Scandium', 3, 4, 'transition', 1, 56.2], [22, 'Ti', 'Titanium', 4, 4, 'transition', 2, 42.0], [23, 'V', 'Vanadium', 5, 4, 'transition', 3, 19.7], [24, 'Cr', 'Chromium', 6, 4, 'transition', 5, 12.5], [25, 'Mn', 'Manganese', 7, 4, 'transition', 5, 144], [26, 'Fe', 'Iron', 8, 4, 'transition', 6, 9.71], [27, 'Co', 'Cobalt', 9, 4, 'transition', 7, 6.24], [28, 'Ni', 'Nickel', 10, 4, 'transition', 8, 6.99], [29, 'Cu', 'Copper', 11, 4, 'transition', 10, 1.68], [30, 'Zn', 'Zinc', 12, 4, 'transition', 10, 5.90],
  [31, 'Ga', 'Gallium', 13, 4, 'post-transition', 10, 14.0], [32, 'Ge', 'Germanium', 14, 4, 'metalloid', 10, 999999], [33, 'As', 'Arsenic', 15, 4, 'metalloid', 10, 33.3], [34, 'Se', 'Selenium', 16, 4, 'nonmetal', 10, 999999], [35, 'Br', 'Bromine', 17, 4, 'halogen', 10, 999999], [36, 'Kr', 'Krypton', 18, 4, 'noble-gas', 10, 999999],
  [37, 'Rb', 'Rubidium', 1, 5, 'alkali', 0, 12.8], [38, 'Sr', 'Strontium', 2, 5, 'alkaline-earth', 0, 13.2],
  [39, 'Y', 'Yttrium', 3, 5, 'transition', 1, 59.6], [40, 'Zr', 'Zirconium', 4, 5, 'transition', 2, 42.1], [41, 'Nb', 'Niobium', 5, 5, 'transition', 4, 15.2], [42, 'Mo', 'Molybdenum', 6, 5, 'transition', 5, 5.34], [43, 'Tc', 'Technetium', 7, 5, 'transition', 5, 20.0], [44, 'Ru', 'Ruthenium', 8, 5, 'transition', 7, 7.10], [45, 'Rh', 'Rhodium', 9, 5, 'transition', 8, 4.33], [46, 'Pd', 'Palladium', 10, 5, 'transition', 10, 10.54], [47, 'Ag', 'Silver', 11, 5, 'transition', 10, 1.59], [48, 'Cd', 'Cadmium', 12, 5, 'transition', 10, 7.27],
  [49, 'In', 'Indium', 13, 5, 'post-transition', 10, 8.37], [50, 'Sn', 'Tin', 14, 5, 'post-transition', 10, 11.5], [51, 'Sb', 'Antimony', 15, 5, 'metalloid', 10, 41.7], [52, 'Te', 'Tellurium', 16, 5, 'metalloid', 10, 999999], [53, 'I', 'Iodine', 17, 5, 'halogen', 10, 999999], [54, 'Xe', 'Xenon', 18, 5, 'noble-gas', 10, 999999],
  [55, 'Cs', 'Cesium', 1, 6, 'alkali', 0, 20.5], [56, 'Ba', 'Barium', 2, 6, 'alkaline-earth', 0, 33.2],
  // Lanthanides (57-71)
  [57, 'La', 'Lanthanum', 3, 8, 'lanthanide', 1, 61.5], [58, 'Ce', 'Cerium', 4, 8, 'lanthanide', 1, 74.4], [59, 'Pr', 'Praseodymium', 5, 8, 'lanthanide', 0, 70.0], [60, 'Nd', 'Neodymium', 6, 8, 'lanthanide', 0, 64.3], [61, 'Pm', 'Promethium', 7, 8, 'lanthanide', 0, 75.0], [62, 'Sm', 'Samarium', 8, 8, 'lanthanide', 0, 94.0], [63, 'Eu', 'Europium', 9, 8, 'lanthanide', 0, 90.0], [64, 'Gd', 'Gadolinium', 10, 8, 'lanthanide', 1, 131.0], [65, 'Tb', 'Terbium', 11, 8, 'lanthanide', 0, 115.0], [66, 'Dy', 'Dysprosium', 12, 8, 'lanthanide', 0, 92.6], [67, 'Ho', 'Holmium', 13, 8, 'lanthanide', 0, 81.4], [68, 'Er', 'Erbium', 14, 8, 'lanthanide', 0, 86.0], [69, 'Tm', 'Thulium', 15, 8, 'lanthanide', 0, 67.6], [70, 'Yb', 'Ytterbium', 16, 8, 'lanthanide', 0, 25.0], [71, 'Lu', 'Lutetium', 17, 8, 'lanthanide', 1, 58.2],
  // Back to main table
  [72, 'Hf', 'Hafnium', 4, 6, 'transition', 2, 33.1], [73, 'Ta', 'Tantalum', 5, 6, 'transition', 3, 13.1], [74, 'W', 'Tungsten', 6, 6, 'transition', 4, 5.28], [75, 'Re', 'Rhenium', 7, 6, 'transition', 5, 19.3], [76, 'Os', 'Osmium', 8, 6, 'transition', 6, 8.12], [77, 'Ir', 'Iridium', 9, 6, 'transition', 7, 4.71], [78, 'Pt', 'Platinum', 10, 6, 'transition', 9, 10.6], [79, 'Au', 'Gold', 11, 6, 'transition', 10, 2.21], [80, 'Hg', 'Mercury', 12, 6, 'transition', 10, 95.8],
  [81, 'Tl', 'Thallium', 13, 6, 'post-transition', 10, 18.0], [82, 'Pb', 'Lead', 14, 6, 'post-transition', 10, 20.8], [83, 'Bi', 'Bismuth', 15, 6, 'post-transition', 10, 129.0], [84, 'Po', 'Polonium', 16, 6, 'post-transition', 10, 40.0], [85, 'At', 'Astatine', 17, 6, 'halogen', 10, 999999], [86, 'Rn', 'Radon', 18, 6, 'noble-gas', 10, 999999],
  [87, 'Fr', 'Francium', 1, 7, 'alkali', 0, 999999], [88, 'Ra', 'Radium', 2, 7, 'alkaline-earth', 0, 100.0],
  // Actinides (89-103)
  [89, 'Ac', 'Actinium', 3, 9, 'actinide', 1, 999999], [90, 'Th', 'Thorium', 4, 9, 'actinide', 2, 14.7], [91, 'Pa', 'Protactinium', 5, 9, 'actinide', 1, 17.7], [92, 'U', 'Uranium', 6, 9, 'actinide', 1, 28.0], [93, 'Np', 'Neptunium', 7, 9, 'actinide', 1, 122.0], [94, 'Pu', 'Plutonium', 8, 9, 'actinide', 0, 146.0], [95, 'Am', 'Americium', 9, 9, 'actinide', 0, 68.0], [96, 'Cm', 'Curium', 10, 9, 'actinide', 1, 125.0], [97, 'Bk', 'Berkelium', 11, 9, 'actinide', 0, 999999], [98, 'Cf', 'Californium', 12, 9, 'actinide', 0, 999999], [99, 'Es', 'Einsteinium', 13, 9, 'actinide', 0, 999999], [100, 'Fm', 'Fermium', 14, 9, 'actinide', 0, 999999], [101, 'Md', 'Mendelevium', 15, 9, 'actinide', 0, 999999], [102, 'No', 'Nobelium', 16, 9, 'actinide', 0, 999999], [103, 'Lr', 'Lawrencium', 17, 9, 'actinide', 1, 999999],
  // Back to main table (Superheavy elements)
  [104, 'Rf', 'Rutherfordium', 4, 7, 'transition', 2, 999999], [105, 'Db', 'Dubnium', 5, 7, 'transition', 3, 999999], [106, 'Sg', 'Seaborgium', 6, 7, 'transition', 4, 999999], [107, 'Bh', 'Bohrium', 7, 7, 'transition', 5, 999999], [108, 'Hs', 'Hassium', 8, 7, 'transition', 6, 999999], [109, 'Mt', 'Meitnerium', 9, 7, 'transition', 7, 999999], [110, 'Ds', 'Darmstadtium', 10, 7, 'transition', 8, 999999], [111, 'Rg', 'Roentgenium', 11, 7, 'transition', 9, 999999], [112, 'Cn', 'Copernicium', 12, 7, 'transition', 10, 999999], [113, 'Nh', 'Nihonium', 13, 7, 'post-transition', 10, 999999], [114, 'Fl', 'Flerovium', 14, 7, 'post-transition', 10, 999999], [115, 'Mc', 'Moscovium', 15, 7, 'post-transition', 10, 999999], [116, 'Lv', 'Livermorium', 16, 7, 'post-transition', 10, 999999], [117, 'Ts', 'Tennessine', 17, 7, 'halogen', 10, 999999], [118, 'Og', 'Oganesson', 18, 7, 'noble-gas', 10, 999999]
];

// ===== (ส่วนที่แทนท้ายไฟล์) =====
export const elementsData = rawDataArray.map(
  ([id, symbol, name, group, period, category, dElectrons, rho]) => {
    const status = getStatus(id, category, rho);
    const ok = status === 'ok';
    const magneticMoment = ok ? getFerromagnetMoment(id) : 0;
    const isMagnetic = magneticMoment > 0;
    return {
      id, symbol, name, group, period, category, dElectrons, status,
      radioactive: RADIOACTIVE.has(id),
      resistivity: ok ? rho : null,
      atomicMoment: predictMagneticMoment(dElectrons), // Hund (อ้างอิง)
      magneticMoment, isMagnetic,                      // μ_sat ของ ferromagnet
      aneCoefficient: aneCoefficient(magneticMoment),
      spinHallAngle: ok ? predictSpinHallAngle(id, dElectrons, category) : 0,
      spinDiffusionLength: ok ? predictSpinDiffusionLength(id, rho, isMagnetic) : 0
    };
  }
);
