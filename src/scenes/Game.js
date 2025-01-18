import { Scene } from 'phaser';
import Player from '@/src/classes/Player';
import mapRegistry from '@/src/utils/mapRegistry';
import HudControl from '@/src/classes/HudControl';

export class Game extends Scene {
	constructor() {
		super('Game');
		this.importRegistry = [
			'player',
			'screenWidth',
			'screenHeight',
			'timeLeft',
			'score',
			'levelStarted',
			'isLevelOverworld',
			'platformHeight',
			'platformPieces',
			'platformPiecesWidth',
			'worldWidth',
			'worldHolesCoords',
			'controlKeys',
			'joyStick',
			'smoothedControls',
			'playerController',
			'playerState',
			'musicGroup',
			'soundsEffectGroup',
			'velocityY',
			'furthestPlayerPos',
			'reachedLevelEnd',
		];
	}

	create() {
		console.log('>> Game');

		// map global registry
		mapRegistry(this, this.importRegistry);

		// start flag
		this.levelStarted = true;
		this.registry.set('levelStarted', this.levelStarted);

		// set camera
		this.cameras.main.setBounds(this.screenWidth, 0, this.worldWidth, 0);
		// this.cameras.main.pan(this.screenWidth * 1.5, 0, 0);
		// this.cameras.main.scrollX = this.screenWidth;
		// this.cameras.main.scrollY = this.screenHeight;

		// create player
		this.createPlayer();

		// generate world
		this.generateWorld();

		// init Head-Up-Display
		this.initHUD();

		// configure physics + initial camera
		this.physics.world.setBounds(this.screenWidth, 0, this.worldWidth, this.screenHeight);
	}

	update(delta) {
		if (this.gameOver || this.gameWinned) return;

		this.playerInstance.updatePlayer.call(this, delta);

		const playerVelocityX = this.player.body.velocity.x;
		const camera = this.cameras.main;

		if (
			playerVelocityX > 0 &&
			this.levelStarted &&
			!this.reachedLevelEnd &&
			!camera.isFollowing &&
			// this.player.x >= this.screenWidth * 1.5 &&
			this.player.x >= camera.worldView.x + camera.width / 2
		) {
			camera.startFollow(this.player, true, 0.1, 0.05);
			camera.isFollowing = true;
		}

		// if (
		// 	playerVelocityX < 0 &&
		// 	this.furthestPlayerPos < this.player.x &&
		// 	this.levelStarted &&
		// 	!this.reachedLevelEnd &&
		// 	camera.isFollowing
		// ) {
		// 	this.furthestPlayerPos = this.player.x;
		// 	this.physics.world.setBounds(camera.worldView.x, 0, this.worldWidth, this.screenHeight);
		// 	camera.setBounds(camera.worldView.x, 0, this.worldWidth, this.screenHeight);
		// 	camera.stopFollow();
		// 	camera.isFollowing = false;
		// }

		if (
			!this.reachedLevelEnd &&
			!this.isLevelOverworld &&
			camera.isFollowing &&
			this.player.x >= this.worldWidth - this.screenWidth * 1.5
		) {
			this.reachedLevelEnd = true;
			camera.stopFollow();
		}
	}

	createPlayer() {
		// create player instance
		this.playerInstance = new Player(this);
		this.player = this.playerInstance.createPlayer();

		// create controls
		this.playerInstance.createControls.call(this);

		// update registry
		this.registry.set('player', this.player);

		// apply temporary invulnerability
		this.playerInstance.applyPlayerInvulnerability(this, 4000);
	}

