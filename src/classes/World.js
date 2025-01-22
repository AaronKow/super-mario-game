export default class World {
	constructor({ worldInstance }) {
		this.worldInstance = worldInstance;
	}

	drawStartScreen() {
		const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
		this.worldInstance.createSky.call(this, this.screenWidth, this.screenHeight);
		const platform = this.worldInstance.createPlatform.call(
			this,
			this.screenWidth,
			this.screenHeight,
			this.platformHeight,
		);
		this.worldInstance.createClouds.call(this, this.screenWidth, this.screenHeight);
		this.worldInstance.createScenery.call(this, this.screenWidth, this.screenHeight, this.platformHeight);
		this.worldInstance.addInteractiveElements.call(
			this,
			screenCenterX,
			this.screenHeight,
			this.platformHeight,
			this.player,
		);
		this.physics.add.collider(this.player, platform);
	}

	drawWorld() {
		//> Drawing the Sky
		this.add
			.rectangle(this.screenWidth, 0, this.worldWidth, this.screenHeight, this.isLevelOverworld ? 0x8585ff : 0x000000)
			.setOrigin(0).depth = -1;

		let propsY = this.screenHeight - this.platformHeight;

		if (this.isLevelOverworld) {
			//> Clouds
			for (
				let i = 0;
				i < Phaser.Math.Between(Math.trunc(this.worldWidth / 760), Math.trunc(this.worldWidth / 380));
				i++
			) {
				let x = this.worldInstance.generateRandomCoordinate.call(this, false, false);
				let y = Phaser.Math.Between(this.screenHeight / 80, this.screenHeight / 2.2);
				if (Phaser.Math.Between(0, 10) < 5) {
					this.add
						.image(x, y, 'cloud1')
						.setOrigin(0)
						.setScale(this.screenHeight / 1725);
				} else {
					this.add
						.image(x, y, 'cloud2')
						.setOrigin(0)
						.setScale(this.screenHeight / 1725);
				}
			}

			//> Mountains
			for (let i = 0; i < Phaser.Math.Between(this.worldWidth / 6400, this.worldWidth / 3800); i++) {
				let x = this.worldInstance.generateRandomCoordinate.call(this);

				if (Phaser.Math.Between(0, 10) < 5) {
					this.add
						.image(x, propsY, 'mountain1')
						.setOrigin(0, 1)
						.setScale(this.screenHeight / 517);
				} else {
					this.add
						.image(x, propsY, 'mountain2')
						.setOrigin(0, 1)
						.setScale(this.screenHeight / 517);
				}
			}

			//> Bushes
			for (
				let i = 0;
				i < Phaser.Math.Between(Math.trunc(this.worldWidth / 960), Math.trunc(this.worldWidth / 760));
				i++
			) {
				let x = this.worldInstance.generateRandomCoordinate.call(this);

				if (Phaser.Math.Between(0, 10) < 5) {
					this.add
						.image(x, propsY, 'bush1')
						.setOrigin(0, 1)
						.setScale(this.screenHeight / 609);
				} else {
					this.add
						.image(x, propsY, 'bush2')
						.setOrigin(0, 1)
						.setScale(this.screenHeight / 609);
				}
			}

			//> Fences
			for (
				let i = 0;
				i < Phaser.Math.Between(Math.trunc(this.worldWidth / 4000), Math.trunc(this.worldWidth / 2000));
				i++
			) {
				let x = this.worldInstance.generateRandomCoordinate.call(this);

				this.add
					.tileSprite(x, propsY, Phaser.Math.Between(100, 250), 35, 'fence')
					.setOrigin(0, 1)
					.setScale(this.screenHeight / 863);
			}
		}

		//> Final flag
		this.finalFlagMast = this.add
			.tileSprite(this.worldWidth - this.worldWidth / 30, propsY, 16, 167, 'flag-mast')
			.setOrigin(0, 1)
			.setScale(this.screenHeight / 400);
		this.physics.add.existing(this.finalFlagMast);
		this.finalFlagMast.immovable = true;
		this.finalFlagMast.allowGravity = false;
		this.finalFlagMast.body.setSize(3, 167);
		this.physics.add.overlap(this.player, this.finalFlagMast, null, this.worldInstance.raiseFlag.bind(this), this);
		this.physics.add.collider(this.platformGroup.getChildren(), this.finalFlagMast);

		//> Flag
		this.finalFlag = this.add
			.image(this.worldWidth - this.worldWidth / 30, propsY * 0.93, 'final-flag')
			.setOrigin(0.5, 1);
		this.finalFlag.setScale(this.screenHeight / 400);

		//> Castle
		this.add
			.image(this.worldWidth - this.worldWidth / 75, propsY, 'castle')
			.setOrigin(0.5, 1)
			.setScale(this.screenHeight / 300);
	}

	createSky(screenWidth, screenHeight) {
		this.add.rectangle(0, 0, screenWidth, screenHeight, 0x8585ff).setOrigin(0).depth = -1;
	}

	createPlatform(screenWidth, screenHeight, platformHeight) {
		let platform = this.add
			.tileSprite(0, screenHeight, screenWidth / 2, platformHeight, 'start-floorbricks')
			.setScale(2)
			.setOrigin(0, 0.5);
		this.physics.add.existing(platform);
		platform.body.immovable = true;
		platform.body.allowGravity = false;
		return platform;
	}

	createClouds(screenWidth, screenHeight) {
		const cloudPositions = [
			{ x: screenWidth / 50, y: screenHeight / 5 },
			{ x: screenWidth / 1.25, y: screenHeight / 2 },
			{ x: screenWidth / 1.05, y: screenHeight / 6.5 },
			{ x: screenWidth / 3, y: screenHeight / 3.5 },
			{ x: screenWidth / 2.1, y: screenHeight / 2.8 },
		];
		cloudPositions.forEach(({ x, y }) => {
			this.add.image(x, y, 'cloud1').setScale(screenHeight / 1725);
		});
	}

	createScenery(screenWidth, screenHeight, platformHeight) {
		const propsY = screenHeight - platformHeight;

		const sceneryItems = [
			{ key: 'mountain2', x: screenWidth / 50, scale: screenHeight / 517 },
			{ key: 'mountain1', x: screenWidth / 300, scale: screenHeight / 517 },
			{ key: 'bush1', x: screenWidth / 4, scale: screenHeight / 609 },
			{ key: 'bush2', x: screenWidth / 1.55, scale: screenHeight / 609 },
			{ key: 'bush2', x: screenWidth / 1.5, scale: screenHeight / 609 },
			{
				key: 'fence',
				x: screenWidth / 15,
				scale: screenHeight / 863,
				type: 'tileSprite',
				width: 350,
				height: 35,
			},
		];

		sceneryItems.forEach((item) => {
			if (item.type === 'tileSprite') {
				this.add.tileSprite(item.x, propsY, item.width, item.height, item.key).setOrigin(0, 1).setScale(item.scale);
			} else {
				this.add.image(item.x, propsY, item.key).setOrigin(0, 1).setScale(item.scale);
			}
		});

		const signBg = this.add
			.image(screenWidth / 25, screenHeight / 10, 'sign')
			.setOrigin(0)
			.setScale(screenHeight / 350);

		// text size
		const fontSize = screenWidth / 100;

		// Calculate the dimensions of the scaled image
		const signHeight = signBg.displayHeight;

		// Calculate the position for the text at the bottom right
		const textX = signBg.x;
		const textY = signBg.y + signHeight + fontSize; // add additional 8px padding

		// Add the text at the calculated position
		this.add
			.text(textX, textY, 'For Educational Recreation Purpose only', {
				fontFamily: 'pixel_nums',
				fontSize,
				align: 'left',
			});
	}

	addInteractiveElements(screenCenterX, screenHeight, platformHeight, player) {
		this.customBlock = this.worldInstance.addCustomBlock.call(
			this,
			screenCenterX,
			screenHeight,
			platformHeight,
			player,
		);
		this.worldInstance.addGear.call(this, screenCenterX, screenHeight, platformHeight);
		this.worldInstance.addSettingsBubble.call(this, screenCenterX, screenHeight, platformHeight);
		this.worldInstance.addNPC.call(this, screenCenterX, screenHeight, platformHeight);
	}

	addCustomBlock(screenCenterX, screenHeight, platformHeight, player) {
		let customBlock = this.add
			.sprite(screenCenterX, screenHeight - platformHeight * 1.9, 'custom-block')
			.setScale(screenHeight / 345);
		customBlock.anims.play('custom-block-default');

		this.physics.add.collider(
			player,
			customBlock,
			function () {
				if (player.body.blocked.up) this.worldInstance.showSettings.call(this);
			},
			null,
			this,
		);

		this.physics.add.existing(customBlock);
		customBlock.body.allowGravity = false;
		customBlock.body.immovable = true;

		return customBlock;
	}

	addGear(screenCenterX, screenHeight, platformHeight) {
		this.add
			.image(screenCenterX, screenHeight - platformHeight * 1.9, 'gear')
			.setScale(screenHeight / 13000)
			.setInteractive()
			.on('pointerdown', () => this.worldInstance.showSettings.call(this));
	}

	addSettingsBubble(screenCenterX, screenHeight, platformHeight) {
		this.add
			.image(screenCenterX * 1.12, screenHeight - platformHeight * 1.5, 'settings-bubble')
			.setScale(screenHeight / 620);
	}

	addNPC(screenCenterX, screenHeight, platformHeight) {
		this.add
			.sprite(screenCenterX * 1.07, screenHeight - platformHeight, 'npc')
			.setOrigin(0.5, 1)
			.setScale(screenHeight / 365)
			.anims.play('npc-default', true);
	}

	showSettings() {
		this.settingsMenuOpen = this.registry.get('settingsMenuOpen');
		if (!this.settingsMenuOpen) {
			this.registry.set('settingsMenuOpen', true);
			this.player.anims.play('idle', true);
			this.events.emit('playerBlocked', true);
			this.player.setVelocityX(0);
			this.musicGroup.musicTheme.pause();
			this.soundsEffectGroup.pauseSound.play();
			this.drawSettingsMenu();
		}
	}

	raiseFlag() {
		if (this.flagRaised) return false;

		this.cameras.main.stopFollow();

		this.timeLeftText.stopped = true;

		this.registry.get('musicGroup').musicTheme.stop();
		this.registry.get('musicGroup').undergroundMusicTheme.stop();
		this.registry.get('musicGroup').hurryMusicTheme.stop();
		this.registry.get('soundsEffectGroup').flagPoleSound.play();

		this.tweens.add({
			targets: this.finalFlag,
			duration: 1000,
			y: this.screenHeight / 2.2,
		});

		setTimeout(() => {
			this.registry.get('musicGroup').winSound.play();
		}, 1000);

		this.flagRaised = true;
		this.events.emit('flagRaised', true);
		this.events.emit('playerBlocked', true);

		this.hudInstance.addToScore(2000, this.player);

		return false;
	}

	generateRandomCoordinate(entitie = false, ground = true) {
		const startPos = entitie ? this.screenWidth * 1.5 : this.screenWidth;
		const endPos = entitie ? this.worldWidth - this.screenWidth * 3 : this.worldWidth;

		let coordinate = Phaser.Math.Between(startPos, endPos);

		if (!ground) return coordinate;

		for (let hole of this.worldHolesCoords) {
			if (coordinate >= hole.start - this.platformPiecesWidth * 1.5 && coordinate <= hole.end) {
				return this.worldInstance.generateRandomCoordinate.call(this, entitie, ground);
			}
		}

		return coordinate;
	}
}
