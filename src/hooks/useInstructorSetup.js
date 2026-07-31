import { useState } from 'react';
import { resolveSectionByCode, claimSection, createSection, suggestSections } from '../services/classroomService';
import { isValidCode, isValidTitle } from '../utils/sectionValidation';

let nextId = 1;

export function useInstructorSetup() {
  const [rows, setRows] = useState([{ id: nextId++, code: '', suggestions: [], status: null, message: null }]);
  const [submitting, setSubmitting] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(null); // { rowId, code, title, titleError }

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: nextId++, code: '', suggestions: [], status: null, message: null }]);
  }

  function removeRow(id) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  async function refreshSuggestions(id, query) {
    const suggestions = await suggestSections(query);
    updateRow(id, { suggestions });
  }

  function applySuggestion(id, suggestion) {
    updateRow(id, { code: suggestion.name, suggestions: [] });
  }

  async function submitRow(row) {
    const { valid, error } = isValidCode(row.code);
    if (!valid) {
      updateRow(row.id, { status: 'error', message: error });
      return;
    }

    updateRow(row.id, { status: 'checking', message: null });
    try {
      const result = await resolveSectionByCode(row.code);

      if (result.status === 'unclaimed') {
        await claimSection(result.section.id);
        updateRow(row.id, { status: 'joined', message: `Joined — "${result.section.description || result.section.name}" assigned to you.` });
      } else if (result.status === 'already_yours') {
        updateRow(row.id, { status: 'joined', message: 'Already assigned to you.' });
      } else if (result.status === 'taken') {
        updateRow(row.id, { status: 'error', message: 'Already assigned to another instructor. Contact an admin if this is wrong.' });
      } else if (result.status === 'not_found') {
        setPendingCreate({ rowId: row.id, code: result.code, title: '', titleError: null });
        updateRow(row.id, { status: 'confirming', message: null });
      }
    } catch (err) {
      updateRow(row.id, { status: 'error', message: err.message || 'Something went wrong.' });
    }
  }

  function setCreateTitle(title) {
    setPendingCreate((prev) => (prev ? { ...prev, title, titleError: null } : prev));
  }

  async function confirmCreate() {
    if (!pendingCreate) return;
    const { rowId, code, title } = pendingCreate;

    const { valid, error } = isValidTitle(title);
    if (!valid) {
      setPendingCreate((prev) => ({ ...prev, titleError: error }));
      return;
    }

    try {
      await createSection(code, title);
      updateRow(rowId, { status: 'joined', message: `Created "${title}" as a new section, assigned to you.` });
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

  async function submitAll() {
    setSubmitting(true);
    for (const row of rows) {
      if (row.code.trim()) await submitRow(row);
    }
    setSubmitting(false);
    return rows.some((r) => r.status === 'joined');
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
    submitAll,
    setCreateTitle,
    confirmCreate,
    cancelCreate,
  };
}
