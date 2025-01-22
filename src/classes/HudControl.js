import html2canvas from 'html2canvas';

export default class HudControl {
	constructor({
		events,
		cameras,
		scoreText,
		highScoreText,
		timeLeftText,
		timeLeft,
		screenWidth,
		screenHeight,
		add,
		score,
		playerBlocked,
		tweens,
	}) {
		this.events = events;
		this.cameras = cameras;
		this.scoreText = scoreText;
		this.highScoreText = highScoreText;
		this.timeLeftText = timeLeftText;
		this.timeLeft = timeLeft;
		this.screenWidth = screenWidth;
		this.screenHeight = screenHeight;
		this.add = add;
		this.score = score;
		this.playerBlocked = playerBlocked;
		this.tweens = tweens;

		this.watchEvent();
	}

	watchEvent() {
		this.events.on('gameWinned', () => {
			this.winScreen();
		});
	}

	createHUD(context) {
		let posY = this.screenWidth / 35;

		this.scoreText = this.add.text(this.screenWidth / 40, posY, '', {
			fontFamily: 'pixel_nums',
			fontSize: this.screenWidth / 65,
			align: 'left',
		});
		this.scoreText.setScrollFactor(0).depth = 5;

		this.highScoreText = this.add
			.text(this.screenWidth / 2, posY, 'HIGH SCORE\n 000000', {
				fontFamily: 'pixel_nums',
				fontSize: this.screenWidth / 65,
				align: 'center',
			})
			.setOrigin(0.5, 0);
		this.highScoreText.setScrollFactor(0).depth = 5;

		this.timeLeftText = this.add.text(
			this.screenWidth * 0.925,
			posY,
			'TIME\n' + this.timeLeft.toString().padStart(3, '0'),
			{
				fontFamily: 'pixel_nums',
				fontSize: this.screenWidth / 65,
				align: 'right',
			},
		);
		this.timeLeftText.setScrollFactor(0).depth = 5;

		// broadcast timeLeftText obj
		context.events.emit('timeLeftText', this.timeLeftText);

		let localHighScore = localStorage.getItem('high-score');
		if (localHighScore !== null) {
			this.highScoreText.setText('HIGH SCORE\n' + localHighScore.toString().padStart(6, '0'));
		}

		this.updateScore();
	}

	updateScore() {
		if (!this.scoreText) return;

		this.scoreText.setText('MARIO\n' + this.score.toString().padStart(6, '0'));
	}

	updateTimer() {
		if (!this.timeLeftText || this.timeLeft <= 0 || this.timeLeftText.stopped || this.playerBlocked) return;

		if (this.timeLeft <= 100 && !this.timeLeftText?.hurry) {
			this.timeLeftText.hurry = true;
			this.registry.get('musicGroup').musicTheme.stop();
			this.registry.get('musicGroup').undergroundMusicTheme.stop();
			this.registry.get('soundsEffectGroup').timeWarningSound.play();
			setTimeout(() => {
				this.registry.get('musicGroup').hurryMusicTheme.play();
			}, 2400);
		}

		if (!this.timeLeftText.stopped) {
			this.timeLeft--;
			this.timeLeftText.setText('TIME\n' + this.timeLeft.toString().padStart(3, '0'));
		}

		setTimeout(() => {
			this.hudInstance.updateTimer.call(this);
		}, 1000);
	}

	addToScore(num, originObject) {
		for (let i = 1; i <= num; i++) {
			setTimeout(() => {
				this.score++;
				this.updateScore();
			}, i);
		}

		if (!originObject) return;

		const textEffect = this.add.text(originObject.getBounds().x, originObject.getBounds().y, num, {
			fontFamily: 'pixel_nums',
			fontSize: this.screenWidth / 150,
			align: 'center',
		});

		textEffect.setOrigin(0).smoothed = true;
		textEffect.depth = 5;

		this.tweens.add({
			targets: textEffect,
			duration: 600,
			y: textEffect.y - this.screenHeight / 6.5,
			onComplete: () => {
				this.tweens.add({
					targets: textEffect,
					duration: 100,
					alpha: 0,
					onComplete: () => {
						textEffect.destroy();
					},
				});
			},
		});
	}

	// Game over functions

