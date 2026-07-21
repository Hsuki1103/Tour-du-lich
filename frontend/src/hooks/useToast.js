import { useCallback } from 'react';
import { showToast, showLoadingToast, updateToast, dismissToast } from '../components/common/Toast';

export const useToast = () => {
  const success = useCallback((message, options) => {
    showToast.success(message, options);
  }, []);

  const error = useCallback((message, options) => {
    showToast.error(message, options);
  }, []);

  const warning = useCallback((message, options) => {
    showToast.warning(message, options);
  }, []);

  const info = useCallback((message, options) => {
    showToast.info(message, options);
  }, []);

  const loading = useCallback((message) => {
    return showLoadingToast(message);
  }, []);

  const update = useCallback((toastId, message, type) => {
    updateToast(toastId, message, type);
  }, []);

  const dismiss = useCallback((toastId) => {
    dismissToast(toastId);
  }, []);

  return {
    success,
    error,
    warning,
    info,
    loading,
    update,
    dismiss,
  };
};