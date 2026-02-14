// Input Manager - handles keyboard and touch input

export class InputManager {
    constructor() {
        this.keys = new Set();
        this.touchState = {
            jump: false,
        };

        this._setupKeyboard();
        this._setupTouch();
    }

    _setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            // Prevent scrolling with arrow keys
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
    }

    _setupTouch() {
        const bind = (id, prop) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchState[prop] = true; });
            el.addEventListener('touchend', (e) => { e.preventDefault(); this.touchState[prop] = false; });
            el.addEventListener('touchcancel', (e) => { e.preventDefault(); this.touchState[prop] = false; });
        };
        bind('touchJump', 'jump');
    }

    get isJumping() {
        return this.keys.has('ArrowUp') || this.keys.has('Space') || this.touchState.jump;
    }

    // For menu navigation
    isKeyPressed(code) {
        return this.keys.has(code);
    }

    // Consume a key press (useful for single-press actions like menu confirm)
    consumeKey(code) {
        if (this.keys.has(code)) {
            this.keys.delete(code);
            return true;
        }
        return false;
    }

    // Consume a touch state (one-shot read, resets to false)
    consumeTouch(prop) {
        if (this.touchState[prop]) {
            this.touchState[prop] = false;
            return true;
        }
        return false;
    }
}
