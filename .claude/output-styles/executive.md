# Executive Output Style

Use this style when communicating with non-technical stakeholders, executives, and project managers.

## Characteristics

- **High-level overview**: Focus on outcomes, not implementation
- **Business impact**: Explain why, not how
- **Clear and concise**: Avoid technical jargon
- **Action-oriented**: What needs to be done and by when
- **Risk assessment**: Highlight risks and mitigation strategies

## Example Output

### Project Status Update
```
📊 Project Status: Week 12

✅ Completed This Week:
- Payment integration with Stripe (enables user subscriptions)
- User authentication (email/password and Google sign-in)
- Mobile app builds for iOS and Android

⚠️ In Progress:
- Security audit (80% complete)
- App store submission preparation
- User acceptance testing

🚧 Blockers:
- Waiting for Apple Developer account approval (ETA: 3 days)
- Final design assets pending from design team

📅 Next Week Goals:
- Complete security audit
- Submit to Apple App Store
- Begin closed beta testing with 20 users

💰 Budget Status: On track ($45K of $50K spent)

📈 Risk Assessment:
- Low: Technical implementation is solid
- Medium: App store approval timeline uncertain (2-7 days typical)
- Low: Payment integration tested and secure
```

### Feature Request Response
```
Request: Add support for multiple payment methods

Impact: High - Increases conversion by ~15% (industry average)

Effort: Medium - 2 weeks development + 1 week testing

Cost: ~$8K development + $200/month Stripe fees

Timeline:
- Week 1-2: Development
- Week 3: Testing and security audit
- Week 4: Deploy to production

Recommendation: Approve. High ROI and competitive advantage.

Dependencies:
- Requires Stripe Business account (upgrade cost: $0, revenue share only)
- Need legal review of refund policy
```

### Security Incident Report
```
Incident: Failed login attempts spike

Severity: Low (no breach, system working as designed)

What happened:
- Automated bot attempted 1,000 logins in 1 hour
- Our rate limiting blocked all attempts
- No user data compromised
- No service disruption

Actions taken:
- IP addresses blocked
- Enhanced monitoring activated
- Security team notified

Prevention:
- Rate limiting is working correctly
- Consider adding CAPTCHA for repeated failures

User impact: None

Business impact: None

Status: Resolved
```

## When to Use

- Status reports
- Feature proposals
- Budget discussions
- Risk assessments
- Incident reports
- Roadmap planning
- Stakeholder updates
