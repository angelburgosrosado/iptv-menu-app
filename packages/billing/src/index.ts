import Stripe from 'stripe';
import { config } from '@iptv-menu/config';
import { Logger } from '@iptv-menu/logging';

const logger = new Logger('stripe-billing');
let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const key = config.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required to execute billing actions');
    }
    stripeClient = new Stripe(key, {
      apiVersion: '2023-10-16' as any, // Standard stable version
    });
  }
  return stripeClient;
}

/**
 * Creates a checkout session for recurring subscriptions
 */
export async function createCheckoutSession(
  customerId: string | null,
  userEmail: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: Record<string, string>,
  mode: 'subscription' | 'payment' = 'subscription'
): Promise<string> {
  try {
    const stripe = getStripeClient();
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    };

    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata,
      };
    }

    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logger.info(`Stripe checkout session created successfully`, { sessionId: session.id, email: userEmail, mode });
    return session.url!;
  } catch (error) {
    logger.error('Failed to create checkout session', error);
    throw error;
  }
}

/**
 * Creates a billing portal session for users to update cards or cancel subscriptions
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    logger.info(`Stripe customer portal session created`, { customerId });
    return session.url;
  } catch (error) {
    logger.error('Failed to create customer portal session', error);
    throw error;
  }
}

/**
 * Verifies webhook signatures from Stripe
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeClient();
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    logger.error('Stripe webhook signature validation failed', err);
    throw new Error(`Webhook Error: ${err.message}`);
  }
}
export async function createOrRetrieveCustomer(email: string, name: string): Promise<string> {
  const stripe = getStripeClient();
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }
  const customer = await stripe.customers.create({ email, name });
  return customer.id;
}
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}
