export async function getUserWithPosts(userId: number, baseUrl: string) {
  const [user, posts] = await Promise.all([
    fetch(`${baseUrl}/users/${userId}`),
    fetch(`${baseUrl}/posts?userId=${userId}`),
  ]);

  return { user: await user.json(), posts: await posts.json() };
}
