import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { modelAvailabilityApi, type UnavailableModel } from '@/services/api';
import { useNotificationStore } from '@/stores';
import styles from './ModelAvailabilityPage.module.scss';

export function ModelAvailabilityPage() {
  const { t } = useTranslation();
  const [models, setModels] = useState<UnavailableModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState<Set<string>>(new Set());

  const showNotification = useNotificationStore((state) => state.showNotification);

  const fetchUnavailableModels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await modelAvailabilityApi.getUnavailableModels();
      setModels(response.models);
    } catch (error) {
      console.error('Failed to fetch unavailable models:', error);
      showNotification(t('model_availability.fetch_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t, showNotification]);

  useEffect(() => {
    fetchUnavailableModels();
  }, [fetchUnavailableModels]);

  const handleReset = async (model: UnavailableModel) => {
    const resetKey = `${model.model_id}:${model.client_id}`;
    setResetting((prev) => new Set(prev).add(resetKey));

    try {
      await modelAvailabilityApi.resetModelAvailability(model.model_id, model.client_id);
      await fetchUnavailableModels();

      showNotification(
        t('model_availability.reset_success', {
          model: model.model_name || model.model_id
        }),
        'success'
      );
    } catch (error) {
      console.error('Failed to reset model availability:', error);
      showNotification(t('model_availability.reset_error'), 'error');
    } finally {
      setResetting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(resetKey);
        return newSet;
      });
    }
  };

  const getReasonClass = (reason: string) => {
    switch (reason) {
      case 'quota_exceeded':
      case 'cooldown':
        return styles.reasonCooldown;
      case 'suspended':
        return styles.reasonSuspended;
      default:
        return styles.reasonDefault;
    }
  };

  const getReasonText = (model: UnavailableModel) => {
    switch (model.reason) {
      case 'quota_exceeded':
        return t('model_availability.reason_quota_exceeded');
      case 'cooldown':
        return t('model_availability.reason_cooldown');
      case 'suspended':
        return t('model_availability.reason_suspended');
      default:
        return model.reason_text || model.reason;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>{t('model_availability.title')}</h1>
        <div className={styles.headerActions}>
          <span className={styles.count}>
            {t('model_availability.unavailable_count', { count: models.length })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchUnavailableModels}
            disabled={loading}
          >
            {loading ? t('common.loading') : t('common.refresh')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <LoadingSpinner size={32} />
          <span>{t('common.loading')}</span>
        </div>
      ) : models.length === 0 ? (
        <EmptyState
          title={t('model_availability.no_unavailable')}
          description={t('model_availability.no_unavailable_desc')}
        />
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('model_availability.model_name')}</th>
                <th>{t('model_availability.provider')}</th>
                <th>{t('model_availability.client')}</th>
                <th>{t('model_availability.reason')}</th>
                <th>{t('model_availability.since')}</th>
                <th>{t('model_availability.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model, index) => {
                const resetKey = `${model.model_id}:${model.client_id}`;
                const isResetting = resetting.has(resetKey);

                return (
                  <tr key={resetKey} className={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                    <td className={styles.modelCell}>
                      <div className={styles.modelName}>
                        {model.model_name || model.model_id}
                      </div>
                      <div className={styles.modelId}>{model.model_id}</div>
                    </td>
                    <td>
                      <span className={styles.providerTag}>{model.provider || '-'}</span>
                    </td>
                    <td className={styles.dateCell}>{model.client_id}</td>
                    <td>
                      <span className={`${styles.reasonBadge} ${getReasonClass(model.reason)}`}>
                        {getReasonText(model)}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{formatDate(model.since)}</td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReset(model)}
                        loading={isResetting}
                        disabled={isResetting}
                      >
                        {t('model_availability.reset')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
