import { apiClient } from './api';
import { ExportRequest, DataType } from '../types';

export const exportService = {
  async exportToExcel(data: ExportRequest): Promise<Blob> {
    const response = await apiClient.post('/export/excel', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
