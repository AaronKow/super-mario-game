export default (screenWidth, screenHeight, elementWidth, elementHeight, yOffsetFactor) => {
	return {
		x: screenWidth / 2 - elementWidth / 2,
		y: (screenHeight / 2) * yOffsetFactor - elementHeight / 2,
	};
};
