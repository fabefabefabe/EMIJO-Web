// Input Manager - handles keyboard and touch input

export class InputManager {
    constructor() {
        this.keys = new Set();
        this.touchState = {
            left: false,
            right: false,
            jump: false,
            crouch: false,
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
        bind('touchLeft', 'left');
        bind('touchRight', 'right');
        bind('touchJump', 'jump');
        bind('touchCrouch', 'crouch');
    }

    get isMovingLeft() {
        return this.keys.has('ArrowLeft') || this.touchState.left;
    }

    get isMovingRight() {
        return this.keys.has('ArrowRight') || this.touchState.right;
    }

    get isJumping() {
        return this.keys.has('ArrowUp') || this.keys.has('Space') || this.touchState.jump;
    }

    get isCrouching() {
        return this.keys.has('ArrowDown') || this.touchState.crouch;
    }

    get horizontalDirection() {
        if (this.isMovingLeft && !this.isMovingRight) return -1;
        if (this.isMovingRight && !this.isMovingLeft) return 1;
        return 0;
    }

    get hasMovement() {
        return this.isMovingLeft || this.isMovingRight;
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
}
