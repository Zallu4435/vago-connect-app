import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DOWNLOAD_MEDIA_ROUTE } from '@/utils/ApiRoutes';

export function useDownloadMediaUrl(mediaId?: number | string): UseQueryResult<{ url: string }, Error> {
  return useQuery<{ url: string }, Error>({
    queryKey: ['media-download', mediaId],
    enabled: Boolean(mediaId),
    queryFn: async () => {
      const { data } = await api.get(DOWNLOAD_MEDIA_ROUTE(mediaId!));
      return data as { url: string };
    },
    staleTime: 0,
  });
}
