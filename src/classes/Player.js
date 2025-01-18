import isMobileDevice from '@/src/utils/isMobileDevice';

export default class Player {
	constructor({
		physics,
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
		velocityY,
	}) {
		this.player = null;
		this.physics = physics;
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
		this.velocityY = velocityY;

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
			Phaser.Input.Keyboard.KeyCodes.S,
			Phaser.Input.Keyboard.KeyCodes.A,
			Phaser.Input.Keyboard.KeyCodes.D,
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

			if (this.player.x >= worldWidth - worldWidth / 75) {
				this.tweens.add({
					targets: this.player,
					duration: 75,
					alpha: 0,
				});
			}
			setTimeout(() => {
				gameWinned = true;
				this.player.destroy();
				winScreen.call(this);
			}, 5000);
			return;
		}

		if (this.player.body.blocked.up) this.player.setVelocityY(0);

		if (this.player.body.blocked.left || this.player.body.blocked.right) this.player.setVelocityX(0);

		// Check if player has fallen
		if (this.player.y > this.screenHeight - 10 || this.timeLeft <= 0) {
			this.gameOver = true;
			// gameOverFunc.call(this);
			return;
		}

		if (this.playerBlocked) return;

		// Player controls
		// https://github.com/photonstorm/phaser3-examples/blob/master/public/src/tilemap/collision/matter%20destroy%20tile%20bodies.js#L323
		// https://codepen.io/rexrainbow/pen/oyqvQY

		// > Vertical movement
		if ((this.controlKeys.JUMP.isDown || this.joyStick.up) && this.player.body.touching.down) {
			this.soundsEffectGroup.jumpSound.play();
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
			if (this.player.body.touching.down) this.player.setVelocityX(0);
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

		if (this.player.body.touching.down && this.playerState == 2 && this.controlKeys.FIRE.isDown && !fireInCooldown) {
			throwFireball.call(this);
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
}
