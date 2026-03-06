'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GradientText from '@/components/ui/GradientText';

const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    description: 'Sign up for a free AI agent account to access the API',
    content: {
      text: 'Start by creating an account specifically for AI agents. This gives you access to the API dashboard and free tier limits.',
      code: null,
      action: {
        text: 'Create Account',
        href: '/auth/signup?type=agent'
      }
    }
  },
  {
    number: '02',
    title: 'Generate API Key',
    description: 'Create your first API key from the dashboard',
    content: {
      text: 'Once logged in, navigate to your API Keys section in the dashboard to generate your first API key.',
      code: null,
      action: {
        text: 'Go to Dashboard',
        href: '/dashboard/api-keys'
      }
    }
  },
  {
    number: '03',
    title: 'Install SDK (Optional)',
    description: 'Use our official SDK for easier integration',
    content: {
      text: 'While you can use the REST API directly, our SDKs provide better developer experience with type safety and error handling.',
      code: {
        javascript: `npm install @hotkeys/sdk`,
        python: `pip install hotkeys-sdk`,
        go: `go get github.com/hotkeys-ai/sdk-go`
      }
    }
  },
  {
    number: '04',
    title: 'Make Your First API Call',
    description: 'Generate your first license with a simple API call',
    content: {
      text: 'Test your integration by generating a license. This call will create a license key that can be used to activate hotkey access.',
      code: {
        javascript: `import { HotKeysClient } from '@hotkeys/sdk';

const client = new HotKeysClient({
  apiKey: process.env.HOTKEYS_API_KEY
});

// Generate a single license
const result = await client.generateLicense({
  tier: 'pro',
  userEmail: 'developer@company.com'
});

console.log('License generated:', result.license.key);
// Output: License generated: hk_pro_abc123def456`,
        
        python: `from hotkeys import HotKeysClient

client = HotKeysClient(api_key=os.environ['HOTKEYS_API_KEY'])

# Generate a single license
result = client.generate_license(
    tier='pro',
    user_email='developer@company.com'
)

print(f'License generated: {result.license.key}')
# Output: License generated: hk_pro_abc123def456`,
        
        curl: `curl -X POST https://api.hotkeys.ai/v1/ai-agent/generate-license \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tier": "pro",
    "user_email": "developer@company.com"
  }'

# Response:
{
  "license": {
    "id": "lic_1234567890",
    "key": "hk_pro_abc123def456",
    "tier": "pro",
    "status": "active",
    "created_at": "2024-03-06T10:30:00Z",
    "expires_at": null,
    "user_email": "developer@company.com"
  },
  "success": true
}`
      }
    }
  },
  {
    number: '05',
    title: 'Handle the Response',
    description: 'Process the license data and handle errors',
    content: {
      text: 'Always check for errors and handle the response appropriately. Store the license key securely and provide it to your users.',
      code: {
        javascript: `try {
  const result = await client.generateLicense({
    tier: 'pro',
    userEmail: 'developer@company.com'
  });
  
  if (result.success) {
    // Store the license key securely
    const licenseKey = result.license.key;
    const expiresAt = result.license.expires_at;
    
    // Send to user via email or provide in UI
    await sendLicenseToUser(licenseKey, 'developer@company.com');
  }
} catch (error) {
  console.error('Failed to generate license:', error.message);
  // Handle error appropriately
}`,
        
        python: `try:
    result = client.generate_license(
        tier='pro',
        user_email='developer@company.com'
    )
    
    if result.success:
        # Store the license key securely
        license_key = result.license.key
        expires_at = result.license.expires_at
        
        # Send to user via email or provide in UI
        send_license_to_user(license_key, 'developer@company.com')
        
except Exception as error:
    print(f'Failed to generate license: {error}')
    # Handle error appropriately`
      }
    }
  },
  {
    number: '06',
    title: 'Scale with Bulk Licenses',
    description: 'Generate multiple licenses for team deployments',
    content: {
      text: 'For larger deployments, use bulk license generation to create multiple licenses at once with volume discounts.',
      code: {
        javascript: `// Generate 25 licenses with a 20% discount
const bulkResult = await client.generateBulkLicenses({
  totalLicenses: 25,
  tier: 'pro',
  discountPercentage: 20
});

console.log('Bulk license order:', bulkResult.bulk_license.id);
console.log('Total cost:', bulkResult.bulk_license.total_cost);

// Monitor the bulk generation progress
const status = await client.getBulkLicenseStatus(bulkResult.bulk_license.id);
console.log('Status:', status.status); // 'processing', 'completed', etc.`,

        python: `# Generate 25 licenses with a 20% discount
bulk_result = client.generate_bulk_licenses(
    total_licenses=25,
    tier='pro',
    discount_percentage=20
)

print(f'Bulk license order: {bulk_result.bulk_license.id}')
print(f'Total cost: {bulk_result.bulk_license.total_cost}')

# Monitor the bulk generation progress
status = client.get_bulk_license_status(bulk_result.bulk_license.id)
print(f'Status: {status.status}')  # 'processing', 'completed', etc.`
      }
    }
  }
];

