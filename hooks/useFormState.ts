import { useState } from 'react';

export function useFormState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);

  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setState(initialState);
  };

  return {
    state,
    setState,
    updateField,
    resetForm,
  };
}