	gameOverScreen(outOfTime = false) {
		if (localStorage.getItem('high-score') !== null) {
			if (localStorage.getItem('high-score') < this.score) {
				localStorage.setItem('high-score', this.score);
				this.highScoreText.setText('NEW HIGH SCORE!\n' + this.score.toString().padStart(6, '0'));
			}
		} else {
			localStorage.setItem('high-score', this.score);
		}

		const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
		let gameOverScreen = this.add
			.rectangle(
				this.cameras.main.width / 2, // Center the rectangle horizontally
				this.cameras.main.height / 2, // Center the rectangle vertically
				this.cameras.main.width, // Width of the whole screen
				this.cameras.main.height, // Height of the whole screen
				0x000000, // Black color
			)
			.setScrollFactor(0);

		gameOverScreen.alpha = 0;
		gameOverScreen.depth = 4;
		this.tweens.add({
			targets: gameOverScreen,
			duration: 200,
			alpha: 1,
		});
		this.add
			.bitmapText(
				screenCenterX,
				this.screenHeight / 3,
				'carrier_command',
				outOfTime ? 'TIME UP' : 'GAME OVER',
				this.screenWidth / 30,
			)
			.setOrigin(0.5).depth = 5;
		this.add
			.bitmapText(screenCenterX, this.screenHeight / 2, 'carrier_command', '> PLAY AGAIN', this.screenWidth / 50)
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => location.reload()).depth = 5;
		this.add
			.bitmapText(screenCenterX, this.screenHeight / 1.7, 'carrier_command', '> SCREENSHOT', this.screenWidth / 50)
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => this.getScreenshot()).depth = 5;
	}

	gameOverFunc() {
		this.timeLeftText.stopped = true;
		this.player.anims.play('hurt', true);
		this.player.body.enable = false;
		this.finalFlagMast.body.enable = false;
		let goombas = this.goombasGroup.getChildren();
		for (let i = 0; i < goombas.length; i++) {
			goombas[i].anims.stop();
			goombas[i].body.enable = false;
		}
		let platformPieces = this.platformGroup.getChildren();
		for (let i = 0; i < platformPieces.length; i++) {
			platformPieces[i].body.enable = false;
		}
		let blocks = this.blocksGroup.getChildren();
		for (let i = 0; i < blocks.length; i++) {
			blocks[i].body.enable = false;
		}
		let misteryBlocks = this.misteryBlocksGroup.getChildren();
		for (let i = 0; i < misteryBlocks.length; i++) {
			misteryBlocks[i].body.enable = false;
		}
		this.player.body.setSize(16, 16).setOffset(0);
		this.player.setVelocityX(0);
		setTimeout(() => {
			this.player.body.enable = true;
			this.player.setVelocityY(-this.velocityY * 1.1);
		}, 500);
		this.registry.get('musicGroup').musicTheme.stop();
		this.registry.get('musicGroup').undergroundMusicTheme.stop();
		this.registry.get('musicGroup').hurryMusicTheme.stop();
		this.registry.get('musicGroup').gameOverSong.play();
		setTimeout(() => {
			this.player.depth = 0;
			this.hudInstance.gameOverScreen.call(this, this.timeLeft <= 0);
			this.physics.pause();
		}, 3000);
		return;
	}

	winScreen() {
		if (localStorage.getItem('high-score') !== null) {
			if (localStorage.getItem('high-score') < this.score) {
				localStorage.setItem('high-score', this.score);
				this.highScoreText.setText('NEW HIGH SCORE!\n' + this.score.toString().padStart(6, '0'));
			}
		} else {
			localStorage.setItem('high-score', this.score);
			this.highScoreText.setText('NEW HIGH SCORE!\n' + this.score.toString().padStart(6, '0'));
		}

		const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
		let winScreen = this.add
			.rectangle(
				this.cameras.main.width / 2, // Center the rectangle horizontally
				this.cameras.main.height / 2, // Center the rectangle vertically
				this.cameras.main.width, // Width of the whole screen
				this.cameras.main.height, // Height of the whole screen
				0x000000, // Black color
			)
			.setScrollFactor(0);
		winScreen.alpha = 0;
		winScreen.depth = 4;
		this.tweens.add({
			targets: winScreen,
			duration: 300,
			alpha: 1,
		});
		this.add
			.bitmapText(screenCenterX, this.screenHeight / 3, 'carrier_command', 'YOU WON!', this.screenWidth / 30)
			.setOrigin(0.5).depth = 5;
		this.add
			.bitmapText(screenCenterX, this.screenHeight / 2, 'carrier_command', '> PLAY AGAIN', this.screenWidth / 50)
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => location.reload()).depth = 5;
		this.add
			.bitmapText(screenCenterX, this.screenHeight / 1.7, 'carrier_command', '> SCREENSHOT', this.screenWidth / 50)
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => this.getScreenshot()).depth = 5;
	}

	getScreenshot() {
		html2canvas(document.getElementById('app')).then((canvas) => {
			// create a link to download the image
			var link = document.createElement('a');
			link.download = 'screenshot.png';
			link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
			link.click();
		});
	}
}
