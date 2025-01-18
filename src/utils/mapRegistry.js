export default function (context, keys) {
	keys.forEach((key) => {
		context[key] = context.registry.get(key);
	});
}