const commonUseCase = {
  title: 'Complete Example: Team Onboarding',
  description: 'Automatically provision licenses when onboarding new team members',
  code: `async function onboardNewTeamMember(userEmail, userName) {
  try {
    // Generate license for the new team member
    const license = await client.generateLicense({
      tier: 'pro',
      userEmail: userEmail,
      metadata: {
        userName: userName,
        department: 'Engineering',
        onboardedAt: new Date().toISOString()
      }
    });

    // Send welcome email with license
    await sendWelcomeEmail({
      to: userEmail,
      name: userName,
      licenseKey: license.license.key,
      installationGuide: 'https://docs.hotkeys.ai/installation'
    });

    // Log to your system
    console.log(\`Successfully onboarded \${userName} with license \${license.license.key}\`);
    
    return {
      success: true,
      licenseKey: license.license.key,
      userId: license.license.id
    };
    
  } catch (error) {
    console.error('Onboarding failed:', error);
    
    // Send error notification to admin
    await notifyAdmin('Onboarding failed', {
      userEmail,
      error: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage
const result = await onboardNewTeamMember(
  'new.developer@company.com',
  'Alex Johnson'
);`
};

export default function QuickstartPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStepCompletion = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter(i => i !== stepIndex));
    } else {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const getLanguageDisplayName = (lang: string) => {
    switch (lang) {
      case 'javascript': return 'JavaScript/TypeScript';
      case 'python': return 'Python';
      case 'curl': return 'cURL';
      default: return lang;
    }
  };

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[900px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="hero" className="mb-6">
            Quick Start Guide
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
            <GradientText>Get Started in 5 Minutes</GradientText>
          </h1>
          <p className="text-xl text-text-dim max-w-[600px] mx-auto leading-relaxed mb-8">
            Follow this step-by-step guide to integrate HotKeys.ai into your AI workflow and generate your first license.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="/auth/signup?type=agent">
              Get Started Free
            </Button>
            <Button variant="secondary" href="/docs/api">
              View Full API Docs
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-text-dim">{completedSteps.length} of {steps.length} completed</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Language Selection */}
        <div className="mb-8">
          <p className="text-sm font-medium mb-3">Choose your language:</p>
          <div className="flex gap-2 flex-wrap">
            {['javascript', 'python', 'curl'].map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedLanguage === lang 
                    ? 'bg-accent text-bg' 
                    : 'bg-bg-card text-text-dim hover:text-text border border-border'
                }`}
              >
                {getLanguageDisplayName(lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="bg-bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
                      completedSteps.includes(index) 
                        ? 'bg-accent text-bg' 
                        : 'bg-accent/10 text-accent'
                    }`}>
                      {completedSteps.includes(index) ? '✓' : step.number}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                        <p className="text-text-dim">{step.description}</p>
                      </div>
                      <button
                        onClick={() => toggleStepCompletion(index)}
                        className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                          completedSteps.includes(index)
                            ? 'bg-accent/20 text-accent'
                            : 'bg-bg border border-border text-text-dim hover:text-text'
                        }`}
                      >
                        {completedSteps.includes(index) ? 'Completed' : 'Mark Complete'}
                      </button>
                    </div>

                    <div className="prose prose-sm max-w-none">
                      <p className="text-text-dim mb-4">{step.content.text}</p>

                      {step.content.code && (
                        <div className="bg-bg rounded-xl p-6 mb-4">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-text-dim text-sm ml-2">
                              {selectedLanguage === 'javascript' ? 'example.js' :
                               selectedLanguage === 'python' ? 'example.py' :
                               'example.sh'}
                            </span>
                          </div>
                          <pre className="text-sm text-text-dim overflow-x-auto">
                            <code>{step.content.code[selectedLanguage as keyof typeof step.content.code]}</code>
                          </pre>
                        </div>
                      )}

                      {step.content.action && (
                        <Button variant="primary" href={step.content.action.href}>
                          {step.content.action.text}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Common Use Case */}
        <div className="bg-bg-card border border-border rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-4">{commonUseCase.title}</h2>
          <p className="text-text-dim mb-6">{commonUseCase.description}</p>
          
          <div className="bg-bg rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-text-dim text-sm ml-2">team-onboarding.js</span>
            </div>
            <pre className="text-sm text-text-dim overflow-x-auto">
              <code>{commonUseCase.code}</code>
            </pre>
          </div>
        </div>

        {/* Next Steps */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-bg-card border border-border rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">🚀 Next Steps</h3>
            <ul className="space-y-3 text-sm text-text-dim">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                <span>Explore bulk license generation for teams</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                <span>Set up webhook notifications</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                <span>Implement license validation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                <span>Monitor usage and analytics</span>
              </li>
            </ul>
            <Button variant="primary" href="/docs/api" className="mt-6">
              Explore Full API
            </Button>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">💬 Need Help?</h3>
            <p className="text-text-dim text-sm mb-6">
              Join our developer community or reach out to our support team for assistance.
            </p>
            <div className="space-y-3">
              <Button variant="secondary" href="/discord" className="w-full">
                Join Discord Community
              </Button>
              <Button variant="secondary" href="/support" className="w-full">
                Contact Support
              </Button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Scale Your Integration?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Start with the free tier and upgrade as your usage grows. No commitments, cancel anytime.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="/dashboard/usage">
              View Usage Dashboard
            </Button>
            <Button variant="secondary" href="/ai-agents">
              Explore Pricing Plans
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}