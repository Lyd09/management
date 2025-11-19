
import { getGoogleTokens } from '@/lib/google-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Código de autorização não encontrado.' },
      { status: 400 }
    );
  }

  try {
    const tokens = await getGoogleTokens(code);
    
    // Criar uma resposta de redirecionamento para a página do calendário
    const redirectUrl = new URL('/calendar', request.url).toString();
    const response = NextResponse.redirect(redirectUrl);

    // Armazenar os tokens em cookies para que o lado do cliente possa usá-los
    // O ideal para produção seria httpOnly, mas para o contexto do cliente acessar,
    // precisamos que seja legível por JS.
    response.cookies.set('google-tokens', JSON.stringify(tokens), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      sameSite: 'lax',
      // secure: process.env.NODE_ENV === 'production', // Use 'secure' em produção
    });

    return response;

  } catch (error: any) {
    console.error('Erro ao obter tokens do Google:', error);
    // Redireciona para a página do calendário com um parâmetro de erro
    const errorRedirectUrl = new URL('/calendar', request.url);
    errorRedirectUrl.searchParams.set('error', 'google_auth_failed');
    return NextResponse.redirect(errorRedirectUrl.toString());
  }
}
