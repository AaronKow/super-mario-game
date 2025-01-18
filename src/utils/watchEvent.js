export default function (context, event) {
	context.events.on(event, (val) => {
		context[event] = val;
		context.registry.set(event, val);
	});
}
