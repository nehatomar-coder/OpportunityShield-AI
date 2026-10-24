window.OpportunityAnalyzer = {
    analyze(text) {
        const original = (text || "").trim();
        if (original.length < 25) {
            return { error: "Please paste a fuller job or internship description (at least 25 characters) so the checks are more useful." };
        }
        const lower = original.toLowerCase();
        const rules = [
            { words: ["registration fee", "pay to apply", "application fee", "security deposit", "pay for training", "processing fee", "upfront fee"], title: "Payment requested", reason: "A request to pay money to get considered for a job is a warning sign. Verify independently before proceeding.", weight: 28 },
            { words: ["guaranteed job", "100% placement guaranteed", "guaranteed selection", "job guaranteed"], title: "Unrealistic guarantee", reason: "Promises of guaranteed selection or placement deserve extra scrutiny.", weight: 18 },
            { words: ["urgent hiring", "apply immediately", "limited seats only", "within 1 hour"], title: "High-pressure language", reason: "Pressure to act immediately can discourage careful verification.", weight: 10 },
            { words: ["whatsapp only", "telegram only", "contact only on telegram"], title: "Unusual contact channel", reason: "Check whether the recruiter and contact details are also listed on the company's official channels.", weight: 12 },
            { words: ["no experience needed", "earn huge", "easy money", "earn ₹", "earn rs"], title: "Vague or exaggerated claims", reason: "Verify the actual duties, eligibility, compensation and employer identity.", weight: 8 },
            { words: ["send aadhaar", "send pan card", "share otp", "bank password"], title: "Sensitive information request", reason: "Do not share OTPs, passwords or sensitive identity/banking details with an unverified recruiter.", weight: 30 }
        ];
        const flags = [];
        let penalty = 0;
        for (const rule of rules) {
            const found = rule.words.find(word => lower.includes(word));
            if (found) {
                flags.push({ title: rule.title, reason: rule.reason, phrase: found });
                penalty += rule.weight;
            }
        }
        const skillsList = ["javascript", "html", "css", "react", "python", "java", "sql", "communication", "problem solving", "teamwork", "git", "github", "data analysis", "excel", "ui/ux", "figma", "node.js", "c++", "c programming"];
        const skills = skillsList.filter(skill => lower.includes(skill));
        const companyMatch = original.match(/(?:company|organisation|organization)\s*[:\-]\s*([^\n,.]+)/i);
        const roleMatch = original.match(/(?:role|position|job title)\s*[:\-]\s*([^\n,.]+)/i);
        const deadlineMatch = original.match(/(?:deadline|apply by|last date)\s*[:\-]?\s*([^\n,.]+)/i);
        const score = Math.max(5, 100 - penalty);
        let level = "Low";
        if (score < 65) level = "High";
        else if (score < 85) level = "Medium";
        const positives = [];
        if (/\b(stipend|salary|paid|compensation)\b/i.test(original)) positives.push("Compensation or stipend details are mentioned; verify the exact terms.");
        if (/\b(official website|company website|careers page)\b/i.test(original)) positives.push("An official website or careers page is referenced; open it independently to verify.");
        if (/\b(responsibilities|requirements|skills)\b/i.test(original)) positives.push("Some role requirements or responsibilities are described.");
        return {
            score, level, flags, skills,
            details: {
                company: companyMatch ? companyMatch[1].trim() : "Not clearly identified",
                role: roleMatch ? roleMatch[1].trim() : "Review the role title manually",
                deadline: deadlineMatch ? deadlineMatch[1].trim() : "No clear deadline detected"
            },
            positives,
            summary: flags.length ? `${flags.length} warning signal${flags.length === 1 ? "" : "s"} detected. Review each item and verify the employer independently.` : "No configured warning phrases were detected. This does not prove the opportunity is genuine; verify the company and offer details independently."
        };
    }
};
