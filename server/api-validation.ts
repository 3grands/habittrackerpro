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

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publicKey = process.env.VITE_STRIPE_PUBLIC_KEY;

    // Enhanced format validation
    if (!secretKey.startsWith('sk_')) {
      return {
        valid: false,
        service: "Stripe",
        error: "Invalid secret key format - must start with sk_"
      };
    }

    if (!publicKey.startsWith('pk_')) {
      return {
        valid: false,
        service: "Stripe",
        error: "Invalid public key format - must start with pk_"
      };
    }

    // Validate key lengths (Stripe keys have specific lengths)
    if (secretKey.length < 107 || secretKey.length > 110) {
      return {
        valid: false,
        service: "Stripe",
        error: "Secret key length validation failed"
      };
    }

    if (publicKey.length < 107 || publicKey.length > 110) {
      return {
        valid: false,
        service: "Stripe",
        error: "Public key length validation failed"
      };
    }

    // Validate key environment consistency (test/live)
    const secretEnv = secretKey.includes('_test_') ? 'test' : 'live';
    const publicEnv = publicKey.includes('_test_') ? 'test' : 'live';
    
    if (secretEnv !== publicEnv) {
      return {
        valid: false,
        service: "Stripe",
        error: "Key environment mismatch - secret and public keys must both be test or live"
      };
    }

    // Test actual API connectivity and authentication
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
    });

    // Verify account access with multiple API calls
    const [account, balance] = await Promise.all([
      stripe.accounts.retrieve(),
      stripe.balance.retrieve()
    ]);

    // Verify account is properly configured
    if (!account.id || !account.country) {
      return {
        valid: false,
        service: "Stripe",
        error: "Account verification failed - incomplete account setup"
      };
    }

    // Check if account can accept payments
    if (!account.charges_enabled) {
      return {
        valid: false,
        service: "Stripe",
        error: "Account cannot accept payments - charges not enabled"
      };
    }

    return {
      valid: true,
      service: "Stripe"
    };
  } catch (error: any) {
    // Enhanced error analysis
    if (error.type === 'StripeAuthenticationError') {
      return {
        valid: false,
        service: "Stripe",
        error: "Authentication failed - invalid API key"
      };
    }
    
    if (error.type === 'StripePermissionError') {
      return {
        valid: false,
        service: "Stripe",
        error: "Permission denied - key lacks required permissions"
      };
    }

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

    const apiKey = process.env.OPENAI_API_KEY;

    // Enhanced format validation
    if (!apiKey.startsWith('sk-')) {
      return {
        valid: false,
        service: "OpenAI",
        error: "Invalid API key format - must start with sk-"
      };
    }

    // Validate key length (OpenAI keys have specific patterns)
    if (apiKey.length < 40 || apiKey.length > 60) {
      return {
        valid: false,
        service: "OpenAI",
        error: "API key length validation failed"
      };
    }

    // Validate key structure (should contain alphanumeric characters)
    const keyPattern = /^sk-[A-Za-z0-9]+$/;
    if (!keyPattern.test(apiKey)) {
      return {
        valid: false,
        service: "OpenAI",
        error: "Invalid API key character format"
      };
    }

    // Test actual API connectivity and authentication
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          valid: false,
          service: "OpenAI",
          error: "Authentication failed - invalid API key"
        };
      }
      
      if (response.status === 403) {
        return {
          valid: false,
          service: "OpenAI",
          error: "Permission denied - key lacks required permissions"
        };
      }

      if (response.status === 429) {
        return {
          valid: false,
          service: "OpenAI",
          error: "Rate limit exceeded - quota may be exhausted"
        };
      }

      return {
        valid: false,
        service: "OpenAI",
        error: `API validation failed with status ${response.status}`
      };
    }

    // Verify response contains expected data
    const data = await response.json();
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return {
        valid: false,
        service: "OpenAI",
        error: "Invalid API response - models list empty"
      };
    }

    // Check for required models availability
    const availableModels = data.data.map((model: any) => model.id);
    const requiredModels = ['gpt-4o', 'gpt-3.5-turbo'];
    const hasRequiredModel = requiredModels.some(model => availableModels.includes(model));
    
    if (!hasRequiredModel) {
      return {
        valid: false,
        service: "OpenAI",
        error: "No compatible chat models available"
      };
    }

    return {
      valid: true,
      service: "OpenAI"
    };
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        valid: false,
        service: "OpenAI",
        error: "Network connectivity issue - cannot reach OpenAI API"
      };
    }

    return {
      valid: false,
      service: "OpenAI",
      error: error.message || "Authentication failed"
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