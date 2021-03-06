const Discord = require("discord.js");

module.exports = {
	id: "nick-d",
	// permissions: ["MANAGE_NICKNAMES"],
	async execute(interaction) {
		const { guild, message, member, client } = interaction;

		const moduleTable = client.db.table("module");
		if (!(await moduleTable.get("nickname")))
			return interaction.reply({
				content: `You cannot do this by now`,
				ephemeral: true,
			});

		const settingsTable = client.db.table("settings");
		if (!(await settingsTable.has("nickname")))
			return interaction.reply({
				content: `You cannot do this by now`,
				ephemeral: true,
			});

		if (!member.permissions.has(Discord.Permissions.FLAGS.MANAGE_NICKNAMES))
			return interaction.reply({
				content: `You dont have the required right to do that.`,
				ephemeral: true,
			});

		const reqEmbed = message.embeds.shift();
		const reqId = reqEmbed.fields.find((f) => f.name === "ID")["value"];
		const reqNewNick = reqEmbed.fields.find((f) => f.name === "New")["value"];
		const reqOldNick = reqEmbed.fields.find((f) => f.name === "Old")["value"];

		const reqDecReasonInput = new Discord.TextInputComponent()
			.setCustomId("reason")
			// The label is the prompt the user sees for this input
			.setLabel("Lý do từ chối")
			// Short means only a single line of text
			.setStyle("PARAGRAPH");

		const reqDecReasonRow = new Discord.MessageActionRow().addComponents(
			reqDecReasonInput
		);

		const modal = new Discord.Modal()
			.setCustomId("nick-r")
			.setTitle("Nickname Decline Reason")
			.addComponents(reqDecReasonRow);

		await interaction.showModal(modal);

		const filter = (i) =>
			i.customId === "nick-r" && i.user.id === interaction.user.id;

		interaction
			.awaitModalSubmit({ filter, time: 300_000 })
			.then(async (interaction) => {
				const reqUser = await client.users.fetch(reqId);
				const reason = interaction.fields.getTextInputValue("reason");
				reqUser
					.send({
						content: `❌ ${client.displayName(
							member
						)} đã từ chối yêu cầu đổi tên của bạn.${
							reason.length == 0 ? "" : `\n**Lý do**: \`\`\`${reason}\`\`\``
						}`,
					})
					.then(() => {
						const decline_embed = new Discord.MessageEmbed()
							.setTitle(`Nickname Request Declined (${reqId})`)
							.setColor("RED")
							.addField(`Changed for`, reqUser.tag)
							.addField(`From`, reqOldNick)
							.addField(`To`, reqNewNick)
							.addField("Reason", reason.length == 0 ? "None" : reason)
							.setFooter({
								text: `Declined by ${interaction.user.tag}`,
							});

						interaction.update({
							embeds: [decline_embed],
							components: [],
						});
					})
					.catch((e) => {
						interaction.reply({
							content: `${e.message}`,
							ephemeral: true,
						});
					});
			})
			.catch(console.error);
		// console.log(reqId, reqOldNick, reqNewNick);
	},
};
