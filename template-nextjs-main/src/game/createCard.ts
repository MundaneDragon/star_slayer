import Phaser from 'phaser';

interface CreateCardConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    frontTexture: string;
    backTexture: string;
    cardName: string;
    animationKey: string;
}

export interface CardObject {
    gameObject: Phaser.GameObjects.Container;
    flip: (callbackComplete?: () => void) => void;
    destroy: () => void;
    cardName: string;
    hasFaceAt: (x: number, y: number) => boolean;
}

export const createCard = ({
    scene,
    x,
    y,
    frontTexture,
    backTexture,
    cardName,
    animationKey
}: CreateCardConfig): CardObject => {
    let isFlipping: boolean = false;
    let isFaceUp: boolean = false;

    // --- Card and Animation Dimensions ---
    const cardWidth = 48;
    const cardHeight = 72;
    const animationFrameWidth = 32;

    // --- Create Game Objects ---
    const container = scene.add.container(x, y);
    container.setSize(cardWidth, cardHeight);
    container.setInteractive();

    // Create the back of the card sprite
    const backCard = scene.add.sprite(0, 0, backTexture);
    
    // Create the front face of the card sprite
    const frontCard = scene.add.sprite(0, 0, frontTexture)
        .setVisible(false);
    
    // Create the sprite for the opening/closing animation
    const openAnimation = scene.add.sprite(0, 0, '')
        .setVisible(false);

    // Set the origins of all sprites to their center to align them
    backCard.setOrigin(0.5);
    frontCard.setOrigin(0.5);
    openAnimation.setOrigin(0.5);

    // Add all sprites to the container
    container.add([backCard, frontCard, openAnimation]);
    
    // Scale the animation sprite to fit correctly on the card face
    const requiredScale = cardWidth / animationFrameWidth;
    openAnimation.setScale(requiredScale);

    const flip = (callbackComplete?: () => void): void => {
        if (isFlipping) {
            return;
        }
        isFlipping = true;

        const originalScaleX = container.scaleX;

        if (!isFaceUp) {
            // --- FLIPPING TO THE FRONT ---
            scene.tweens.add({
                targets: container,
                scaleX: 0,
                duration: 200,
                ease: 'Linear',
                onComplete: () => {
                    // At the halfway point, switch the visible card to the front face
                    backCard.setVisible(false);
                    frontCard.setVisible(true);
                    
                    // Now, scale back up to reveal the front face
                    scene.tweens.add({
                        targets: container,
                        scaleX: originalScaleX,
                        duration: 200,
                        ease: 'Linear',
                        onComplete: () => {
                            // Once the card is fully visible, play the opening animation on top
                            openAnimation.setVisible(true);
                            openAnimation.play(animationKey);
                        }
                    });
                }
            });
            
            // Listen for the animation to finish
            openAnimation.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                isFlipping = false;
                isFaceUp = true;
                if (callbackComplete) {
                    callbackComplete();
                }
            });

        } else {
            // --- FLIPPING TO THE BACK ---
            // First, play the animation in reverse
            openAnimation.playReverse(animationKey);

            // Once the reverse animation is done, hide the effect and flip the card
            openAnimation.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                openAnimation.setVisible(false);
                
                scene.tweens.add({
                    targets: container,
                    scaleX: 0,
                    duration: 200,
                    ease: 'Linear',
                    onComplete: () => {
                        // At halfway, switch back to the back texture
                        frontCard.setVisible(false);
                        backCard.setVisible(true);
                        
                        // Scale back up to finish the flip
                        scene.tweens.add({
                            targets: container,
                            scaleX: originalScaleX,
                            duration: 200,
                            ease: 'Linear',
                            onComplete: () => {
                                isFlipping = false;
                                isFaceUp = false;
                                if (callbackComplete) {
                                    callbackComplete();
                                }
                            }
                        });
                    }
                });
            });
        }
    };

    const destroy = (): void => {
        scene.tweens.add({
            targets: container,
            y: container.y - 1000,
            ease: 'Expo.In',
            duration: 700,
            onComplete: () => {
                container.destroy();
            }
        });
    };

    const hasFaceAt = (x: number, y: number): boolean => {
        const bounds = container.getBounds();
        return Phaser.Geom.Rectangle.Contains(bounds, x, y);
    };

    return {
        gameObject: container,
        flip,
        destroy,
        cardName,
        hasFaceAt
    };
};