	generateWorld() {
		// pieceStart will be the next platform piece start pos. This value will be modified after each execution
		let pieceStart = this.screenWidth;
		// This will tell us if last generated piece of platform was empty, to avoid generating another empty piece next to it.
		let lastWasHole = 0;
		// Structures will generate every 2/3 platform pieces
		let lastWasStructure = 0;

		// create platform
		const platform = this.createPlatform(this.screenWidth, this.screenHeight, this.platformHeight);
		this.physics.add.collider(this.player, platform);

		this.platformGroup = this.add.group();
		this.fallProtectionGroup = this.add.group();
		this.blocksGroup = this.add.group();
		this.constructionBlocksGroup = this.add.group();
		this.misteryBlocksGroup = this.add.group();
		this.immovableBlocksGroup = this.add.group();
		this.groundCoinsGroup = this.add.group();
		this.mushroomsVelocityX = this.screenWidth / 15;

		if (!this.isLevelOverworld) {
			//this.blocksGroup.add(this.add.tileSprite(this.worldWidth - screenWidth, screenHeight - (this.platformHeight * 4.5), screenWidth * 2.9, 16, 'block').setScale(screenHeight / 345).setOrigin(1, 0));
			this.blocksGroup.add(
				this.add
					.tileSprite(
						this.screenWidth,
						this.screenHeight - this.platformHeight / 1.2,
						16,
						this.screenHeight - this.platformHeight,
						'block2',
					)
					.setScale(this.screenHeight / 345)
					.setOrigin(0, 1),
			);
			this.undergroundRoof = this.add
				.tileSprite(this.screenWidth * 1.2, this.screenHeight / 13, this.worldWidth / 2.68, 16, 'block2')
				.setScale(this.screenHeight / 345)
				.setOrigin(0);
			this.blocksGroup.add(this.undergroundRoof);
		}

		for (let i = 0; i <= this.platformPieces; i++) {
			// Holes will have a 10% chance of spawning
			let number = Phaser.Math.Between(0, 100);

			// Check if its not a hole, this means is not that 20%, is not in the spawn safe area and is not close to the end castle.
			if (
				pieceStart >= (lastWasHole > 0 || lastWasStructure > 0 || this.worldWidth - this.platformPiecesWidth * 4) ||
				number <= 0 ||
				pieceStart <= this.screenWidth * 2 ||
				pieceStart >= this.worldWidth - this.screenWidth * 2
			) {
				lastWasHole--;

				//> Create platform
				let Npiece = this.add
					.tileSprite(pieceStart, this.screenHeight, this.platformPiecesWidth, this.platformHeight, 'floorbricks')
					.setScale(2)
					.setOrigin(0, 0.5);
				this.physics.add.existing(Npiece);
				Npiece.body.immovable = true;
				Npiece.body.allowGravity = false;
				Npiece.isPlatform = true;
				Npiece.depth = 2;
				this.platformGroup.add(Npiece);
				// Apply player collision with platform
				this.physics.add.collider(this.player, Npiece);

				//> Creating world structures

				if (
					!(pieceStart >= this.worldWidth - this.screenWidth * (this.isLevelOverworld ? 1 : 1.5)) &&
					pieceStart > this.screenWidth + this.platformPiecesWidth * 2 &&
					lastWasHole < 1 &&
					lastWasStructure < 1
				) {
					lastWasStructure = this.generateStructure(pieceStart);
				} else {
					lastWasStructure--;
				}
			} else {
				// console.log(">> i", i, true, number);
				// console.log(">> pieceStart", pieceStart);
				// console.log(">> lastWasHole", lastWasHole);
				// console.log(">> lastWasStructure", lastWasStructure);

				// Save every hole start and end for later use
				this.worldHolesCoords.push({ start: pieceStart, end: pieceStart + this.platformPiecesWidth * 2 });

				lastWasHole = 2;
				this.fallProtectionGroup.add(
					this.add
						.rectangle(pieceStart + this.platformPiecesWidth * 2, this.screenHeight - this.platformHeight, 5, 5)
						.setOrigin(0, 1)
						.setFillStyle(0xff0000),
				);
				this.fallProtectionGroup.add(
					this.add
						.rectangle(pieceStart, this.screenHeight - this.platformHeight, 5, 5)
						.setOrigin(1, 1)
						.setFillStyle(0xff0000),
				);
			}
			pieceStart += this.platformPiecesWidth * 2;
		}

		const createPhysicsObject = (sprite, options) => {
			this.physics.add.existing(sprite);
			sprite.body.allowGravity = false;
			sprite.body.immovable = true;
			sprite.depth = options?.depth || 2;
			if (options?.colliderCallback) {
				this.physics.add.collider(this.player, sprite, options.colliderCallback, null, this);
			}
			if (options?.overlapCallback) {
				this.physics.add.overlap(this.player, sprite, options.overlapCallback, null, this);
			}
			if (options?.animsPlayKey) {
				sprite.anims.play(options.animsPlayKey, true);
			}
		};

		const addInvisibleWall = (x, y) => {
			const wall = this.add.rectangle(x, y, 1, this.screenHeight).setOrigin(0.5, 1);
			createPhysicsObject(wall);
			this.fallProtectionGroup.add(wall);
		};

		addInvisibleWall(this.screenWidth, this.screenHeight - this.platformHeight);

		if (!this.isLevelOverworld) {
			this.verticalTube = this.add
				.tileSprite(
					this.worldWidth - this.screenWidth,
					this.screenHeight - this.platformHeight,
					32,
					this.screenHeight,
					'vertical-extralarge-tube',
				)
				.setScale(this.screenHeight / 345)
				.setOrigin(1, 1);

			createPhysicsObject(this.verticalTube);

			this.finalTrigger = this.add
				.tileSprite(
					this.worldWidth - this.screenWidth * 1.03,
					this.screenHeight - this.platformHeight,
					40,
					31,
					'horizontal-final-tube',
				)
				.setScale(this.screenHeight / 345)
				.setOrigin(1, 1);

			createPhysicsObject(this.finalTrigger, {
				colliderCallback: this.teleportToLevelEnd,
			});

			addInvisibleWall(this.worldWidth - this.screenWidth, this.screenHeight - this.platformHeight);
		}

		const handleGroupItems = (group, collisionCallback, animsPlayKey, overlapCallback) => {
			group.getChildren().forEach((item) =>
				createPhysicsObject(item, {
					colliderCallback: collisionCallback,
					overlapCallback: overlapCallback,
					animsPlayKey: animsPlayKey,
				}),
			);
		};

		handleGroupItems(this.fallProtectionGroup);
		handleGroupItems(this.misteryBlocksGroup, this.revealHiddenBlock, 'mistery-block-default');
		handleGroupItems(this.blocksGroup, this.destroyBlock);
		handleGroupItems(this.constructionBlocksGroup, this.destroyBlock);
		handleGroupItems(this.immovableBlocksGroup);
		handleGroupItems(this.groundCoinsGroup, null, 'ground-coin-default', this.collectCoin);
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

	initHUD() {
		this.hudInstance = new HudControl(this);
		this.hudInstance.createHUD();
		this.hudInstance.updateTimer();
	}

	generateStructure(pieceStart) {
		const scale = this.screenHeight / 345;
		const overworldOffsets = [
			[2.5, 1.5, -0.5, -1.5, 3.6, 5.6, -2.6, -4.6],
			[2.8, 4.8, -1.9, -3.9, -0.5, 1.5],
			[0, 2.5, -1.5],
			[0, 1, 2, -1],
			[],
			[1.5, 0.5, -1.5],
		];
		const underworldOffsets = [
			[(2.5, 1.5, 0, -0.5, -1.5)],
			[(6.5, 4.5, 2.5, 0.5, -1.5, 0, 2)],
			[],
			[3, 2, 3, 2, -1, -2, -3],
			[2, 1, 0, -1],
			[4, 3, 2, 1, 0, -1, -2, -3],
		];

		const addBlocks = (offsets, yFactor) => {
			offsets.forEach((origin) =>
				this.blocksGroup.add(
					this.add
						.tileSprite(pieceStart, this.screenHeight - this.platformHeight * yFactor, 16, 16, 'block')
						.setScale(scale)
						.setOrigin(origin, 0.5),
				),
			);
		};

		const addMisteryBlocks = (offsets, yFactor) => {
			offsets.forEach((origin) =>
				this.misteryBlocksGroup.add(
					this.add
						.sprite(pieceStart, this.screenHeight - this.platformHeight * yFactor, 'mistery-block')
						.setScale(scale)
						.setOrigin(origin || 0, 0.5),
				),
			);
		};

		const addCoins = (origins) => {
			origins.forEach((origin) =>
				this.groundCoinsGroup.add(
					this.physics.add
						.sprite(pieceStart, this.screenHeight - this.platformHeight * 1.9, 'ground-coin')
						.setScale(this.screenHeight / 345)
						.setOrigin(origin, 1.7),
				),
			);
		};

		const random = Phaser.Math.Between(0, 5);

		if (this.isLevelOverworld) {
			switch (random) {
				case 0:
					addBlocks(overworldOffsets[0], 1.9);
					addMisteryBlocks([0, 4.6, -3.6], 2.9);
					return Phaser.Math.Between(1, 3);
				case 1:
					addBlocks(overworldOffsets[1].slice(0, 4), 1.9);
					addBlocks(overworldOffsets[1].slice(4), 2.9);
					addMisteryBlocks([3.8, -2.9, 0], 1.9);
					return Phaser.Math.Between(1, 3);
				case 2:
					addBlocks(overworldOffsets[2], 1.9);
					addMisteryBlocks([1.5, -0.5], 1.9);
					addMisteryBlocks([0], 2.9);
					return Phaser.Math.Between(1, 3);
				case 3:
					addBlocks(overworldOffsets[3], 1.9);
					addBlocks([2, -1], 2.9);
					addMisteryBlocks([0, 1], 2.9);
					return Phaser.Math.Between(1, 3);
				case 4:
					const subRandom = Phaser.Math.Between(0, 4);
					const misteryCases = [[0, -3, 4], [0, -3], [0], [1.5, 0, -0.5], [1.75, 0.75, -0.25, -1.25]];
					addMisteryBlocks(misteryCases[subRandom], 1.9);
					return Phaser.Math.Between(1, 2);
				case 5:
					addBlocks(overworldOffsets[5], 1.9);
					addMisteryBlocks([-0.5], 1.9);
					return Phaser.Math.Between(1, 2);
			}
		} else {
			switch (random) {
				case 0:
					addMisteryBlocks(underworldOffsets[0], 1.9);
					break;
				case 1:
					underworldOffsets[1].forEach((origin, idx) =>
						this.immovableBlocksGroup.add(
							this.add
								.tileSprite(pieceStart, this.screenHeight - this.platformHeight, 16, 16 + idx * 16, 'immovableBlock')
								.setScale(scale)
								.setOrigin(origin, 1),
						),
					);
					addMisteryBlocks([-3.5], 1.9);
					break;
				case 2:
					addBlocks(underworldOffsets[2], 1.9);
					addMisteryBlocks([0, -2.5], 2.135);
					addMisteryBlocks([2.5, 1.5, 0.5, -0.5], 2.37);
					addCoins([5.25, 3.75, 2.2, 0.5, -1.15, -2.7]);
					break;
				case 3:
					addMisteryBlocks(underworldOffsets[3].slice(), 2.9);
					addMisteryBlocks(underworldOffsets[3].slice(), 1.9);
					break;
				case 4:
					addCoins([2.9, 1.3, -0.3, -1.9]);
					addBlocks(underworldOffsets[4], 1.9);
					break;
				case 5:
					addCoins([6.1, 4.5, 2.9, 1.3, -0.3, -1.9, -3.5, -5]);
					addBlocks(underworldOffsets[5], 1.9);
					break;
			}
			return 1;
		}
	}

	collectCoin(player, coin) {
		this.coinSound.play();
		this.hudInstance.addToScore(200);
		coin.destroy();
	}

	revealHiddenBlock(player, block) {
		if (!player.body.blocked.up) return;

		const screenHeightRatio = this.screenHeight / 34.5;
		this.blockBumpSound.play();

		if (emptyBlocksList.includes(block)) return;

		emptyBlocksList.push(block);
		block.anims.stop();
		block.setTexture('emptyBlock');
		animateBlockBounce.call(this, block, screenHeightRatio);

		const random = Phaser.Math.Between(0, 100);
		if (random < 90) {
			handleCoin.call(this, block);
		} else if (random < 96) {
			handleMushroom.call(this, block);
		} else {
			handleFireFlower.call(this, block);
		}
	}

	animateBlockBounce(block, yOffset) {
		this.tweens.add({
			targets: block,
			duration: 75,
			y: block.y - yOffset,
			onComplete: () => {
				this.tweens.add({
					targets: block,
					duration: 75,
					y: block.y + yOffset,
				});
			},
			onCompleteScope: this,
		});
	}

	handleCoin(block) {
		this.hudInstance.addToScore(200, block);
		this.coinSound.play();
		const coin = this.physics.add
			.sprite(block.getBounds().x, block.getBounds().y, 'coin')
			.setScale(this.screenHeight / 357)
			.setOrigin(0)
			.anims.play('coin-default');

		this.tweens.add({
			targets: coin,
			duration: 250,
			y: coin.y - this.screenHeight / 8.25,
			onComplete: () => {
				this.tweens.add({
					targets: coin,
					duration: 250,
					y: coin.y + this.screenHeight / 10.35,
					onComplete: () => coin.destroy(),
				});
			},
			onCompleteScope: this,
		});
	}

	handleMushroom(block) {
		this.powerUpAppearsSound.play();
		const mushroom = this.physics.add
			.sprite(block.getBounds().x, block.getBounds().y, 'super-mushroom')
			.setScale(screenHeight / 345)
			.setOrigin(0)
			.setBounce(1, 0);

		animatePowerUp(mushroom, screenHeight / 20, () => {
			if (!mushroom) return;
			mushroom.setVelocityX(Phaser.Math.Between(0, 10) <= 4 ? mushroomsVelocityX : -mushroomsVelocityX);
		});

		this.physics.add.overlap(this.player, mushroom, consumeMushroom, null, this);
		addColliders.call(this, mushroom);
	}

	handleFireFlower(block) {
		this.powerUpAppearsSound.play();
		const fireFlower = (this.physics.add
			.sprite(block.getBounds().x, block.getBounds().y, 'fire-flower')
			.setScale(screenHeight / 345)
			.setOrigin(0).body.allowGravity = false);

		fireFlower.body.immovable = true;
		fireFlower.anims.play('fire-flower-default', true);

		animatePowerUp(fireFlower, screenHeight / 23);
		this.physics.add.overlap(this.player, fireFlower, consumeFireflower, null, this);
		const misteryBlocks = this.misteryBlocksGroup.getChildren();
		this.physics.add.collider(fireFlower, misteryBlocks);
	}

	animatePowerUp(sprite, yOffset, onCompleteCb) {
		this.tweens.add({
			targets: sprite,
			duration: 300,
			y: sprite.y - yOffset,
			onComplete: onCompleteCb,
			onCompleteScope: this,
		});
	}

	addColliders(mushroom) {
		const groups = [
			this.misteryBlocksGroup,
			this.blocksGroup,
			this.platformGroup,
			this.immovableBlocksGroup,
			this.constructionBlocksGroup,
		];
		groups.forEach((group) => this.physics.add.collider(mushroom, group.getChildren()));
	}

	destroyBlock(player, block) {
		if (!player.body.blocked.up) return;

		this.blockBumpSound.play();
		if (this.playerState === 0 && !block.isImmovable) {
			animateBlockBounce.call(this, block, screenHeight / 69);
		}

		if (this.playerState > 0 && !(this.controlKeys.DOWN.isDown || this.joyStick.down)) {
			this.breakBlockSound.play();
			this.hudInstance.addToScore(50);
			drawDestroyedBlockParticles.call(this, block);
			block.destroy();
		}
	}

	drawDestroyedBlockParticles(block) {
		const playerBounds = this.player.getBounds();
		const blockBounds = block.getBounds();
		const velocities = [
			{ x: -(screenWidth / 25.6), y: -(screenHeight / 3.45) },
			{ x: screenWidth / 25.6, y: -(screenHeight / 3.45) },
			{ x: -(screenWidth / 25.6), y: -(screenHeight / 2.6) },
			{ x: screenWidth / 25.6, y: -(screenHeight / 2.6) },
		];

		let particles = velocities.map((vel, i) => {
			let xCoord = i < 2 ? playerBounds[i % 2 === 0 ? 'left' : 'right'] : playerBounds.left;
			let yCoord = i < 2 ? blockBounds.y : blockBounds.y + block.height * 2.35;
			return this.physics.add
				.sprite(xCoord, yCoord, 'brick-debris')
				.anims.play('brick-debris-default', true)
				.setVelocity(vel.x, vel.y)
				.setScale(screenHeight / 517)
				.setDepth(4);
		});

		setTimeout(() => {
			particles.forEach((particle) => particle.disableBody(true, true));
		}, 3000);
	}

	teleportToLevelEnd(player, trigger) {
		if (!player.body.blocked.right && !trigger.body.blocked.left) return;

		const mainCamera = this.cameras.main;
		const worldWidth = this.worldWidth;
		const screenWidth = this.screenWidth;
		const screenHeight = this.screenHeight;

		playerBlocked = true;
		mainCamera.stopFollow();
		this.powerDownSound.play();

		this.tweens.add({
			targets: player,
			duration: 75,
			alpha: 0,
		});

		mainCamera.fadeOut(450, 0, 0, 0);

		player.anims.play(
			this.playerState > 0 ? (this.playerState === 1 ? 'grown-mario-run' : 'fire-mario-run') : 'run',
			true,
		).flipX = false;

		this.undergroundRoof.destroy();

		setTimeout(() => {
			this.physics.world.setBounds(worldWidth - screenWidth, 0, worldWidth, screenHeight);

			const tpTubeX = worldWidth - screenWidth / 1.089;
			const tpTubeY = screenHeight - platformHeight;
			this.tpTube = this.add
				.tileSprite(tpTubeX, tpTubeY, 32, 32, 'vertical-medium-tube')
				.setScale(screenHeight / 345)
				.setOrigin(1)
				.setDepth(4);

			this.physics.add.existing(this.tpTube);
			this.tpTube.body.allowGravity = false;
			this.tpTube.body.immovable = true;

			this.physics.add.collider(player, this.tpTube);

			this.add
				.rectangle(worldWidth - screenWidth, 0, worldWidth, screenHeight, 0x8585ff)
				.setOrigin(0)
				.setDepth(-1);

			this.add
				.tileSprite(worldWidth - screenWidth, screenHeight, screenWidth, platformHeight, 'start-floorbricks')
				.setScale(2)
				.setOrigin(0, 0.5)
				.setDepth(2);
		}, 500);

		setTimeout(() => {
			player.alpha = 1;
			player.x = worldWidth - screenWidth / 1.08;
			mainCamera.pan(worldWidth - screenWidth / 2, 0, 0);
			mainCamera.fadeIn(500, 0, 0, 0);

			this.powerDownSound.play();
			this.finalTrigger.destroy();

			this.tweens.add({
				targets: player,
				duration: 500,
				y: this.tpTube.getBounds().y,
			});

			setTimeout(() => {
				playerBlocked = false;
			}, 500);
		}, 1100);
	}
}
