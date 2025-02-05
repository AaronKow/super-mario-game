export default class Goombas {
	constructor({ goombasInstance, worldInstance }) {
		this.goombasInstance = goombasInstance;
		this.worldInstance = worldInstance;
	}

	create() {
		this.goombasGroup = this.add.group();
		const gombaCount = Math.trunc(this.worldWidth / 960);
		this.goombasVelocityX = this.screenWidth / 19;

		for (let i = 0; i < gombaCount; i++) {
			let x = this.worldInstance.generateRandomCoordinate.call(this, true);
			let goomba = this.physics.add
				.sprite(x, this.screenHeight - this.platformHeight, 'goomba')
				.setOrigin(0.5, 1)
				.setBounce(1, 0)
				.setScale(this.screenHeight / 376);

			goomba.anims.play('goomba-walk', true);
			goomba.smoothed = true;
			goomba.depth = 2;
			if (Phaser.Math.Between(0, 10) <= 4) {
				goomba.setVelocityX(this.goombasVelocityX);
			} else {
				goomba.setVelocityX(-this.goombasVelocityX);
			}
			goomba.setMaxVelocity(this.goombasVelocityX, this.levelGravity);
			this.goombasGroup.add(goomba);
			let platformPieces = this.platformGroup.getChildren();
			this.physics.add.collider(goomba, platformPieces);
			let blocks = this.blocksGroup.getChildren();
			this.physics.add.collider(goomba, blocks);
			let misteryBlocks = this.misteryBlocksGroup.getChildren();
			this.physics.add.collider(goomba, misteryBlocks);
			let goombas = this.goombasGroup.getChildren();
			this.physics.add.collider(goomba, goombas);
			this.physics.add.collider(goomba, this.finalFlagMast);
			this.physics.add.overlap(this.player, goomba, this.goombasInstance.checkGoombaCollision, null, this);
		}

		// Create collision with fall protections to stop goombas from falling off the map
		this.physics.add.collider(this.goombasGroup.getChildren(), this.immovableBlocksGroup.getChildren());
		this.physics.add.collider(this.goombasGroup.getChildren(), this.fallProtectionGroup.getChildren());
		this.physics.add.collider(this.goombasGroup.getChildren(), this.finalTrigger);

		setInterval(this.goombasInstance.clearGoombas.call(this), 250);
	}

	checkGoombaCollision(player, goomba) {
		if (goomba.dead) return;

		let goombaBeingStomped = player.body.touching.down && goomba.body.touching.up;

		if (this.flagRaised) return;

		if (this.playerInvulnerable) {
			if (!goombaBeingStomped) {
				return;
			}
		}

		if (player.isAttacking || goombaBeingStomped) {
			goomba.anims.play('goomba-hurt', true);
			goomba.body.enable = false;
			this.goombasGroup.remove(goomba);
			this.registry.get('soundsEffectGroup').goombaStompSound.play();
			if (goombaBeingStomped) player.setVelocityY(-this.velocityY / 1.5);
			if (this.hudInstance) this.hudInstance.addToScore(100, goomba);
			setTimeout(() => {
				this.tweens.add({
					targets: goomba,
					duration: 300,
					alpha: 0,
				});
			}, 200);
			setTimeout(() => {
				goomba.destroy();
			}, 500);
			return;
		}

		this.playerInstance.decreasePlayerState.call(this);

		return;
	}

	clearGoombas() {
		let goombas = this.goombasGroup.getChildren();

		for (let i = 0; i < goombas.length; i++) {
			if (
				goombas[i].body.velocity.x == 0 ||
				(goombas[i].body.velocity.x > 0 && goombas[i].body.velocity.x != this.goombasVelocityX) ||
				(goombas[i].body.velocity.x < 0 && goombas[i].body.velocity.x != -this.goombasVelocityX)
			) {
				this.goombasGroup.remove(goombas[i]);
				goombas[i].destroy();
			}
		}
	}
}
