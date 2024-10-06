// /src/utils/permissions.js
export function checkPodcastChatPermissions(member, requiredRoleId) {
    return member.roles.cache.has(requiredRoleId) || member.permissions.has(PermissionsBitField.Flags.ManageMessages);
}