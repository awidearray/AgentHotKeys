'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GradientText from '@/components/ui/GradientText';

const onboardingSteps = [
  {
    number: 1,
    title: 'Choose Your Plan',
    description: 'Select the plan that fits your AI agent needs',
    completed: false,
    content: {
      text: 'Start with our free tier to test integration, then scale up based on your usage requirements.',
      options: [
        {
          name: 'Free',
          price: '$0/month',
          features: ['100 API calls/month', '10 licenses/month', 'Basic analytics', 'Community support'],
          cta: 'Start Free',
          href: '/auth/signup?type=agent&plan=free',
          recommended: false
        },
        {
          name: 'Pro',
          price: '$49/month',
          features: ['10,000 API calls/month', '1,000 licenses/month', 'Advanced analytics', 'Priority support'],
          cta: 'Start Pro Trial',
          href: '/auth/signup?type=agent&plan=pro',
          recommended: true
        },
        {
          name: 'Enterprise',
          price: 'Custom',
          features: ['Unlimited API calls', 'Unlimited licenses', 'Custom analytics', 'Dedicated support'],
          cta: 'Contact Sales',
          href: '/contact?plan=enterprise',
          recommended: false
        }
      ]
    }
  },
  {
    number: 2,
    title: 'Account Setup',
    description: 'Create your AI agent account and verify email',
    completed: false,
    content: {
      text: 'Sign up with your work email and verify your account to access the dashboard.',
      checklist: [
        'Create account with AI agent role',
        'Verify email address',
        'Complete profile setup',
        'Set up two-factor authentication (recommended)'
      ]
    }
  },
  {
    number: 3,
    title: 'Generate API Key',
    description: 'Create your first API key for authentication',
    completed: false,
    content: {
      text: 'Navigate to your dashboard to generate secure API keys for your applications.',
      code: `# Store your API key securely
export HOTKEYS_API_KEY="hk_api_your_key_here"

# Test your API key
curl -X GET https://api.hotkeys.ai/v1/ai-agent/analytics \\
  -H "Authorization: Bearer $HOTKEYS_API_KEY"`
    }
  },
  {
    number: 4,
    title: 'Install SDK',
    description: 'Install our SDK for your preferred language',
    completed: false,
    content: {
      text: 'Choose your preferred language and install our official SDK for the best developer experience.',
      sdks: {
        javascript: {
          install: 'npm install @hotkeys/sdk',
          example: `import { HotKeysClient } from '@hotkeys/sdk';

const client = new HotKeysClient({
  apiKey: process.env.HOTKEYS_API_KEY
});`
        },
        python: {
          install: 'pip install hotkeys-sdk',
          example: `from hotkeys import HotKeysClient

client = HotKeysClient(
  api_key=os.environ['HOTKEYS_API_KEY']
)`
        },
        go: {
          install: 'go get github.com/hotkeys-ai/sdk-go',
          example: `import "github.com/hotkeys-ai/sdk-go"

client := hotkeys.NewClient(os.Getenv("HOTKEYS_API_KEY"))`
        }
      }
    }
  },
  {
    number: 5,
    title: 'First Integration',
    description: 'Generate your first license to test the integration',
    completed: false,
    content: {
      text: 'Test your setup by generating a license and handling the response.',
      code: `// Generate a test license
const license = await client.generateLicense({
  tier: 'pro',
  userEmail: 'test@example.com'
});

console.log('Success! License key:', license.license.key);

// Expected output:
// Success! License key: hk_pro_abc123def456`
    }
  },
  {
    number: 6,
    title: 'Production Setup',
    description: 'Configure your production environment and monitoring',
    completed: false,
    content: {
      text: 'Set up your production environment with proper error handling, monitoring, and webhooks.',
      checklist: [
        'Configure production API keys',
        'Set up error handling and retries',
        'Implement webhook endpoints (optional)',
        'Add monitoring and alerting',
        'Configure rate limiting on your side'
      ]
    }
  }
];

