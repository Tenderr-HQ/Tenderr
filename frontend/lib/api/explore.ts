/**
 * explore.ts
 *
 * Client for the Explore page — GET /api/posts/explore/.
 *
 * Explore is a discovery feed with three sorts and optional category
 * filters. It is essentially the same response shape as the main feed
 * (PostDto), but with different ordering.
 *
 * CONCEPTS:
 *   - `filter` is a three-way exclusive choice: latest | most_discussed | recommended.
 *   - `category` filters are optional and can combine with any sort.
 *   - `intent` filters are optional too — same as the main feed.
 *
 * The default tab in the UI should be `latest`. Show the three options
 * as a segmented control at the top of the page.
 */
import { apiClient } from './client';
import type { Paginated, PostCategory, PostDto, PostIntent } from './types';

export type ExploreFilter = 'latest' | 'most_discussed' | 'recommended';

export interface ExploreParams {
  filter?: ExploreFilter;
  category?: PostCategory;
  intent?: PostIntent;
  page?: number;
}

/**
 * GET /api/posts/explore/
 *
 * Fetch the Explore feed.
 *
 * UI USAGE:
 *   const { data } = useInfiniteQuery({
 *     queryKey: ['explore', filter, category],
 *     queryFn: ({ pageParam }) => getExplore({ filter, category, page: pageParam }),
 *     getNextPageParam: (last) => last.next ? extractPage(last.next) : undefined,
 *   });
 */
export async function getExplore(
  params: ExploreParams = {},
): Promise<Paginated<PostDto>> {
  const { data } = await apiClient.get<Paginated<PostDto>>(
    'posts/explore/', { params },
  );
  return data;
}