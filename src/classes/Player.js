import isMobileDevice from '@/src/utils/isMobileDevice';

export default class Player {
	constructor({
		registry,
		physics,
		hudInstance,
		add,
		input,
		plugins,
		screenWidth,
		screenHeight,
		platformHeight,
		startOffset,
		tweens,
		playerBlocked,
		gameOver,
		levelStarted,
		controlKeys,
		velocityX,
		velocityY,
		fireInCooldown,
		levelGravity,
		playerFiring,
		playerController,
		blocksGroup,
	}) {
		this.player = null;
		this.playerInstance = null;
		this.registry = registry;
		this.physics = physics;
		this.hudInstance = hudInstance;
		this.add = add;
		this.input = input;
		this.plugins = plugins;
		this.platformHeight = platformHeight;
		this.screenWidth = screenWidth;
		this.screenHeight = screenHeight;
		this.startOffset = startOffset;
		this.tweens = tweens;
		this.playerBlocked = playerBlocked;
		this.gameOver = gameOver;
		this.levelStarted = levelStarted;
		this.controlKeys = controlKeys;
		this.velocityX = velocityX;
		this.velocityY = velocityY;
		this.fireInCooldown = fireInCooldown;
		this.levelGravity = levelGravity;
		this.playerFiring = playerFiring;
		this.playerController = playerController;
		this.blocksGroup = blocksGroup;

		// update player offset if game level started
		if (this.levelStarted) this.startOffset = this.screenWidth + 100;
	}

	createPlayer() {
		// Draw player
		this.player = this.physics.add
			.sprite(this.startOffset, this.screenHeight - this.platformHeight - this.screenHeight / 7, 'mario')
			.setOrigin(1)
			.setBounce(0)
			.setCollideWorldBounds(true)
			.setScale(this.screenHeight / 376);
		this.player.depth = 3;

		// return player
		return this.player;
	}

