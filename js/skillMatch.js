window.SkillMatcher = {
    profileSkills: ["javascript", "html", "css", "communication", "problem solving", "git", "github"],
    match(jobSkills) {
        const unique = [...new Set(jobSkills.map(s => s.toLowerCase()))];
        const matched = unique.filter(s => this.profileSkills.includes(s));
        const missing = unique.filter(s => !this.profileSkills.includes(s));
        const score = unique.length ? Math.round((matched.length / unique.length) * 100) : 0;
        return { score, matched, missing };
    }
};
