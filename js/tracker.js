window.OpportunityTracker = {
    key: "opportunityShield.items",
    getAll() {
        try { return JSON.parse(localStorage.getItem(this.key) || "[]"); }
        catch { return []; }
    },
    save(items) { localStorage.setItem(this.key, JSON.stringify(items)); },
    add(item) {
        const items = this.getAll();
        items.unshift({ id: Date.now(), createdAt: new Date().toISOString(), ...item });
        this.save(items);
        return items;
    },
    update(id, status) {
        const items = this.getAll().map(item => item.id === id ? { ...item, status } : item);
        this.save(items); return items;
    },
    remove(id) {
        const items = this.getAll().filter(item => item.id !== id);
        this.save(items); return items;
    }
};
