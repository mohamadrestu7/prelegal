export interface MndaFormData {
  purpose: string
  effectiveDate: string
  mndaTermType: 'fixed' | 'at-will'
  mndaTermYears: string
  confidentialityTermType: 'fixed' | 'perpetual'
  confidentialityTermYears: string
  governingLaw: string
  jurisdiction: string
  modifications: string
  party1PrintName: string
  party1Title: string
  party1Company: string
  party1Address: string
  party2PrintName: string
  party2Title: string
  party2Company: string
  party2Address: string
}

export const defaultFormData: MndaFormData = {
  purpose: 'Evaluating whether to enter into a business relationship with the other party.',
  effectiveDate: '',
  mndaTermType: 'fixed',
  mndaTermYears: '1',
  confidentialityTermType: 'fixed',
  confidentialityTermYears: '1',
  governingLaw: '',
  jurisdiction: '',
  modifications: '',
  party1PrintName: '',
  party1Title: '',
  party1Company: '',
  party1Address: '',
  party2PrintName: '',
  party2Title: '',
  party2Company: '',
  party2Address: '',
}
