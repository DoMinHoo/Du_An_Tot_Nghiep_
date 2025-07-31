export async function fetchUserProfile(token: string) {
  const res = await fetch('http://localhost:5000/api/users/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Không lấy được thông tin user');
  return res.json();
}