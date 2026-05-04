import React from 'react';
import { X } from 'lucide-react';
import { PatientFilters, defaultFilters } from '@/lib/patientFilters';

interface ActiveFilterChipsProps {
  filters: PatientFilters;
  updateFilter: <K extends keyof PatientFilters>(key: K, value: PatientFilters[K]) => void;
  clearFilters: () => void;
  doctors: any[];
}

export function ActiveFilterChips({ filters, updateFilter, clearFilters, doctors }: ActiveFilterChipsProps) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.dateFrom || filters.dateTo) {
    let lbl = 'Date: ';
    if (filters.dateFrom && filters.dateTo) lbl += `${filters.dateFrom} to ${filters.dateTo}`;
    else if (filters.dateFrom) lbl += `From ${filters.dateFrom}`;
    else lbl += `Until ${filters.dateTo}`;
    chips.push({ label: lbl, onRemove: () => { updateFilter('dateFrom', null); updateFilter('dateTo', null); }});
  }

  if (filters.genders.length < 3) {
    if (filters.genders.length === 0) {
      chips.push({ label: 'Gender: None', onRemove: () => updateFilter('genders', ['Male', 'Female', 'Other']) });
    } else {
      chips.push({ label: `Gender: ${filters.genders.join(', ')}`, onRemove: () => updateFilter('genders', ['Male', 'Female', 'Other']) });
    }
  }

  if (filters.ageMin > 0 || filters.ageMax < 120) {
    chips.push({ label: `Age: ${filters.ageMin}-${filters.ageMax}`, onRemove: () => { updateFilter('ageMin', 0); updateFilter('ageMax', 120); }});
  }

  if (filters.bloodPressure !== 'any') {
    chips.push({ label: `BP: ${filters.bloodPressure}`, onRemove: () => updateFilter('bloodPressure', 'any') });
  }
  if (filters.sugarLevel !== 'any') {
    chips.push({ label: `Sugar: ${filters.sugarLevel}`, onRemove: () => updateFilter('sugarLevel', 'any') });
  }
  if (filters.heartRate !== 'any') {
    chips.push({ label: `HR: ${filters.heartRate}`, onRemove: () => updateFilter('heartRate', 'any') });
  }
  if (filters.temperature !== 'any') {
    chips.push({ label: `Temp: ${filters.temperature}`, onRemove: () => updateFilter('temperature', 'any') });
  }

  if (filters.hasNotes) chips.push({ label: 'Has Notes', onRemove: () => updateFilter('hasNotes', false) });
  if (filters.hasDocuments) chips.push({ label: 'Has Docs', onRemove: () => updateFilter('hasDocuments', false) });
  if (filters.hasHistory) chips.push({ label: 'Has History', onRemove: () => updateFilter('hasHistory', false) });

  if (filters.symptoms.length > 0) {
    chips.push({ label: `Symptoms: ${filters.symptoms.join(', ')}`, onRemove: () => updateFilter('symptoms', []) });
  }

  if (filters.doctor_id) {
    const doc = doctors.find(d => d.id === filters.doctor_id);
    chips.push({ label: `Doctor: ${doc ? doc.name : filters.doctor_id}`, onRemove: () => updateFilter('doctor_id', null) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 px-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active filters:</span>
      {chips.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
          {c.label}
          <button onClick={c.onRemove} className="hover:bg-blue-200 rounded-full p-0.5 ml-1 transition-colors">
            <X size={10} />
          </button>
        </span>
      ))}
      <button onClick={clearFilters} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline underline-offset-2 ml-2">
        Clear all
      </button>
    </div>
  );
}
