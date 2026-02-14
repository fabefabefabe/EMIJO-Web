// Hall of Fame - localStorage persistence for top 10 scores
const STORAGE_KEY = 'emijo_hall_of_fame';

export class HallOfFame {
    static getScores() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    static addScore(initials, level, meters) {
        const scores = this.getScores();
        scores.push({ initials, level, meters });
        // Sort by level desc, then meters desc
        scores.sort((a, b) => b.level - a.level || b.meters - a.meters);
        // Keep top 10
        const top10 = scores.slice(0, 10);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));
        } catch {
            // localStorage full or unavailable
        }
        return top10;
    }

    static isHighScore(level, meters) {
        const scores = this.getScores();
        if (scores.length < 10) return true;
        // Check if this score would make top 10
        const worst = scores[scores.length - 1];
        if (level > worst.level) return true;
        if (level === worst.level && meters > worst.meters) return true;
        return false;
    }
}
