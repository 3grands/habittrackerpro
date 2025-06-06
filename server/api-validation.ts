import Stripe from "stripe";

interface ApiValidationResult {
  valid: boolean;
  service: string;
  error?: string;
}

export async function validateStripeKeys(): Promise<ApiValidationResult> {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.VITE_STRIPE_PUBLIC_KEY) {
      return {
        valid: false,
        service: "Stripe",
        error: "Missing required API keys"
      };
    }

    // Validate secret key format
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      return {
        valid: false,
        service: "Stripe",
        error: "Invalid secret key format"
      };
    }

    // Validate public key format
    if (!process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_')) {
      return {
        valid: false,
        service: "Stripe",
        error: "Invalid public key format"
      };
    }

    // Test actual API connectivity
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });

    // Make a simple API call to verify authentication
    await stripe.paymentMethods.list({ limit: 1 });

    return {
      valid: true,
      service: "Stripe"
    };
  } catch (error: any) {
    return {
      valid: false,
      service: "Stripe",
      error: error.message || "Authentication failed"
    };
  }
}

export async function validateOpenAIKey(): Promise<ApiValidationResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        valid: false,
        service: "OpenAI",
        error: "Missing API key"
      };
    }

    // Basic format validation
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      return {
        valid: false,
        service: "OpenAI",
        error: "Invalid API key format"
      };
    }

    return {
      valid: true,
      service: "OpenAI"
    };
  } catch (error: any) {
    return {
      valid: false,
      service: "OpenAI",
      error: error.message
    };
  }
}

export async function validateAllApiKeys(): Promise<{
  allValid: boolean;
  results: ApiValidationResult[];
  summary: string;
}> {
  const results = await Promise.all([
    validateStripeKeys(),
    validateOpenAIKey()
  ]);

  const allValid = results.every(result => result.valid);
  const validServices = results.filter(r => r.valid).map(r => r.service);
  const invalidServices = results.filter(r => !r.valid);

  let summary = "";
  if (allValid) {
    summary = `All API keys validated successfully: ${validServices.join(", ")}`;
  } else {
    summary = `Validation failed for: ${invalidServices.map(s => `${s.service} (${s.error})`).join(", ")}`;
  }

  return {
    allValid,
    results,
    summary
  };
}