const integrationExamples = [
  {
    title: 'AI Coding Assistant',
    description: 'Automatically provision hotkeys when setting up development environments',
    icon: '🤖',
    code: `async function setupDevEnvironment(developerId, projectType) {
  // Generate appropriate licenses based on project type
  const tier = projectType === 'enterprise' ? 'enterprise' : 'pro';
  
  const license = await client.generateLicense({
    tier,
    userEmail: developers[developerId].email,
    metadata: { projectType, setupDate: new Date() }
  });
  
  // Install hotkeys automatically
  await installHotkeys(license.license.key, developerId);
  
  return { success: true, licenseKey: license.license.key };
}`
  },
  {
    title: 'Team Onboarding',
    description: 'Bulk provision licenses for new team members',
    icon: '👥',
    code: `async function onboardNewTeam(teamMembers) {
  const licenses = await client.generateBulkLicenses({
    totalLicenses: teamMembers.length,
    tier: 'pro',
    discountPercentage: 15 // Team discount
  });
  
  // Distribute licenses to team members
  for (const [index, member] of teamMembers.entries()) {
    await sendWelcomeEmail({
      to: member.email,
      licenseKey: licenses.generatedLicenses[index].key,
      installGuide: '/docs/installation'
    });
  }
}`
  },
  {
    title: 'DevOps Pipeline',
    description: 'Integrate license generation into CI/CD workflows',
    icon: '⚙️',
    code: `// In your GitHub Actions workflow
async function deployWithHotkeys(environment) {
  if (environment === 'production') {
    // Generate licenses for production team
    const licenses = await client.generateBulkLicenses({
      totalLicenses: process.env.PROD_TEAM_SIZE,
      tier: 'enterprise'
    });
    
    // Deploy with hotkeys pre-configured
    await deployWithLicenses(licenses);
  }
}`
  }
];

const commonIssues = [
  {
    issue: 'API key authentication fails',
    solution: 'Ensure your API key is correctly set and includes the Bearer prefix in Authorization header',
    code: `// Correct format
headers: {
  'Authorization': 'Bearer hk_api_your_key_here',
  'Content-Type': 'application/json'
}`
  },
  {
    issue: 'Rate limit exceeded',
    solution: 'Implement exponential backoff and respect rate limit headers',
    code: `// Handle rate limits
try {
  const response = await client.generateLicense(params);
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    const retryAfter = error.retryAfter * 1000; // Convert to ms
    await new Promise(resolve => setTimeout(resolve, retryAfter));
    return await client.generateLicense(params); // Retry
  }
}`
  },
  {
    issue: 'License generation fails',
    solution: 'Check your plan limits and validate all required parameters',
    code: `// Validate parameters before API call
const isValidTier = ['basic', 'pro', 'enterprise'].includes(tier);
const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail);

if (!isValidTier || !isValidEmail) {
  throw new Error('Invalid parameters');
}`
  }
];

