import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	base: './',
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '../'),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					phaser: ['phaser'],
				},
			},
		},
	},
	server: {
		port: 8080,
	},
});