	createControls() {
		const mobileDevice = isMobileDevice();

		this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
			x: this.screenWidth * 0.118,
			y: this.screenHeight / 1.68,
			radius: mobileDevice ? 100 : 0,
			base: this.add.circle(0, 0, mobileDevice ? 75 : 0, 0x0000000, 0.05),
			thumb: this.add.circle(0, 0, mobileDevice ? 25 : 0, 0xcccccc, 0.2),
		});

		// Set control keys
		const keyNames = ['JUMP', 'DOWN', 'LEFT', 'RIGHT', 'FIRE', 'PAUSE'];
		const defaultCodes = [
			Phaser.Input.Keyboard.KeyCodes.SPACE,
			Phaser.Input.Keyboard.KeyCodes.DOWN,
			Phaser.Input.Keyboard.KeyCodes.LEFT,
			Phaser.Input.Keyboard.KeyCodes.RIGHT,
			Phaser.Input.Keyboard.KeyCodes.Q,
			Phaser.Input.Keyboard.KeyCodes.ESC,
		];

		keyNames.forEach((keyName, i) => {
			const keyCode = localStorage.getItem(keyName) ? Number(localStorage.getItem(keyName)) : defaultCodes[i];
			this.controlKeys[keyName] = this.input.keyboard.addKey(keyCode);
		});
	}

	updatePlayer(delta) {
		// Win animation
		if (this.playerBlocked && this.flagRaised) {
			this.player.setVelocityX(this.screenWidth / 8.5);
			if (this.playerState == 0) this.player.anims.play('run', true).flipX = false;
			if (this.playerState == 1) this.player.anims.play('grown-mario-run', true).flipX = false;
			if (this.playerState == 2) this.player.anims.play('fire-mario-run', true);

			if (this.player.x >= this.worldWidth - this.worldWidth / 75) {
				this.tweens.add({
					targets: this.player,
					duration: 75,
					alpha: 0,
				});
			}
			setTimeout(() => {
				this.gameWinned = true;
				this.events.emit('gameWinned', true);
				this.player.destroy();
			}, 5000);
			return;
		}

		if (this.player.body.blocked.up) this.player.setVelocityY(0);

		if (this.player.body.blocked.left || this.player.body.blocked.right) this.player.setVelocityX(0);

		// Check if player has fallen
		if (this.player.y > this.screenHeight - 10 || this.timeLeft <= 0) {
			this.gameOver = true;
			if (this.hudInstance) this.hudInstance.gameOverFunc.call(this);
			return;
		}

		if (this.playerBlocked) return;

		// Player controls
		// https://github.com/photonstorm/phaser3-examples/blob/master/public/src/tilemap/collision/matter%20destroy%20tile%20bodies.js#L323
		// https://codepen.io/rexrainbow/pen/oyqvQY

		// > Vertical movement
		if ((this.controlKeys.JUMP.isDown || this.joyStick.up) && this.player.body.touching.down) {
			this.registry.get('soundsEffectGroup').jumpSound.play();
			this.playerState > 0 && (this.controlKeys.DOWN.isDown || this.joyStick.down)
				? this.player.setVelocityY(-this.velocityY / 1.25)
				: this.player.setVelocityY(-this.velocityY);
		}

		// > Horizontal movement and animations
		let oldVelocityX;
		let targetVelocityX;
		let newVelocityX;

		if (this.controlKeys.LEFT.isDown || this.joyStick.left) {
			this.smoothedControls.moveLeft(delta);
			if (!this.playerFiring) {
				if (this.playerState == 0) this.player.anims.play('run', true).flipX = true;
				if (this.playerState == 1) this.player.anims.play('grown-mario-run', true).flipX = true;
				if (this.playerState == 2) this.player.anims.play('fire-mario-run', true).flipX = true;
			}

			this.playerController.direction.positive = false;

			// Lerp the velocity towards the max run using the smoothed controls.
			// This simulates a this.player controlled acceleration.
			oldVelocityX = this.player.body.velocity.x;
			targetVelocityX = -this.playerController.speed.run;
			newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, -this.smoothedControls.value);

			this.player.setVelocityX(newVelocityX);
		} else if (this.controlKeys.RIGHT.isDown || this.joyStick.right) {
			this.smoothedControls.moveRight(delta);
			if (!this.playerFiring) {
				if (this.playerState == 0) this.player.anims.play('run', true).flipX = false;
				if (this.playerState == 1) this.player.anims.play('grown-mario-run', true).flipX = false;
				if (this.playerState == 2) this.player.anims.play('fire-mario-run', true).flipX = false;
			}

			this.playerController.direction.positive = true;

			// Lerp the velocity towards the max run using the smoothed controls.
			// This simulates a this.player controlled acceleration.
			oldVelocityX = this.player.body.velocity.x;
			targetVelocityX = this.playerController.speed.run;
			newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, this.smoothedControls.value);

			this.player.setVelocityX(newVelocityX);
		} else {
			if (this.player.body.velocity.x != 0) this.smoothedControls.reset();
			if (this.player.body.touching.down) {
				// Apply damping to the velocity to create a momentum effect
				const dampingFactor = 0.5; // Adjust this value to control the damping effect
				this.player.setVelocityX(this.player.body.velocity.x * dampingFactor);
			}
			if (!(this.controlKeys.JUMP.isDown || this.joyStick.up) && !this.playerFiring) {
				if (this.playerState == 0) this.player.anims.play('idle', true);
				if (this.playerState == 1) this.player.anims.play('grown-mario-idle', true);
				if (this.playerState == 2) this.player.anims.play('fire-mario-idle', true);
			}
		}

		if (!this.playerFiring) {
			if (this.playerState > 0 && (this.controlKeys.DOWN.isDown || this.joyStick.down)) {
				if (this.playerState == 1) this.player.anims.play('grown-mario-crouch', true);

				if (this.playerState == 2) this.player.anims.play('fire-mario-crouch', true);

				if (this.player.body.touching.down) {
					this.player.setVelocityX(0);
				}

				this.player.body.setSize(14, 22).setOffset(2, 10);

				return;
			} else {
				if (this.playerState > 0) this.player.body.setSize(14, 32).setOffset(2, 0);

				if (this.playerState == 0) this.player.body.setSize(14, 16).setOffset(1.3, 0.5);
			}
		}

		if (this.playerState == 2 && this.controlKeys.FIRE.isDown && !this.fireInCooldown) {
			this.playerInstance.throwFireball.call(this);
			return;
		}

		// Apply jump animation
		if (!this.player.body.touching.down) {
			if (!this.playerFiring) {
				if (this.playerState == 0) this.player.anims.play('jump', true);

				if (this.playerState == 1) this.player.anims.play('grown-mario-jump', true);

				if (this.playerState == 2) this.player.anims.play('fire-mario-jump', true);
			}
		}
	}

	applyPlayerInvulnerability(context, time) {
		const blinkAnim = this.tweens.add({
			targets: this.player,
			duration: 100,
			alpha: { from: 1, to: 0.2 },
			ease: 'Linear',
			repeat: -1,
			yoyo: true,
		});

		context.events.emit('playerInvulnerable', true);
		setTimeout(() => {
			context.events.emit('playerInvulnerable', false);
			blinkAnim.stop();
			this.player.alpha = 1;
		}, time);
	}

	throwFireball() {
		this.registry.get('soundsEffectGroup').fireballSound.play();
		this.player.anims.play('fire-mario-throw');
		this.playerFiring = true;
		this.fireInCooldown = true;
		setTimeout(() => {
			this.playerFiring = false;
		}, 100);

		setTimeout(() => {
			this.fireInCooldown = false;
		}, 350);

		let fireball = this.physics.add
			.sprite(
				this.player.getBounds().x + this.player.width * 1.15,
				this.player.getBounds().y + this.player.height / 1.25,
				'fireball',
			)
			.setScale(this.screenHeight / 345);
		fireball.allowGravity = true;
		fireball.dead = false;
		if (this.playerController.direction.positive) {
			fireball.setVelocityX(this.velocityX * 1.3);
			fireball.isVelocityPositive = true;
			fireball.anims.play('fireball-right-down');
		} else {
			fireball.setVelocityX(-this.velocityX * 1.3);
			fireball.isVelocityPositive = false;
			fireball.anims.play('fireball-left-down');
		}
		this.playerInstance.updateFireballAnimation.call(this, fireball);

		this.physics.add.collider(
			fireball,
			this.blocksGroup.getChildren(),
			this.playerInstance.fireballBounce.bind(this),
			null,
			this,
		);
		this.physics.add.collider(
			fireball,
			this.misteryBlocksGroup.getChildren(),
			this.playerInstance.fireballBounce.bind(this),
			null,
			this,
		);
		this.physics.add.collider(
			fireball,
			this.platformGroup.getChildren(),
			this.playerInstance.fireballBounce.bind(this),
			null,
			this,
		);
		this.physics.add.overlap(
			fireball,
			this.goombasGroup.getChildren(),
			this.playerInstance.fireballCollides,
			null,
			this,
		);
		this.physics.add.collider(
			fireball,
			this.immovableBlocksGroup.getChildren(),
			this.playerInstance.fireballBounce.bind(this),
			null,
			this,
		);
		this.physics.add.collider(
			fireball,
			this.constructionBlocksGroup.getChildren(),
			this.playerInstance.fireballBounce.bind(this),
			null,
			this,
		);

		setTimeout(() => {
			fireball.dead = true;
			this.tweens.add({
				targets: fireball,
				duration: 100,
				alpha: { from: 1, to: 0 },
			});
			setTimeout(() => {
				fireball.destroy();
			}, 100);
		}, 3000);
	}

	fireballCollides(fireball, entitie) {
		if (fireball.exploded || fireball.dead) return;

		fireball.exploded = true;
		fireball.dead = true;
		fireball.body.moves = false;

		this.playerInstance.explodeFireball(fireball);

		this.registry.get('soundsEffectGroup').kickSound.play();

		entitie.anims.play('goomba-idle', true).flipY = true;
		entitie.dead = true;
		this.goombasGroup.remove(entitie);
		entitie.setVelocityX(0);
		entitie.setVelocityY(-this.velocityY * 0.4);
		setTimeout(() => {
			this.tweens.add({
				targets: entitie,
				duration: 750,
				y: this.screenHeight * 1.1,
			});
		}, 400);

		this.hudInstance.addToScore(100, entitie);
		setTimeout(() => {
			entitie.destroy();
		}, 1250);
	}

	explodeFireball(fireball) {
		fireball.anims.play('fireball-explosion-1', true);

		const destroyFireball = () => {
			if (fireball) {
				fireball.destroy();
			}
		};

		Promise.resolve()
			.then(
				() =>
					new Promise((resolve) =>
						setTimeout(() => {
							if (fireball) {
								fireball.anims.play('fireball-explosion-2', true);
							}
							resolve();
						}, 50),
					),
			)
			.then(
				() =>
					new Promise((resolve) =>
						setTimeout(() => {
							if (fireball) {
								fireball.anims.play('fireball-explosion-3', true);
							}
							resolve();
						}, 35),
					),
			)
			.then(
				() =>
					new Promise((resolve) =>
						setTimeout(() => {
							destroyFireball();
							resolve();
						}, 45),
					),
			);
	}

	updateFireballAnimation(fireball) {
		if (fireball.exploded || fireball.dead) return;

		if (fireball.body.velocity.y > 0) {
			if (fireball.isVelocityPositive) {
				fireball.anims.play('fireball-right-up');
			} else {
				fireball.anims.play('fireball-left-up');
			}
		} else {
			if (fireball.isVelocityPositive) {
				fireball.anims.play('fireball-right-down');
			} else {
				fireball.anims.play('fireball-left-down');
			}
		}

		// setTimeout(() => {
		// 	this.playerInstance.updateFireballAnimation.call(this, fireball);
		// }, 250);
	}

	fireballBounce(fireball, collider) {
		if (
			(collider.isPlatform && (fireball.body.blocked.left || fireball.body.blocked.right)) ||
			(!collider.isPlatform && (fireball.body.blocked.left || fireball.body.blocked.right))
		) {
			fireball.exploded = true;
			fireball.dead = true;
			fireball.body.moves = false;

			this.registry.get('soundsEffectGroup').blockBumpSound.play();
			this.playerInstance.explodeFireball(fireball);
			return;
		}

		if (fireball.body.blocked.down) fireball.setVelocityY(-this.levelGravity / 3.45);

		if (fireball.body.blocked.up) fireball.setVelocityY(this.levelGravity / 3.45);

		if (fireball.body.blocked.left) {
			fireball.isVelocityPositive = false;
			fireball.setVelocityX(this.velocityX * 1.3);
		}

		if (fireball.body.blocked.right) {
			fireball.isVelocityPositive = true;
			fireball.setVelocityX(-this.velocityX * 1.3);
		}
	}

	decreasePlayerState() {
		if (this.playerState <= 0) {
			this.gameOver = true;
			this.hudInstance.gameOverFunc.call(this);
			return;
		}

		this.events.emit('playerBlocked', true);
		this.physics.pause();
		this.anims.pauseAll();
		this.registry.get('soundsEffectGroup').powerDownSound.play();

		let anim1 = this.playerState == 2 ? 'fire-mario-idle' : 'grown-mario-idle';
		let anim2 = this.playerState == 2 ? 'grown-mario-idle' : 'idle';

		this.playerInstance.applyPlayerInvulnerability(this, 3000);
		this.player.anims.play(anim2);

		let i = 0;
		let interval = setInterval(() => {
			i++;
			this.player.anims.play(i % 2 === 0 ? anim2 : anim1);
			if (i > 5) {
				clearInterval(interval);
			}
		}, 100);

		this.playerState--;

		setTimeout(() => {
			this.physics.resume();
			this.anims.resumeAll();
			this.events.emit('playerBlocked', false);
			this.hudInstance.updateTimer();
		}, 1000);
	}
}