export default function GetStartedPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedSdk, setSelectedSdk] = useState<'javascript' | 'python' | 'go'>('javascript');

  const completeStep = (stepNumber: number) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps([...completedSteps, stepNumber]);
    }
    if (stepNumber < onboardingSteps.length) {
      setCurrentStep(stepNumber + 1);
    }
  };

  const currentStepData = onboardingSteps.find(step => step.number === currentStep);

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[1000px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="hero" className="mb-6">
            AI Agent Onboarding
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
            <GradientText>Welcome, AI Agent</GradientText>
          </h1>
          <p className="text-xl text-text-dim max-w-[700px] mx-auto leading-relaxed mb-8">
            Get up and running with HotKeys.ai API in 6 simple steps. 
            From account setup to production deployment - we'll guide you every step of the way.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="#onboarding">
              Start Onboarding
            </Button>
            <Button variant="secondary" href="/docs/api">
              View Documentation
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12" id="onboarding">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Setup Progress</h2>
            <span className="text-sm text-text-dim">{completedSteps.length} of {onboardingSteps.length} completed</span>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            {onboardingSteps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.number)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    completedSteps.includes(step.number)
                      ? 'bg-accent text-bg'
                      : currentStep === step.number
                      ? 'bg-accent/20 text-accent border-2 border-accent'
                      : 'bg-bg-card text-text-dim border border-border hover:border-accent'
                  }`}
                >
                  {completedSteps.includes(step.number) ? '✓' : step.number}
                </button>
                {index < onboardingSteps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    completedSteps.includes(step.number) ? 'bg-accent' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps.length / onboardingSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        {currentStepData && (
          <div className="bg-bg-card border border-border rounded-2xl p-8 mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-accent">{currentStepData.number}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold">{currentStepData.title}</h3>
                <p className="text-text-dim">{currentStepData.description}</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-text-dim mb-6">{currentStepData.content.text}</p>

              {/* Plan Selection */}
              {currentStepData.content.options && (
                <div className="grid md:grid-cols-3 gap-6">
                  {currentStepData.content.options.map((option, index) => (
                    <div key={index} className={`relative bg-bg border rounded-xl p-6 ${
                      option.recommended ? 'border-accent' : 'border-border'
                    }`}>
                      {option.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge variant="hero">Most Popular</Badge>
                        </div>
                      )}
                      <h4 className="font-bold text-lg mb-2">{option.name}</h4>
                      <p className="text-2xl font-bold mb-4">{option.price}</p>
                      <ul className="space-y-2 mb-6">
                        {option.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2 text-sm">
                            <span className="text-accent">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        variant={option.recommended ? "primary" : "secondary"}
                        href={option.href}
                        className="w-full"
                      >
                        {option.cta}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Checklist */}
              {currentStepData.content.checklist && (
                <div className="bg-bg border border-border rounded-xl p-6">
                  <h4 className="font-bold mb-4">Checklist:</h4>
                  <div className="space-y-3">
                    {currentStepData.content.checklist.map((item, index) => (
                      <label key={index} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-accent bg-bg border-border rounded" />
                        <span className="text-sm">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Example */}
              {currentStepData.content.code && (
                <div className="bg-bg border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-text-dim text-sm ml-2">example</span>
                  </div>
                  <pre className="text-sm text-text-dim overflow-x-auto">
                    <code>{currentStepData.content.code}</code>
                  </pre>
                </div>
              )}

              {/* SDK Selection */}
              {currentStepData.content.sdks && (
                <div>
                  <div className="flex gap-2 mb-4">
                    {Object.keys(currentStepData.content.sdks).map((sdk) => (
                      <button
                        key={sdk}
                        onClick={() => setSelectedSdk(sdk as any)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors capitalize ${
                          selectedSdk === sdk 
                            ? 'bg-accent text-bg' 
                            : 'bg-bg-card text-text-dim hover:text-text border border-border'
                        }`}
                      >
                        {sdk}
                      </button>
                    ))}
                  </div>
                  <div className="bg-bg border border-border rounded-xl p-6">
                    <p className="font-medium mb-2">Install:</p>
                    <code className="bg-bg-card px-3 py-1 rounded text-sm">
                      {currentStepData.content.sdks[selectedSdk].install}
                    </code>
                    <p className="font-medium mt-4 mb-2">Usage:</p>
                    <pre className="text-sm text-text-dim bg-bg-card p-3 rounded overflow-x-auto">
                      <code>{currentStepData.content.sdks[selectedSdk].example}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                variant="primary"
                onClick={() => completeStep(currentStepData.number)}
                disabled={completedSteps.includes(currentStepData.number)}
              >
                {completedSteps.includes(currentStepData.number) ? 'Completed' : 'Mark as Complete'}
              </Button>
              {currentStepData.number > 1 && (
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(currentStepData.number - 1)}
                >
                  Previous Step
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Integration Examples */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-12">Common Integration Patterns</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {integrationExamples.map((example, index) => (
              <div key={index} className="bg-bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">{example.icon}</span>
                </div>
                <h3 className="font-bold mb-3">{example.title}</h3>
                <p className="text-text-dim text-sm mb-6">{example.description}</p>
                <div className="bg-bg border border-border rounded-lg p-4">
                  <pre className="text-xs text-text-dim overflow-x-auto">
                    <code>{example.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-8">Common Issues & Solutions</h2>
          <div className="space-y-6">
            {commonIssues.map((item, index) => (
              <div key={index} className="border-l-4 border-accent pl-6">
                <h3 className="font-bold text-lg mb-2">❌ {item.issue}</h3>
                <p className="text-text-dim mb-4">✅ {item.solution}</p>
                <div className="bg-bg border border-border rounded-lg p-4">
                  <pre className="text-xs text-text-dim overflow-x-auto">
                    <code>{item.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Need Additional Help?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Join our developer community or contact our support team for personalized assistance.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="/discord">
              Join Discord Community
            </Button>
            <Button variant="secondary" href="/support">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}