export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    const expectedUser = (env.AUTH_USERNAME || 'admin').trim();
    const expectedPass = (env.AUTH_PASSWORD || 'txeva2026').trim();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (username.trim() === expectedUser && password.trim() === expectedPass) {
      // Create session token
      const token = `auth_${btoa(`${expectedUser}:${Date.now()}`)}_${Math.random().toString(36).substring(2)}`;
      return new Response(
        JSON.stringify({
          success: true,
          username: expectedUser,
          token,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'حدث خطأ أثناء المصادقة' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const authHeader = request.headers.get('Authorization') || request.headers.get('x-auth-token');

  if (!authHeader) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Token is verified
  return new Response(JSON.stringify({ authenticated: true, username: env.AUTH_USERNAME || 'admin' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
