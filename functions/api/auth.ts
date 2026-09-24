export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    const expectedUser = env.AUTH_USERNAME ? String(env.AUTH_USERNAME).trim() : null;
    const expectedPass = env.AUTH_PASSWORD ? String(env.AUTH_PASSWORD).trim() : null;

    if (!expectedUser || !expectedPass) {
      return new Response(
        JSON.stringify({
          error: 'متغيرات المصادقة (AUTH_USERNAME و AUTH_PASSWORD) لم يتم ضبطها بعد في إعدادات Cloudflare Pages.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const inputUser = String(username).trim();
    const inputPass = String(password).trim();

    if (inputUser === expectedUser && inputPass === expectedPass) {
      const token = `auth_${btoa(`${inputUser}:${Date.now()}`)}_${Math.random().toString(36).substring(2)}`;
      return new Response(
        JSON.stringify({
          success: true,
          username: inputUser,
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

  return new Response(
    JSON.stringify({ authenticated: true, username: env.AUTH_USERNAME || '' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
