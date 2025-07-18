import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Globe, Bot, CreditCard, Code } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Globe,
      title: "Site Owners Register",
      description: "Protect your routes from unauthorized bots and monetize API access with simple middleware.",
      code: `npm install @botwall/middleware\n\nconst { validateCrawlRequest } = require('@botwall/middleware');\n\napp.use('/article', validateCrawlRequest());`,
      color: "text-primary"
    },
    {
      icon: Bot,
      title: "Bot Developers Subscribe",
      description: "Register your bot, buy credits, and access protected endpoints with signed headers.",
      code: `import { signRequest, sendCrawlRequest } from '@botwall/sdk';\n\nconst headers = {\n  'crawler-id': 'YOUR_BOT_ID',\n  'crawler-max-price': '0.05',\n  'signature-input': 'crawler-id crawler-max-price',\n};\n\nheaders['signature'] = signRequest(headers, 'YOUR_PRIVATE_KEY_BASE64');\n\nawait sendCrawlRequest('https://target-site.com/route', headers);`,
      color: "text-accent-bright"
    },    
    {
      icon: CreditCard,
      title: "Automatic Billing",
      description: "Every crawl request validates credits, deducts payment, and logs the transaction.",
      code: `// Automatic validation\n✅ Credit check: 1000 credits\n✅ Deduct: 1 credit (0.01¢)\n✅ Grant access to protected data\n✅ Log transaction`,
      color: "text-success"
    }
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            How <span className="bg-gradient-primary bg-clip-text text-transparent">BotWall</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to start monetizing your data and accessing protected content.
          </p>
        </div>

        <div className="space-y-8 lg:space-y-16">
          {steps.map((step, index) => (
            <div key={index} className={`flex flex-col lg:flex-row items-center gap-8 ${
              index % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}>
              {/* Content */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {index + 1}
                  </div>
                  <step.icon className={`h-8 w-8 ${step.color}`} />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {index === 0 && (
                  <div className="flex gap-4">
                    <Button variant="hero">
                      Start as Site Owner
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline">
                      Join as Bot Developer
                    </Button>
                  </div>
                )}
              </div>

              {/* Code Example */}
              <div className="flex-1">
                <Card className="shadow-card bg-muted/30">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Code Example</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-background/80 p-4 rounded-lg overflow-x-auto border">
                      <code className="text-foreground">{step.code}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-primary/5 border border-primary/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of developers already monetizing their data with BotWall.
            </p>
            <Button variant="hero" size="xl">
              Start Building Today
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;