import { supabaseAdmin } from '../services/supabase.service.js';

export const redeemCouponDefinition = {
  type: 'function' as const,
  function: {
    name: 'redeem_coupon',
    description: 'Resgata um cupom de desconto promocional para adicionar créditos à conta do usuário. Requer o código do cupom.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'O código do cupom a ser resgatado (ex: "ESTAGIO100", "BOASVINDAS").'
        }
      },
      required: ['code']
    }
  }
};

export async function runRedeemCoupon(userId: string, args: { code: string }) {
  try {
    const code = args.code.trim().toUpperCase();
    if (!code) {
      return { error: 'O código do cupom não pode ser vazio.' };
    }

    // 1. Buscar cupom no banco de dados
    const { data: coupon, error: couponErr } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single();

    if (couponErr || !coupon) {
      return { error: 'Cupom inválido ou inexistente.' };
    }

    // 2. Verificar validade temporal
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { error: 'Este cupom já expirou.' };
    }

    // 3. Verificar limite de usos totais (se houver)
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return { error: 'Este cupom atingiu o limite máximo de usos.' };
    }

    // 4. Verificar se este usuário já resgatou este cupom
    const { data: existingRedemption, error: redemptionCheckErr } = await supabaseAdmin
      .from('coupon_redemptions')
      .select('id')
      .eq('coupon_code', code)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingRedemption) {
      return { error: 'Você já resgatou este cupom anteriormente.' };
    }

    // 5. Inserir resgate (para evitar concorrência/uso múltiplo pelo mesmo usuário)
    const { error: insertErr } = await supabaseAdmin
      .from('coupon_redemptions')
      .insert({
        coupon_code: code,
        user_id: userId
      });

    if (insertErr) {
      // Pode falhar devido a restrição unique
      return { error: 'Você já resgatou este cupom ou ocorreu um erro no processamento.' };
    }

    // 6. Atualizar contador de usos do cupom
    const { error: updateCountErr } = await supabaseAdmin
      .from('coupons')
      .update({ used_count: coupon.used_count + 1 })
      .eq('code', code);

    if (updateCountErr) {
      console.error('Error updating coupon used count:', updateCountErr);
    }

    // 7. Adicionar créditos via RPC (service role)
    const { error: addCreditsErr } = await supabaseAdmin.rpc('add_credits', {
      user_uuid: userId,
      amount: coupon.credits,
      description: `Resgate do cupom promocional: ${code}`
    });

    if (addCreditsErr) {
      console.error('Error adding credits for coupon:', addCreditsErr);
      // Rollback redemption
      await supabaseAdmin.from('coupon_redemptions').delete().eq('coupon_code', code).eq('user_id', userId);
      return { error: 'Erro ao adicionar créditos à sua conta. Tente novamente mais tarde.' };
    }

    return {
      success: true,
      message: `Cupom "${code}" resgatado com sucesso! ${coupon.credits} créditos foram adicionados à sua conta.`,
      creditsAdded: coupon.credits
    };
  } catch (err: any) {
    console.error('Unexpected error in redeem_coupon tool:', err);
    return { error: `Erro ao processar resgate do cupom: ${err.message}` };
  }
}
