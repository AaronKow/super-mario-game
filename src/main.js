import { Boot } from '@/src/scenes/Boot';
import { Preloader } from '@/src/scenes/Preloader';
import { MainMenu } from '@/src/scenes/MainMenu';
import { Game } from '@/src/scenes/Game';
import { config } from '@/src/config';

export default new Phaser.Game({ ...config, scene: [Boot, Preloader, MainMenu, Game] });
