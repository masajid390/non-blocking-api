const USER_API = 'https://jsonplaceholder.typicode.com/users';
const POSTS_API = 'https://jsonplaceholder.typicode.com/posts';

export async function getUserWithPosts(userId: number) {
  const [user, posts] = await Promise.all([
    fetch(`${USER_API}/${userId}`),
    fetch(`${POSTS_API}?userId=${userId}`),
  ]);

  return { user: await user.json(), posts: await posts.json() };
}
