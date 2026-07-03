const { PermissionsBitField, ChannelType } = require("discord.js");
const { SlashCommandBuilder } = require('discord.js');
const { registerShameChannel } = require("../DAL/databaseApi");
const { logActivity } = require("../DAL/logApi");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shame')
		.setDescription('Specify a channel for public "shame" posts when a user is kicked, timed out, or banned. Omit "to" to disable.')
        .addChannelOption(option =>
            option.setName("to")
                .setDescription("The channel to post shame messages in. Make sure the bot has access to it!"))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
    /**
     *
     * @param {Interaction} interaction
     * @returns
     */
	async execute(interaction) {
        try {
            const target = interaction.options.getChannel("to");

            if (target) {
                // shame channel requested
                const channel = await interaction.guild.channels.fetch(target.id);

                if (!channel) {
                    await interaction.reply({ content: 'I could not find the channel <#' + target.id + '>.\n\nI need the following permissions on the shame channel:\n- VIEW_CHANNEL\n- SEND_MESSAGES\n- EMBED_LINKS', ephemeral: true });
                    return;
                }

                if (channel.type !== ChannelType.GuildText) {
                    await interaction.reply({ content: '<#' + target.id + '> is not a text channel.  Please specify a text channel, then try again', ephemeral: true });
                    return;
                }

                const currentPermissions = channel.permissionsFor(interaction.member.user.id);

                if (!currentPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    await interaction.reply({ content: "You need the MANAGE_CHANNELS permission to run this command", ephemeral: true });
                    return;
                }

                const canViewChannel = await channel.permissionsFor(interaction.client.user.id).has(PermissionsBitField.Flags.ViewChannel);
                const canSendMessages = await channel.permissionsFor(interaction.client.user.id).has(PermissionsBitField.Flags.SendMessages);
                const canSendEmbeds = await channel.permissionsFor(interaction.client.user.id).has(PermissionsBitField.Flags.EmbedLinks);

                if (!canViewChannel || !canSendMessages || !canSendEmbeds) {
                    await interaction.reply({ content: `I'm missing permissions on <#${target.id}> where shame posts should go. I need the following permissions:\n- VIEW_CHANNEL: ${canViewChannel ? "GRANTED" : "MISSING"}\n- SEND_MESSAGES: ${canSendMessages ? "GRANTED" : "MISSING"}\n- EMBED_LINKS: ${canSendEmbeds ? "GRANTED" : "MISSING"}\n\nOnce these permissions are corrected, re-run the /shame command.` });
                    return;
                }

                await registerShameChannel(interaction.guild.id, target.id);

                await logActivity(
                    interaction.client,
                    interaction.guild.id,
                    "Shame channel enabled",
                    `<@${interaction.user.id}> used:\n ${interaction.toString()}`,
                    "#007bff"
                );

                await interaction.reply({ content: `From now on, anyone kicked, timed out, or banned will be publicly (and lovingly) roasted in <#${target.id}>. 🔨🎪`, ephemeral: false });
                return;
            } else {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    await interaction.reply({ content: "You need the MANAGE_CHANNELS permission to run this command", ephemeral: true });
                    return;
                }

                // turn off shame messages
                await registerShameChannel(interaction.guild.id, null);

                await interaction.reply({ content: 'Shame messages for this server have been disabled', ephemeral: false });
            }
        } catch (err) {
            console.log(`Error in /shame: ${err}`);
            await interaction.reply({ content: 'An unknown error occurred. Please let the developer know', ephemeral: false });
        }
	},
};
