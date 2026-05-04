import { useState, useMemo } from 'react';
import { PatientFilters, defaultFilters, applyFilters } from '@/lib/patientFilters';

export function usePatientFilters(patients: any[], currentUserId: string | undefined) {
  const [filters, setFilters] = useState<PatientFilters>(defaultFilters);

  const filteredPatients = useMemo(() => {
    if (!currentUserId) return [];
    return applyFilters(patients, filters, currentUserId);
  }, [patients, filters, currentUserId]);

  const updateFilter = <K extends keyof PatientFilters>(key: K, value: PatientFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(defaultFilters);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.genders.length < 3) count++;
    if (filters.ageMin > 0 || filters.ageMax < 120) count++;
    if (filters.bloodPressure !== 'any') count++;
    if (filters.sugarLevel !== 'any') count++;
    if (filters.heartRate !== 'any') count++;
    if (filters.temperature !== 'any') count++;
    if (filters.hasNotes) count++;
    if (filters.hasDocuments) count++;
    if (filters.hasHistory) count++;
    if (filters.symptoms.length > 0) count++;
    if (filters.registrationSource !== 'all') count++;
    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    filteredPatients,
    activeFilterCount
  };
}
