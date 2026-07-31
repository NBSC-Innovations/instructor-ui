import { useState } from 'react';
import { resolveSection, claimSection, createSection, suggestSections } from '../services/classroomService';
import { isValidSectionRow } from '../utils/sectionValidation';

let nextId = 1;

export function useInstructorSetup() {
  const [rows, setRows] = useState([{ id: nextId++, courseCode: '', sectionName: '', suggestions: [], status: null, message: null }]);
  const [submitting, setSubmitting] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(null); // { rowId, courseCode, sectionName }

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: nextId++, courseCode: '', sectionName: '', suggestions: [], status: null, message: null }]);
  }

  function removeRow(id) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  async function refreshSuggestions(id, query) {
    const suggestions = await suggestSections(query);
    updateRow(id, { suggestions });
  }

  function applySuggestion(id, suggestion) {
    updateRow(id, {
      courseCode: suggestion.courses?.code || '',
      sectionName: suggestion.name,
      suggestions: [],
    });
  }

  async function submitRow(row) {
    const { valid, errors } = isValidSectionRow(row);
    if (!valid) {
      updateRow(row.id, { status: 'error', message: Object.values(errors)[0] });
      return false;
    }

    updateRow(row.id, { status: 'checking', message: null });
    try {
      const result = await resolveSection(row.courseCode, row.sectionName);

      if (result.status === 'unclaimed') {
        await claimSection(result.section.id);
        updateRow(row.id, { status: 'joined', message: 'Joined — existing section assigned to you.' });
        return true;
      } else if (result.status === 'already_yours') {
        updateRow(row.id, { status: 'joined', message: 'Already assigned to you.' });
        return true;
      } else if (result.status === 'taken') {
        updateRow(row.id, { status: 'error', message: 'Already assigned to another instructor. Contact an admin if this is wrong.' });
      } else if (result.status === 'not_found') {
        setPendingCreate({ rowId: row.id, courseCode: row.courseCode, sectionName: row.sectionName });
        updateRow(row.id, { status: 'confirming', message: null });
      }
    } catch (err) {
      updateRow(row.id, { status: 'error', message: err.message || 'Something went wrong.' });
    }
    return false;
  }

  async function confirmCreate(onComplete) {
    if (!pendingCreate) return;
    const { rowId, courseCode, sectionName } = pendingCreate;
    try {
      await createSection(courseCode, courseCode, sectionName);
      updateRow(rowId, { status: 'joined', message: 'Created new section, assigned to you.' });
      onComplete?.();
    } catch (err) {
      updateRow(rowId, { status: 'error', message: err.message || 'Could not create section.' });
    } finally {
      setPendingCreate(null);
    }
  }

  function cancelCreate() {
    if (pendingCreate) {
      updateRow(pendingCreate.rowId, { status: null, message: null });
    }
    setPendingCreate(null);
  }

  /** Submits every row sequentially; returns true if at least one row ended up 'joined'. */
  async function submitAll() {
    setSubmitting(true);
    let anyJoined = false;
    for (const row of rows) {
      if (row.courseCode.trim() || row.sectionName.trim()) {
        const joined = await submitRow(row);
        anyJoined = anyJoined || joined;
      }
    }
    setSubmitting(false);
    return anyJoined;
  }

  return {
    rows,
    submitting,
    pendingCreate,
    addRow,
    removeRow,
    updateRow,
    refreshSuggestions,
    applySuggestion,
    submitRow,
    submitAll,
    confirmCreate,
    cancelCreate,
  };
}
