import { fetchJson, retry } from '../utils';

export async function getUserWithPosts(userId: number, baseUrl: string) {
  return retry(async () => {
    const [user, posts] = await Promise.all([
      fetchJson(`${baseUrl}/users/${userId}`),
      fetchJson(`${baseUrl}/posts?userId=${userId}`),
    ]);
    return { user, posts };
  }, 3, 500);
}
