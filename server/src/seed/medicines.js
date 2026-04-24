const medicines = [
  {
    name: 'Paracetamol 650',
    category: 'fever',
    composition: 'Paracetamol',
    alternatives: ['Crocin 650', 'Dolo 650'],
    dosageForm: 'Tablet',
    strength: '650 mg'
  },
  {
    name: 'Crocin 650',
    category: 'fever',
    composition: 'Paracetamol',
    alternatives: ['Paracetamol 650', 'Dolo 650'],
    dosageForm: 'Tablet',
    strength: '650 mg'
  },
  {
    name: 'Dolo 650',
    category: 'fever',
    composition: 'Paracetamol',
    alternatives: ['Paracetamol 650', 'Crocin 650'],
    dosageForm: 'Tablet',
    strength: '650 mg'
  },
  {
    name: 'Cetirizine',
    category: 'cold',
    composition: 'Cetirizine Hydrochloride',
    alternatives: ['Levocetirizine', 'Cetzine'],
    dosageForm: 'Tablet',
    strength: '10 mg'
  },
  {
    name: 'Levocetirizine',
    category: 'cold',
    composition: 'Levocetirizine',
    alternatives: ['Cetirizine', 'Cetzine'],
    dosageForm: 'Tablet',
    strength: '5 mg'
  },
  {
    name: 'Cetzine',
    category: 'cold',
    composition: 'Cetirizine Hydrochloride',
    alternatives: ['Cetirizine', 'Levocetirizine'],
    dosageForm: 'Tablet',
    strength: '10 mg'
  },
  {
    name: 'Amoxicillin 500',
    category: 'infection',
    composition: 'Amoxicillin',
    alternatives: ['Azithromycin 500'],
    dosageForm: 'Capsule',
    strength: '500 mg'
  },
  {
    name: 'Azithromycin 500',
    category: 'infection',
    composition: 'Azithromycin',
    alternatives: ['Amoxicillin 500'],
    dosageForm: 'Tablet',
    strength: '500 mg'
  },
  {
    name: 'Ibuprofen',
    category: 'pain',
    composition: 'Ibuprofen',
    alternatives: ['Aceclofenac', 'Diclofenac Gel'],
    dosageForm: 'Tablet',
    strength: '400 mg'
  },
  {
    name: 'Aceclofenac',
    category: 'pain',
    composition: 'Aceclofenac',
    alternatives: ['Ibuprofen', 'Diclofenac Gel'],
    dosageForm: 'Tablet',
    strength: '100 mg'
  },
  {
    name: 'Diclofenac Gel',
    category: 'pain',
    composition: 'Diclofenac',
    alternatives: ['Ibuprofen', 'Aceclofenac'],
    dosageForm: 'Gel',
    strength: '30 g'
  },
  {
    name: 'ORS Sachet',
    category: 'hydration',
    composition: 'Oral Rehydration Salts',
    alternatives: ['Electral Powder'],
    dosageForm: 'Sachet',
    strength: '21 g'
  },
  {
    name: 'Electral Powder',
    category: 'hydration',
    composition: 'Electrolytes',
    alternatives: ['ORS Sachet'],
    dosageForm: 'Sachet',
    strength: '21.8 g'
  },
  {
    name: 'Salbutamol Inhaler',
    category: 'asthma',
    composition: 'Salbutamol',
    alternatives: ['Budesonide Respules'],
    dosageForm: 'Inhaler',
    strength: '100 mcg'
  },
  {
    name: 'Budesonide Respules',
    category: 'asthma',
    composition: 'Budesonide',
    alternatives: ['Salbutamol Inhaler'],
    dosageForm: 'Respules',
    strength: '0.5 mg'
  }
];

export default medicines;
